import path from 'node:path'

import { LibSqlDb } from '@llm-tools/embedjs-libsql'
import dotenv from 'dotenv'
import fs from 'fs-extra'
import { Level } from 'level'
import { OpenAI } from 'openai'
const sqlite3 = await import('sqlite3')
const { Database } = sqlite3.default.verbose()

import providerService from './provider'
import { OpenAiEmbeddings, RAGApplication, RAGApplicationBuilder } from './rag'

// 确保在最开始就加载环境变量
dotenv.config()

// 确保类型定义
interface KnowledgeBaseParams {
  id: string
  model: string
  apiKey: string
  apiVersion?: string
  baseURL: string
  dimensions: number
}

class KnowledgeService {
  private storageDir: string
  private dataPath: string
  private levelDir: string
  private applications: Map<string, RAGApplication>

  constructor() {
    console.log('Initializing KnowledgeService...')

    // 检查必要的环境变量
    const requiredEnvVars = ['BACKUP_PATH']
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Required environment variable ${envVar} is not set`)
      }
    }

    const backupPath = process.env.BACKUP_PATH
    console.log('Using backup path:', backupPath)
    this.storageDir = path.join(backupPath, 'Data', 'KnowledgeBase')
    this.dataPath = path.join(backupPath, 'data.json')
    this.levelDir = path.join(backupPath, 'Data', 'level')

    // 确保存储目录存在
    if (!fs.existsSync(this.storageDir)) {
      console.log('Creating storage directory:', this.storageDir)
      fs.mkdirSync(this.storageDir, { recursive: true })
    }

    // 验证文件是否存在
    if (!fs.existsSync(this.dataPath)) {
      throw new Error(`Data file not found: ${this.dataPath}`)
    }
    if (!fs.existsSync(this.levelDir)) {
      throw new Error(`LevelDB directory not found: ${this.levelDir}`)
    }

    console.log('Storage directory:', this.storageDir)
    console.log('Data file path:', this.dataPath)
    console.log('LevelDB directory:', this.levelDir)

    // 测试 LevelDB 连接
    this.testLevelDBConnection()

    this.applications = new Map()
  }

  private async testLevelDBConnection() {
    try {
      const db = new Level(this.levelDir)
      await db.open()
      console.log('Successfully connected to LevelDB')

      // 列出所有键
      const keys = []
      for await (const key of db.keys()) {
        keys.push(key)
      }
      console.log('LevelDB keys:', keys)

      await db.close()
    } catch (error) {
      console.error('Error connecting to LevelDB:', error)
      throw error
    }
  }

  async getKnowledgeBases() {
    try {
      const data = await fs.promises.readFile(this.dataPath, 'utf-8')
      console.log('Raw data file content:', data.substring(0, 200))

      const config = JSON.parse(data)
      console.log('Parsed config structure:', Object.keys(config))

      let bases = []

      // 从 persist:cherry-studio 中读取数据
      if (config.localStorage?.['persist:cherry-studio']) {
        console.log('Found persist:cherry-studio data')
        try {
          const persistData = JSON.parse(config.localStorage['persist:cherry-studio'])
          console.log('Persist data keys:', Object.keys(persistData))

          if (persistData.knowledge) {
            const knowledge = JSON.parse(persistData.knowledge)
            console.log('Knowledge data keys:', Object.keys(knowledge))

            if (knowledge.bases) {
              console.log('Found bases in knowledge')
              bases = knowledge.bases
            }
          }
        } catch (e) {
          console.error('Error parsing persist data:', e)
        }
      }
      // 备用方案：尝试其他可能的位置
      else if (config.localStorage?.['knowledge']) {
        console.log('Looking in localStorage.knowledge...')
        try {
          const knowledge = JSON.parse(config.localStorage['knowledge'])
          if (knowledge.bases) {
            console.log('Found bases in localStorage.knowledge')
            bases = knowledge.bases
          }
        } catch (e) {
          console.error('Error parsing localStorage.knowledge:', e)
        }
      } else if (config.knowledge?.bases) {
        console.log('Found bases in config.knowledge')
        bases = config.knowledge.bases
      } else if (Array.isArray(config.bases)) {
        console.log('Found bases array directly in config')
        bases = config.bases
      }

      console.log('Final bases count:', bases.length)
      if (bases.length > 0) {
        console.log('First base example:', JSON.stringify(bases[0], null, 2))
      }

      return bases
    } catch (error) {
      console.error('Error reading knowledge bases:', error)
      return []
    }
  }

  private async initRagApplication(baseId: string) {
    try {
      // 1. 获取知识库配置
      const bases = await this.getKnowledgeBases()
      const base = bases.find((b) => b.id === baseId)
      if (!base) {
        throw new Error(`Knowledge base not found: ${baseId}`)
      }

      // 2. 获取模型配置
      const provider = await providerService.getProviderByModel(base.model.id)
      if (!provider) {
        throw new Error(`Provider not found for model: ${base.model.id}`)
      }

      console.log('Using provider:', {
        id: provider.id,
        type: provider.type,
        model: base.model.id
      })

      // 3. 构建 RAG 应用参数
      const params = {
        id: baseId,
        model: base.model.id,
        apiKey: provider.apiKey,
        baseURL: provider.apiHost,
        dimensions: base.dimensions || 1536
      }

      // 4. 创建 RAG 应用实例
      const app = await this.getRagApplication(params)
      this.applications.set(baseId, app)

      return app
    } catch (error) {
      console.error('Error initializing RAG application:', error)
      throw error
    }
  }

  async search(baseId: string, query: string, limit: number = 5) {
    try {
      let app = this.applications.get(baseId)
      if (!app) {
        app = await this.initRagApplication(baseId)
      }

      // 获取搜索结果
      const results = await app.search(query, limit)
      console.log('Raw search results:', results)

      // 如果有结果但相似度未定义，手动计算相似度
      const processedResults = results.map((result) => {
        if (result.similarity === undefined) {
          // 为防止未定义的相似度，设置一个默认值
          return {
            ...result,
            similarity: 0.5 // 设置一个中等相似度
          }
        }
        return result
      })

      // 按相似度排序并限制数量
      const sortedResults = processedResults.sort((a, b) => (b.similarity || 0) - (a.similarity || 0)).slice(0, limit)

      console.log('Processed results:', {
        total: results.length,
        processed: sortedResults.length,
        samples: sortedResults.map((r) => ({
          similarity: r.similarity,
          content: r.pageContent.substring(0, 100)
        }))
      })

      return sortedResults
    } catch (error) {
      console.error('Search error:', error)
      return []
    }
  }

  async chat(baseId: string, modelId: string, query: string) {
    try {
      console.log('Starting chat with:', { baseId, modelId, query })

      // 1. 获取模型提供商配置
      const provider = await providerService.getProviderByModel(modelId)
      if (!provider) {
        throw new Error(`Provider not found for model/provider ID: ${modelId}`)
      }

      // 1. 先进行知识检索，增加结果数量
      const searchResults = await this.search(baseId, query, 5) // 增加到5个结果
      console.log('Search results count:', searchResults.length)

      if (!searchResults.length) {
        console.log('No relevant search results found')
        return {
          answer: '抱歉，没有找到足够相关的知识内容来回答您的问题。请尝试换个方式提问，或者联系技术支持。',
          references: []
        }
      }

      // 2. 构建更详细的上下文
      const context = searchResults
        .map(
          (item: any, index: number) =>
            `参考资料 ${index + 1}:\n内容: ${item.pageContent}\n来源: ${item.metadata.source}\n相关度: ${item.similarity.toFixed(2)}`
        )
        .join('\n\n')

      // 3. 构建提示词
      const prompt = `
基于以下参考资料回答用户问题。如果无法从参考资料中得到答案，请明确说明。

参考资料:
${context}

用户问题: ${query}

请提供准确、客观的回答。
`

      // 5. 调用模型生成回答
      const openai = new OpenAI({
        apiKey: provider.apiKey,
        baseURL: provider.baseURL
      })

      const completion = await openai.chat.completions.create({
        model: provider.model.id,
        messages: [
          { role: 'system', content: '你是一个专业的助手,善于基于参考资料回答问题。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })

      // 6. 返回结果
      return {
        answer: completion.choices[0].message.content,
        references: searchResults.map((item: any) => ({
          content: item.pageContent,
          source: item.metadata.source
        }))
      }
    } catch (error) {
      console.error('Chat error:', error)
      throw error
    }
  }

  private getRagApplication = async ({
    id,
    model,
    apiKey,
    baseURL,
    dimensions
  }: KnowledgeBaseParams): Promise<RAGApplication> => {
    console.log('Creating RAG application with params:', {
      id,
      model,
      baseURL,
      dimensions
    })

    // 检查数据库文件是否存在
    const dbPath = path.join(this.storageDir, `${id}`)
    if (!fs.existsSync(dbPath)) {
      throw new Error(`Vector database file not found: ${dbPath}. Please import knowledge base first.`)
    }

    // 使用 LibSqlDb 打开数据库，与客户端保持一致
    const vectorDb = new LibSqlDb({
      path: dbPath
    })

    // 包装向量数据库接口
    const wrappedVectorDb = {
      search: async (embedding: number[], limit: number) => {
        try {
          // 直接使用 LibSqlDb 的搜索方法
          return await vectorDb.similaritySearch(embedding, limit)
        } catch (error) {
          console.error('Error in vector database search:', error)
          throw error
        }
      }
    }

    // 获取 Ollama 的 embedding 模型配置
    const ollamaProvider = await providerService.getProvider('ollama')
    if (!ollamaProvider) {
      console.log('Ollama provider not found, using default local configuration')
      // 使用默认的本地 Ollama 配置
      ollamaProvider = {
        id: 'ollama',
        name: 'Ollama',
        type: 'openai',
        apiKey: 'empty',
        apiHost: 'http://localhost:11434/v1',
        models: [
          {
            id: 'nomic-embed-text:latest',
            name: 'nomic-embed-text:latest',
            provider: 'ollama',
            group: 'nomic-embed-text',
            type: 'embedding'
          }
        ]
      }
    }

    // 创建嵌入模型实例
    const embeddingModel = new OpenAiEmbeddings({
      apiKey: ollamaProvider.apiKey || 'empty',
      model: 'nomic-embed-text:latest',
      configuration: {
        baseURL: ollamaProvider.apiHost || 'http://localhost:11434/v1',
        headers: {
          'Content-Type': 'application/json'
        }
      },
      dimensions: dimensions || 768 // Ollama nomic-embed-text 默认维度是 768
    })

    // 先打印出实例的所有方法，帮助调试
    console.log('Embedding model methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(embeddingModel)))

    // 包装嵌入模型以匹配接口
    const wrappedEmbeddingModel = {
      embedText: async (text: string) => {
        try {
          return await embeddingModel.embedQuery(text)
        } catch (error) {
          console.error('Error in embedText:', error)
          throw error
        }
      },
      embedTexts: async (texts: string[]) => {
        try {
          return await embeddingModel.embedDocuments(texts)
        } catch (error) {
          console.error('Error in embedTexts:', error)
          throw error
        }
      }
    }

    // 构建 RAG 应用
    const app = new RAGApplicationBuilder()
      .setModel(model)
      .setEmbeddingModel(wrappedEmbeddingModel)
      .setVectorDatabase(wrappedVectorDb) // 使用包装后的向量数据库
      .build()

    console.log('RAG application created successfully')
    return app
  }
}

// 创建单例
const knowledgeService = new KnowledgeService()
export default knowledgeService
