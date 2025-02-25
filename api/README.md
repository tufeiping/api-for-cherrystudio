# 基于Cherry Studio的模型API服务

本项目基于Cherry Studio(https://github.com/CherryHQ/cherry-studio.git) 的模型API服务，用于提供模型API接口，支持RAG对话、知识库搜索等功能。
将Cherry Studio作为大语言模型配置和RAG的客户端，然后通过本 **API服务** 独立提供服务，方便其他项目调用。

## 开发调试及服务

1. 安装依赖:

```bash
cd api
npm install
```

2. 开发模式运行:

```bash
npm run dev
```

## 关键点

1. 数据存储结构：

```
📁 data.json
├── 📁 localStorage
│   └── 📁 persist:cherry-studio
│       ├── 📁 llm
│       │   └── 📁 providers     // 模型提供商列表
│       └── 📁 knowledge
│           └── 📁 bases         // 知识库数据
```

2. 数据读取逻辑：

```typescript
// 主要路径
config.localStorage['persist:cherry-studio']
  -> JSON.parse(persistData.llm)
  -> llmData.providers
  -> filter(p => p.enabled !== false)  // 只返回已启用的提供商
```

数据库文件位于 Data/level 目录下

3. 关键改进：

- 从 `llm` 字段读取而不是 `providers`
- 过滤掉未启用的提供商
- 隐藏敏感信息 (apiKey)
- 详细的日志输出

4. 模型提供商 API 端点：

```
GET /api/provider/providers // 获取所有提供商
GET /api/provider/providers/:id // 获取特定提供商
```

5. 知识库 API 端点：

```
GET /api/knowledge/bases // 获取所有知识库
GET /api/knowledge/bases/:id // 获取特定知识库
GET /api/knowledge/search // 搜索知识库
POST /api/knowledge/chat // RAG对话
```

6. API 调用示例

获取知识库列表

```bash
curl -H "x-api-key: your-api-key" http://localhost:4000/api/knowledge/bases
```

搜索知识库

```bash
curl -H "x-api-key: your-api-key" \
  "http://localhost:4000/api/knowledge/search?baseId=your-base-id&query=your-search-query"
```

RAG对话

```bash
curl -X POST -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "baseId": "your-base-id",
    "modelId": "silicon",
    "query": "your question"
  }' \
  http://localhost:4000/api/knowledge/chat
```

> 参数说明： baseId 知识库ID，modelId 模型ID，query 查询内容

如果知识库中没有找到相关内容，则会自动从模型中生成回答。

```bash
curl -X POST -H "x-api-key: your-api-key-here"   -H "Content-Type: application/json"   -d '{
    "baseId": "U2dpV8NdLmHExqrbPkKAo",
    "modelId": "silicon",
    "query": "能否帮我证明一下这个公式：\lim_{x \to 0} \frac{\sin(x)}{x} = 1"
  }'   http://localhost:4000/api/knowledge/chat
```

![API Chat](./screenshot-chat.png)

## .env

.env 文件用于配置API服务信息。

```
PORT=4000
BACKUP_PATH=H:/knowledge-base
```

## 如何使用

打开Cherry Studio，配置模型和知识库，完成RAG过程，然后利用Cherry Studio的数据备份功能，将数据导出为zip文件，然后上传到服务器。
配置 .env 文件的 BACKUP_PATH 为服务器上的知识库**解压后**的路径，然后启动API服务。

![Cherry Studio 数据备份](./screenshot.png)
