-- CodeGPT 数据库初始化脚本
-- 在 Supabase SQL Editor 中执行此脚本

-- 1. 启用 pgvector 扩展（如果尚未启用）
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 创建 chunks 表
CREATE TABLE IF NOT EXISTS chunks (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  vector vector(1536),  -- text-embedding-3-small 的向量维度
  file_path TEXT,
  url TEXT,
  language TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. 创建向量索引（使用 ivfflat 索引加速相似度搜索）
CREATE INDEX IF NOT EXISTS chunks_vector_idx 
ON chunks 
USING ivfflat (vector vector_cosine_ops)
WITH (lists = 100);

-- 4. 创建其他有用的索引
CREATE INDEX IF NOT EXISTS chunks_file_path_idx ON chunks(file_path);
CREATE INDEX IF NOT EXISTS chunks_language_idx ON chunks(language);
CREATE INDEX IF NOT EXISTS chunks_created_at_idx ON chunks(created_at);

-- 5. 创建相似度搜索函数
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

-- 6. 创建用于统计的函数
CREATE OR REPLACE FUNCTION get_chunks_stats()
RETURNS TABLE (
  total_chunks bigint,
  total_files bigint,
  languages jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint as total_chunks,
    COUNT(DISTINCT file_path)::bigint as total_files,
    jsonb_object_agg(language, language_count) as languages
  FROM (
    SELECT 
      language,
      COUNT(*) as language_count
    FROM chunks
    WHERE language IS NOT NULL
    GROUP BY language
  ) lang_counts
  CROSS JOIN (SELECT COUNT(*) FROM chunks) total;
END;
$$;

-- 7. 添加注释
COMMENT ON TABLE chunks IS '存储代码块及其向量嵌入';
COMMENT ON COLUMN chunks.vector IS '使用 OpenAI text-embedding-3-small 生成的 1536 维向量';
COMMENT ON COLUMN chunks.metadata IS '代码块元数据，如行号、函数名等';
COMMENT ON FUNCTION get_relevant_chunks IS '根据查询向量检索最相关的代码块';
