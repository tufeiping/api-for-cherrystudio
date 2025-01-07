import { OpenAiEmbeddings } from '@llm-tools/embedjs-openai'
import { LibSqlDb } from '@llm-tools/embedjs-libsql'

interface EmbeddingModel {
  embedText(text: string): Promise<number[]>
  embedTexts(texts: string[]): Promise<number[][]>
}

interface VectorDatabase {
  search(embedding: number[], limit: number): Promise<any[]>
}

export class RAGApplicationBuilder {
  private model: string = ''
  private embeddingModel: EmbeddingModel | null = null
  private vectorDb: VectorDatabase | null = null

  setModel(model: string) {
    this.model = model
    return this
  }

  setEmbeddingModel(model: EmbeddingModel) {
    this.embeddingModel = model
    return this
  }

  setVectorDatabase(db: VectorDatabase) {
    this.vectorDb = db
    return this
  }

  build(): RAGApplication {
    if (!this.embeddingModel) {
      throw new Error('Embedding model is required')
    }
    if (!this.vectorDb) {
      throw new Error('Vector database is required')
    }
    return new RAGApplication(this.model, this.embeddingModel, this.vectorDb)
  }
}

export class RAGApplication {
  constructor(
    private model: string,
    private embeddingModel: EmbeddingModel,
    private vectorDb: VectorDatabase
  ) {}

  async search(query: string, limit: number = 5) {
    try {
      console.log('Generating embedding for query:', query)
      const embedding = await this.embeddingModel.embedText(query)
      console.log('Embedding generated, length:', embedding.length)

      console.log('Searching vector database...')
      const results = await this.vectorDb.search(embedding, limit)
      console.log('Search completed, results count:', results.length)

      return results
    } catch (error) {
      console.error('RAG search error:', error)
      throw error
    }
  }
}

export function getInstanceName(baseURL: string): string {
  const url = new URL(baseURL)
  return url.hostname
}

export { OpenAiEmbeddings, LibSqlDb }
