# CodeGPT - 基于检索增强生成的智能代码问答系统

> 毕设项目：基于检索增强生成（RAG）技术的智能代码问答系统设计与实现

## 📋 项目简介

CodeGPT 是一个智能代码问答系统，通过检索增强生成技术，能够从代码库中检索相关信息，结合大语言模型生成准确、有依据的代码答案。系统支持多种编程语言，提供智能代码分块、语义检索和上下文增强的代码问答功能。

## ✨ 核心功能

- 🔍 **智能代码检索**: 基于语义相似度的向量检索，而非简单关键词匹配
- 📚 **多语言支持**: 支持 Python, JavaScript, TypeScript, Java, C++, Go 等主流编程语言
- 🧩 **智能分块**: 按代码结构（函数、类、模块）智能分割，保持语义完整性
- 💬 **上下文增强**: 检索到的代码块作为上下文，提高回答准确性和可解释性
- ⚡ **流式响应**: 实时流式返回生成结果，提升用户体验
- 🎨 **代码高亮**: 前端支持 Markdown 和代码语法高亮显示
- 📝 **来源标注**: 回答中包含代码来源信息，提高可追溯性

## 🛠️ 技术栈

- **前端**: Next.js 15 + React 19 + TypeScript
- **UI**: Tailwind CSS + Radix UI
- **AI**: Vercel AI SDK + Gemini API
- **向量数据库**: Supabase (PostgreSQL + pgvector)
- **嵌入模型**: Gemini text-embedding-004（输出维度 1536）
- **LLM**: Gemini 2.0 Flash
- **文档处理**: LangChain

## 📁 项目结构

```
CodeGPT/
├── app/                    # Next.js App Router
│   ├── api/
│   │   ├── chat/          # 聊天 API（检索 + 生成）
│   │   └── upload/        # 代码上传 API
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 首页（聊天界面）
│
├── components/            # React 组件
│   ├── ui/               # 基础 UI 组件
│   ├── ChatInput.tsx     # 聊天输入
│   └── ChatOutput.tsx    # 聊天输出（Markdown 渲染）
│
├── lib/                  # 工具库
│   ├── code-processor.ts # 代码处理模块
│   └── utils.ts          # 通用工具
│
├── seed.ts               # 数据种子脚本（构建索引）
├── package.json
└── README.md
```

