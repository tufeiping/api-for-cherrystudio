import os from 'node:os'
import path from 'node:path'

import dotenv from 'dotenv'

dotenv.config()

// 获取用户数据目录
const getUserDataPath = () => {
  const platform = process.platform

  switch (platform) {
    case 'win32':
      // Windows: C:\Users\<username>\AppData\Roaming\CherryStudio
      return path.join(process.env.APPDATA || '', 'CherryStudio')
    case 'darwin':
      // macOS: ~/Library/Application Support/CherryStudio
      return path.join(os.homedir(), 'Library/Application Support/CherryStudio')
    default:
      // Linux: ~/.config/CherryStudio
      return path.join(os.homedir(), '.config/CherryStudio')
  }
}

const config = {
  port: process.env.PORT || 3000,
  userDataPath: process.env.DATA_PATH || getUserDataPath(),
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiBaseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100
  }
}

export default config
