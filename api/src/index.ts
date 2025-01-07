import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'

import knowledgeRouter from './routes/knowledge'
import providerRouter from './routes/provider'

console.log('Starting server initialization...')

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
})

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error)
})

try {
  // 加载环境变量
  dotenv.config()
  console.log('Environment variables loaded')

  // 检查但不强制要求 BACKUP_PATH
  if (process.env.BACKUP_PATH) {
    console.log('Using backup path:', process.env.BACKUP_PATH)
  } else {
    console.warn('BACKUP_PATH not set, will use default path')
  }

  const app = express()
  const port = process.env.PORT || 4000
  console.log('Port configured:', port)

  // 中间件
  app.use(cors())
  app.use(express.json())
  console.log('Middleware configured')

  // 配置路由
  app.use('/api/knowledge', knowledgeRouter)
  app.use('/api/provider', providerRouter)
  console.log('Routes configured')

  // 错误处理中间件
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server error:', err.stack)
    res.status(500).json({ error: 'Something broke!' })
  })

  // 404 处理
  app.use((req: express.Request, res: express.Response) => {
    console.log('404 Not Found:', req.method, req.url) // 添加请求日志
    res.status(404).json({ error: 'Not Found' })
  })

  // 启动服务器
  app
    .listen(port, () => {
      console.log(`Server is running on port ${port}`)
    })
    .on('error', (error) => {
      console.error('Failed to start server:', error)
    })
} catch (error) {
  console.error('Initialization error:', error)
}
