import path from 'node:path'

import dotenv from 'dotenv'
import fs from 'fs-extra'

dotenv.config()

export interface Provider {
  id: string
  name: string
  type: 'openai' | 'azure' | 'gemini' | 'ollama'
  apiKey?: string
  apiVersion?: string
  baseURL?: string
  models: Model[]
}

export interface Model {
  id: string
  name: string
  contextWindow: number
  dimensions?: number
  type: 'chat' | 'embedding'
}

class ProviderService {
  private dataPath: string
  private providers: Provider[] = []

  constructor() {
    console.log('Initializing ProviderService...')

    const backupPath = process.env.BACKUP_PATH
    if (!backupPath) {
      throw new Error('BACKUP_PATH environment variable is not set')
    }

    this.dataPath = path.join(backupPath, 'data.json')

    // 验证文件是否存在
    if (!fs.existsSync(this.dataPath)) {
      throw new Error(`Data file not found: ${this.dataPath}`)
    }

    console.log('Data file path:', this.dataPath)
    this.loadProviders()
  }

  private async loadProviders() {
    try {
      const data = await fs.promises.readFile(this.dataPath, 'utf-8')
      console.log('Raw data file content:', data.substring(0, 200))

      const config = JSON.parse(data)
      console.log('Parsed config structure:', Object.keys(config))

      // 从 persist:cherry-studio 中读取数据
      if (config.localStorage?.['persist:cherry-studio']) {
        console.log('Found persist:cherry-studio data')
        try {
          const persistData = JSON.parse(config.localStorage['persist:cherry-studio'])
          console.log('Persist data keys:', Object.keys(persistData))

          if (persistData.llm) {
            console.log('Found LLM data')
            const llmData = JSON.parse(persistData.llm)
            console.log('LLM data keys:', Object.keys(llmData))

            if (llmData.providers) {
              console.log('Found providers in LLM data, count:', llmData.providers.length)
              this.providers = llmData.providers.filter((p: Provider) => p.enabled !== false)
              console.log('Filtered enabled providers count:', this.providers.length)
            }
          } else {
            console.log('No LLM data found in persist data')
          }
        } catch (e) {
          console.error('Error parsing persist data:', e)
        }
      }

      // 备用方案：尝试其他可能的位置
      if (this.providers.length === 0) {
        console.log('Trying fallback locations...')

        if (config.llm?.providers) {
          console.log('Found providers directly in LLM config')
          this.providers = config.llm.providers.filter((p: Provider) => p.enabled !== false)
        } else if (config.localStorage?.llm) {
          console.log('Found LLM in localStorage')
          try {
            const llmData = JSON.parse(config.localStorage.llm)
            if (llmData.providers) {
              this.providers = llmData.providers.filter((p: Provider) => p.enabled !== false)
            }
          } catch (e) {
            console.error('Error parsing localStorage LLM:', e)
          }
        }
      }

      // 打印结果
      console.log('Final providers count:', this.providers.length)
      if (this.providers.length > 0) {
        console.log('First provider example:', JSON.stringify(this.providers[0], null, 2))
      } else {
        console.warn('No providers found in any location')
      }
    } catch (error) {
      console.error('Error loading providers:', error)
      throw error
    }
  }

  // 获取所有提供商配置
  async getProviders(): Promise<Provider[]> {
    return this.providers.map((provider) => ({
      ...provider,
      apiKey: '******' // 隐藏 API Key
    }))
  }

  // 获取特定提供商的配置
  async getProvider(providerId: string): Promise<Provider | null> {
    const provider = this.providers.find((p) => p.id === providerId)
    if (provider) {
      return {
        ...provider,
        apiKey: provider.apiKey // 不要隐藏 API Key，因为这是内部调用
      }
    }
    return null
  }

  // 获取特定提供商的所有模型
  async getModels(providerId: string): Promise<Model[]> {
    const provider = this.providers.find((p) => p.id === providerId)
    return provider?.models || []
  }

  // 获取特定类型的模型
  async getModelsByType(type: 'chat' | 'embedding'): Promise<Model[]> {
    return this.providers.flatMap((provider) => provider.models.filter((model) => model.type === type))
  }

  // 获取特定模型的配置
  async getModelConfig(providerId: string, modelId: string): Promise<Model | null> {
    const provider = this.providers.find((p) => p.id === providerId)
    return provider?.models.find((m) => m.id === modelId) || null
  }

  // 添加获取特定模型的提供商方法
  async getProviderByModel(modelId: string) {
    // 如果 modelId 是 provider ID，直接返回该 provider
    const provider = this.providers.find((p) => p.id === modelId)
    if (provider) {
      // 查找嵌入模型，优先使用 nomic-embed-text
      const embeddingModel =
        provider.models.find((m) => m.id === 'nomic-embed-text:latest') ||
        provider.models.find((m) => m.type === 'embedding') ||
        provider.models[0]
      return {
        apiKey: provider.apiKey,
        baseURL: provider.apiHost,
        model: embeddingModel
      }
    }

    // 否则搜索所有 provider 的 models
    for (const provider of this.providers) {
      const model = provider.models.find((m) => m.id === modelId)
      if (model) {
        // 如果找到了模型，同时返回该 provider 的嵌入模型
        const embeddingModel =
          provider.models.find((m) => m.id === 'nomic-embed-text:latest') ||
          provider.models.find((m) => m.type === 'embedding') ||
          model
        return {
          apiKey: provider.apiKey,
          baseURL: provider.apiHost,
          model: embeddingModel
        }
      }
    }
    return null
  }
}

// 创建单例
const providerService = new ProviderService()

// 导出 getProviderByModel 函数
export const getProviderByModel = async (modelId: string) => {
  return providerService.getProviderByModel(modelId)
}

export default providerService