详细结构说明请查看 [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

创建 `.env.local` 文件：

```env
# Supabase（启用邮箱登录 + 个人中心 profiles 表）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_publishable_or_anon_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_secret_or_service_role_key

# DeepSeek（聊天）
DEEPSEEK_API_KEY=your_deepseek_api_key

# Jina（向量检索 embedding，Vercel 可访问）
JINA_API_KEY=your_jina_api_key
# 可选：默认 jina-embeddings-v3
JINA_EMBED_MODEL=jina-embeddings-v3
```

当 `NEXT_PUBLIC_SUPABASE_URL` 与 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 已配置时：

- 中间件使用 **Supabase Auth 会话**（Cookie），登录页为 **邮箱 + 密码**，并提供 **`/register` 注册**。
- 未配置时仍可使用本地演示账号：`admin` / `admin123`（`codegpt_auth` Cookie）。

**Supabase 控制台**：Authentication → Providers 中启用 **Email**。

**用户表**：在 SQL Editor 或通过 MCP 执行 `supabase/migrations/20260205120000_profiles.sql`，会创建 `public.profiles` 及 `auth.users` 注册后的自动写入触发器。

### 3. 初始化数据库

在 Supabase 中执行以下 SQL（向量检索，可与 `supabase_setup.sql` 或本仓库 `supabase/migrations` 脚本一致）：

```sql
-- 创建 chunks 表
CREATE TABLE chunks (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  vector vector(1536),
  file_path TEXT,
  url TEXT,
  language TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 创建向量索引
CREATE INDEX ON chunks USING ivfflat (vector vector_cosine_ops);

-- 创建相似度搜索函数
CREATE OR REPLACE FUNCTION get_relevant_chunks(
  query_vector vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id bigint,
  content text,
  file_path text,
  url text,
  language text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    chunks.id,
    chunks.content,
    chunks.file_path,
    chunks.url,
    chunks.language,
    chunks.metadata,
    1 - (chunks.vector <=> query_vector) as similarity
  FROM chunks
  WHERE 1 - (chunks.vector <=> query_vector) > match_threshold
  ORDER BY chunks.vector <=> query_vector
  LIMIT match_count;
END;
$$;
```

### 4. 构建代码索引

修改 `seed.ts` 中的代码路径，然后运行：

```bash
pnpm run seed
```

### 5. 启动开发服务器

```bash
pnpm run dev
```

访问 http://localhost:3000

## 📖 使用说明

### 构建代码索引

1. **单文件上传**: 通过 API 上传代码文件
   ```bash
   curl -X POST http://localhost:3000/api/upload \
     -F "file=@example.py" \
     -F "filePath=examples"
   ```

2. **批量处理目录**: 修改 `seed.ts` 中的路径配置
   ```typescript
   const codePaths = [
     './examples',
     './src',
   ];
   ```
   然后运行 `pnpm run seed`

### 问答使用

1. 在聊天界面输入编程问题
2. 系统自动检索相关代码上下文
3. 生成包含代码示例和解释的回答
4. 查看回答中的代码来源标注

## 🔧 开发

### 项目脚本

```bash
pnpm run dev      # 启动开发服务器
pnpm run build    # 构建生产版本
pnpm run start    # 启动生产服务器
pnpm run seed     # 运行数据种子脚本
```

### 核心模块

- **代码处理** (`lib/code-processor.ts`): 代码文件识别、分块、元数据提取
- **聊天 API** (`app/api/chat/route.ts`): 问题检索和回答生成
- **上传 API** (`app/api/upload/route.ts`): 代码文件上传和索引构建

## 📊 系统架构

### 索引构建流程

```
代码文件/目录
    ↓
代码处理模块（分块、提取元数据）
    ↓
生成向量嵌入（Gemini Embedding）
    ↓
存储到 Supabase（向量 + 元数据）
```

### 问答流程

```
用户问题
    ↓
生成问题向量
    ↓
向量相似度检索（Top-K）
    ↓
构建 Prompt（问题 + 上下文）
    ↓
LLM 生成回答（流式返回）
```

## 🎯 功能特性详解

### 1. 智能代码分块

- 按函数、类、模块等结构分割
- 保持代码语义完整性
- 支持重叠分块，避免上下文丢失

### 2. 语义检索

- 使用向量相似度而非关键词匹配
- 支持多语言代码检索
- 可配置相似度阈值和检索数量

### 3. 上下文增强

- 检索到的代码块作为上下文
- 提高回答准确性和相关性
- 减少 LLM 幻觉问题

## 📝 注意事项

1. **API 密钥**: 确保 Gemini API 密钥有效且有足够额度
2. **向量维度**: text-embedding-004 输出为 1536 维（需与数据库函数一致）
3. **分块大小**: 建议 1000 字符，重叠 200 字符
4. **检索参数**: 默认检索 Top-3，相似度阈值 0.7
5. **API 限流**: 注意 Gemini API 调用频率限制

## 🔮 扩展方向

- [ ] 支持更多代码文件格式
- [ ] 添加代码执行和验证功能
- [ ] 支持多轮对话上下文
- [ ] 添加代码搜索和浏览功能
- [ ] 支持代码库增量更新
- [ ] 添加用户认证和权限管理
- [ ] 支持自定义 prompt 模板
- [ ] 添加评估指标和性能监控
- [ ] 支持本地 LLM（如 Ollama）
- [ ] 添加代码补全和建议功能

## 📄 许可证

MIT License

## 👤 作者

毕设项目 - 基于检索增强生成的智能代码问答系统

## 🙏 致谢

- [Next.js](https://nextjs.org/)
- [Vercel AI SDK](https://sdk.vercel.ai/)
- [Supabase](https://supabase.com/)
- [Gemini API](https://ai.google.dev/)
- [LangChain](https://langchain.com/)
