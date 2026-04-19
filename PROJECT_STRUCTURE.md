# CodeGPT - 基于检索增强生成的智能代码问答系统

## 项目概述

CodeGPT 是一个基于检索增强生成（Retrieval-Augmented Generation, RAG）技术的智能代码问答系统。系统能够从代码库中检索相关信息，结合大语言模型生成准确、有依据的代码答案。

## 技术栈

- **前端框架**: Next.js 15 + React 19
- **UI 组件**: Tailwind CSS + Radix UI
- **AI SDK**: Vercel AI SDK
- **向量数据库**: Supabase (PostgreSQL + pgvector)
- **嵌入模型**: OpenAI text-embedding-3-small
- **LLM**: OpenAI GPT-4o-mini
- **文档处理**: LangChain
- **开发语言**: TypeScript

## 项目结构

```
CodeGPT/
├── app/                          # Next.js App Router 目录
│   ├── api/                      # API 路由
│   │   ├── chat/                 # 聊天 API
│   │   │   └── route.ts         # 处理用户问题，检索上下文，生成回答
│   │   └── upload/               # 代码上传 API
│   │       └── route.ts         # 处理代码文件上传和向量化
│   ├── globals.css               # 全局样式
│   ├── layout.tsx                # 根布局组件
│   └── page.tsx                  # 首页（聊天界面）
│
├── components/                   # React 组件
│   ├── ui/                       # 基础 UI 组件
│   │   ├── button.tsx           # 按钮组件
│   │   └── input.tsx            # 输入框组件
│   ├── ChatInput.tsx            # 聊天输入组件
│   └── ChatOutput.tsx           # 聊天输出组件（支持 Markdown 渲染）
│
├── lib/                          # 工具库
│   ├── code-processor.ts        # 代码处理模块
│   │   ├── 代码文件识别和语言检测
│   │   ├── 智能代码分块（按函数/类分割）
│   │   ├── 目录递归处理
│   │   └── 代码块元数据提取
│   └── utils.ts                 # 通用工具函数
│
├── public/                       # 静态资源
│   └── *.svg                    # 图标文件
│
├── seed.ts                       # 数据种子脚本
│   └── 用于批量导入代码文件并构建向量索引
│
├── package.json                  # 项目依赖配置
├── tsconfig.json                 # TypeScript 配置
├── next.config.ts                # Next.js 配置
├── components.json               # UI 组件配置
├── postcss.config.mjs           # PostCSS 配置
├── README.md                     # 项目说明文档
└── PROJECT_STRUCTURE.md          # 项目结构文档（本文件）
```

## 核心模块说明

### 1. 代码处理模块 (`lib/code-processor.ts`)

**功能**:
- 支持多种代码文件格式（Python, JavaScript, TypeScript, Java, C++, Go 等）
- 智能代码分块：按函数、类、模块等结构分割
- 代码元数据提取：文件路径、语言类型、行号范围等
- 目录递归处理：批量处理整个代码库

**关键类**:
- `CodeTextSplitter`: 智能代码分块器
- `processCodeDirectory()`: 目录处理函数
- `isCodeFile()`: 文件类型检测
- `getFileLanguage()`: 语言识别

### 2. 聊天 API (`app/api/chat/route.ts`)

**工作流程**:
1. 接收用户问题
2. 生成问题向量（embedding）
3. 从向量数据库检索相关代码块（Top-K）
4. 构建包含上下文的 prompt
5. 调用 LLM 生成回答
6. 流式返回结果

**关键函数**:
- `generateEmbedding()`: 生成文本向量
- `fetchRelevantContext()`: 检索相关上下文
- `createPrompt()`: 构建系统提示词

### 3. 代码上传 API (`app/api/upload/route.ts`)

**功能**:
- 单文件上传处理
- 批量目录处理
- 自动向量化和索引构建

**端点**:
- `POST /api/upload`: 上传单个代码文件
- `PUT /api/upload`: 批量处理代码目录

### 4. 前端组件

**ChatInput** (`components/ChatInput.tsx`):
- 用户输入界面
- 提交处理

**ChatOutput** (`components/ChatOutput.tsx`):
- 消息列表渲染
- Markdown 支持
- 代码语法高亮
- 状态显示（加载中、错误等）

## 数据流程

### 索引构建流程

```
代码文件/目录
    ↓
代码处理模块 (code-processor.ts)
    ↓
代码分块 (按函数/类/模块)
    ↓
生成向量 (OpenAI Embedding)
    ↓
存储到 Supabase (向量 + 元数据)
```

### 问答流程

```
用户问题
    ↓
生成问题向量
    ↓
向量相似度检索 (Supabase)
    ↓
获取 Top-K 相关代码块
    ↓
构建 Prompt (问题 + 上下文)
    ↓
LLM 生成回答 (GPT-4o-mini)
    ↓
流式返回给用户
```

## 数据库结构

### Supabase `chunks` 表

```sql
CREATE TABLE chunks (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,              -- 代码块内容
  vector vector(1536),                -- 向量嵌入 (text-embedding-3-small)
  file_path TEXT,                     -- 文件路径
  url TEXT,                           -- URL（兼容字段）
  language TEXT,                       -- 编程语言
  metadata JSONB,                     -- 元数据（行号、函数名等）
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

## 环境变量配置

创建 `.env.local` 文件：

```env
# Supabase 配置
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key

# OpenAI 配置
OPENAI_API_KEY=your_openai_api_key
OPENAI_API_BASE_URL=https://api.openai.com/v1  # 可选，使用代理时修改
```

## 使用指南

### 1. 安装依赖

```bash
npm install
# 或
pnpm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local` 并填入配置

### 3. 初始化数据库

在 Supabase 中执行上述 SQL 创建表和函数

### 4. 构建代码索引

```bash
# 修改 seed.ts 中的代码路径
npm run seed
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 功能特性

✅ **多语言支持**: 支持 Python, JavaScript, TypeScript, Java, C++, Go 等主流语言  
✅ **智能分块**: 按代码结构（函数、类）智能分割，保持语义完整性  
✅ **向量检索**: 使用语义相似度检索，而非简单关键词匹配  
✅ **上下文增强**: 检索到的代码块作为上下文，提高回答准确性  
✅ **流式响应**: 实时流式返回生成结果，提升用户体验  
✅ **代码高亮**: 前端支持代码语法高亮显示  
✅ **来源标注**: 回答中包含代码来源信息，提高可解释性  

## 扩展方向

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

## 开发注意事项

1. **向量维度**: text-embedding-3-small 生成 1536 维向量
2. **分块大小**: 建议 1000 字符，重叠 200 字符
3. **检索数量**: 默认检索 Top-3，可根据需要调整
4. **相似度阈值**: 默认 0.7，过滤低相关性结果
5. **API 限流**: 注意 OpenAI API 调用频率限制

## 许可证

MIT License

## 作者

毕设项目 - 基于检索增强生成的智能代码问答系统
