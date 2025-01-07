import { Router } from 'express'

import knowledgeService from '../services/knowledge'

const router = Router()

// 添加路由日志
router.use((req, res, next) => {
  console.log('Knowledge route accessed:', req.method, req.url)
  next()
})

// 获取所有知识库
router.get('/bases', async (req, res) => {
  try {
    console.log('Getting knowledge bases...')
    const bases = await knowledgeService.getKnowledgeBases()
    console.log('Retrieved bases:', bases)
    res.json(bases)
  } catch (error) {
    console.error('Failed to get knowledge bases:', error)
    res.status(500).json({ error: 'Failed to get knowledge bases' })
  }
})

// 搜索知识库
router.get('/search', async (req, res) => {
  try {
    const { baseId, query, limit } = req.query
    const results = await knowledgeService.search(baseId as string, query as string, Number(limit) || 5)
    res.json(results)
  } catch (error) {
    res.status(500).json({ error: 'Search failed' })
  }
})

// 添加RAG对话接口
router.post('/chat', async (req, res) => {
  try {
    const { baseId, modelId, query } = req.body

    if (!baseId || !modelId || !query) {
      return res.status(400).json({
        error: 'Missing required parameters: baseId, modelId and query are required'
      })
    }

    console.log('RAG Chat request:', { baseId, modelId, query })

    const result = await knowledgeService.chat(baseId, modelId, query)

    res.json(result)
  } catch (error) {
    console.error('RAG Chat error:', error)
    res.status(500).json({
      error: 'Chat failed',
      message: error.message
    })
  }
})

export default router
