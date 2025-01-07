import { Router } from 'express'
import providerService from '../services/provider'

const router = Router()

// 添加路由日志
router.use((req, res, next) => {
  console.log('Provider route accessed:', req.method, req.url)
  next()
})

// 获取所有提供商
router.get('/providers', async (req, res) => {
  try {
    const providers = await providerService.getProviders()
    res.json(providers)
  } catch (error) {
    console.error('Failed to get providers:', error)
    res.status(500).json({ error: 'Failed to get providers' })
  }
})

// 获取特定提供商
router.get('/providers/:providerId', async (req, res) => {
  try {
    const provider = await providerService.getProvider(req.params.providerId)
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' })
    }
    res.json(provider)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get provider' })
  }
})

// 获取所有模型
router.get('/providers/:providerId/models', async (req, res) => {
  try {
    const models = await providerService.getModels(req.params.providerId)
    res.json(models)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get models' })
  }
})

// 获取特定类型的模型
router.get('/models/:type', async (req, res) => {
  try {
    const type = req.params.type as 'chat' | 'embedding'
    if (type !== 'chat' && type !== 'embedding') {
      return res.status(400).json({ error: 'Invalid model type' })
    }
    const models = await providerService.getModelsByType(type)
    res.json(models)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get models' })
  }
})

export default router
