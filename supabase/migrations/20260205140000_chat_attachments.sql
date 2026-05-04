-- 上传附件元数据（供聊天请求通过 attachmentIds 引用）
CREATE TABLE IF NOT EXISTS public.chat_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('code', 'ocr_image')),
  extracted_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_attachments_user_created_idx
  ON public.chat_attachments (user_id, created_at DESC);

ALTER TABLE public.chat_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_attachments_select_own" ON public.chat_attachments;
CREATE POLICY "chat_attachments_select_own" ON public.chat_attachments
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "chat_attachments_insert_own" ON public.chat_attachments;
CREATE POLICY "chat_attachments_insert_own" ON public.chat_attachments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "chat_attachments_delete_own" ON public.chat_attachments;
CREATE POLICY "chat_attachments_delete_own" ON public.chat_attachments
  FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE public.chat_attachments IS '代码/截图 OCR 上传记录，会话内通过 attachmentIds 引用';
