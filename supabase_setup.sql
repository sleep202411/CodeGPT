-- CodeGPT 数据库初始化脚本
-- 在 Supabase SQL Editor 中执行此脚本
--
-- 向量维度需与运行时一致：`app/api/chat/route.ts` / `seed.ts` 默认使用 Jina
--（`jina-embeddings-v3` + dimensions=1024）。若你从旧版 OpenAI 1536 迁移而来，
-- 需自行 ALTER TABLE / 重建向量列与索引，不能指望本脚本的 CREATE IF NOT EXISTS 改列维度。

-- 1. 启用 pgvector 扩展（如果尚未启用）
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 创建 chunks 表（新安装）
CREATE TABLE IF NOT EXISTS chunks (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  vector vector(1024),  -- 与 Jina Embedding（默认 jina-embeddings-v3 × 1024）一致
  file_path TEXT,
  url TEXT,
  language TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2.1 兼容老库（1536 -> 1024）迁移
-- 说明：
-- - IF NOT EXISTS 不会修改已存在列类型，因此老库需要显式迁移。
-- - 下方逻辑会在发现 chunks.vector 是 1536 时自动执行迁移：
--   1) 删除旧 ivfflat 索引
--   2) 新建临时 1024 列并复制前 1024 维
--   3) 删除旧列并重命名
DO $$
DECLARE
  current_dim int;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'chunks'
      AND column_name = 'vector'
  ) THEN
    SELECT
      CASE
        WHEN format_type(a.atttypid, a.atttypmod) = 'vector(1536)' THEN 1536
        WHEN format_type(a.atttypid, a.atttypmod) = 'vector(1024)' THEN 1024
        ELSE NULL
      END
    INTO current_dim
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'chunks'
      AND a.attname = 'vector'
      AND a.attnum > 0
      AND NOT a.attisdropped
    LIMIT 1;

    IF current_dim = 1536 THEN
      DROP INDEX IF EXISTS public.chunks_vector_idx;
      ALTER TABLE public.chunks ADD COLUMN IF NOT EXISTS vector_1024 vector(1024);
      UPDATE public.chunks
      SET vector_1024 = subvector(vector, 1, 1024)
      WHERE vector IS NOT NULL;
      ALTER TABLE public.chunks DROP COLUMN vector;
      ALTER TABLE public.chunks RENAME COLUMN vector_1024 TO vector;
    END IF;
  END IF;
END $$;

-- 3. 创建向量索引（ivfflat：大数据量下更快）
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
  query_vector vector(1024),
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
  WHERE chunks.vector IS NOT NULL
    AND query_vector IS NOT NULL
    AND 1 - (chunks.vector <=> query_vector) >= GREATEST(LEAST(match_threshold, 1), 0)
  ORDER BY chunks.vector <=> query_vector
  LIMIT GREATEST(match_count, 1);
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
    COALESCE(jsonb_object_agg(language, language_count), '{}'::jsonb) as languages
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
COMMENT ON COLUMN chunks.vector IS 'Jina Embedding 生成的向量（默认 1024 维，与 JINA_EMBED_MODEL / dimensions 一致）';
COMMENT ON COLUMN chunks.metadata IS '代码块元数据，如行号、函数名等';
COMMENT ON FUNCTION get_relevant_chunks IS '根据查询向量检索最相关的代码块';
