# 基于Cherry Studio的模型API服务

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

3. API 调用示例:

```bash
# 获取知识库列表
curl -H "x-api-key: your-api-key" http://localhost:3000/api/knowledge/bases

# 搜索知识库
curl -H "x-api-key: your-api-key" \
  "http://localhost:3000/api/knowledge/search?baseId=your-base-id&query=your-search-query"

# RAG对话
curl -X POST -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "baseId": "your-base-id",
    "modelId": "silicon",
    "query": "your question"
  }' \
  http://localhost:3000/api/knowledge/chat
```

> 参数说明： baseId 知识库ID，modelId 模型ID，query 查询内容

## 关键点：

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
GET /api/provider/providers            // 获取所有提供商
GET /api/provider/providers/:id        // 获取特定提供商
GET /api/provider/providers/:id/models // 获取提供商的模型
GET /api/provider/models/:type         // 获取特定类型的模型
```
