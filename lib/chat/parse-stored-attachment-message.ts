/** 解析 mergeAttachmentsWithQuestion 落库正文，便于历史消息按「文件卡片 + 纯问题」展示（不渲染代码/OCR 全文） */

export type ParsedAttachmentBubble = Readonly<{
  question: string;
  files: ReadonlyArray<{ name: string; kindLabel: string }>;
}>;

const INTRO_HINT =
  /^以下为用户上传的资料/;

export function parseStoredAttachmentBubble(content: string): ParsedAttachmentBubble | null {
  const trimmed = content.trim();
  if (!trimmed.includes("#### ") || !INTRO_HINT.test(trimmed)) {
    return null;
  }
  const files: { name: string; kindLabel: string }[] = [];
  const fileRe = /####\s+(.+?)（([^）]+)）/g;
  for (;;) {
    const m = fileRe.exec(trimmed);
    if (!m) break;
    files.push({ name: m[1].trim(), kindLabel: m[2].trim() });
  }
  if (files.length === 0) return null;

  const qSep = /\n---\s*\n\s*\*\*用户问题：\*\*\s*\n/;
  let question = "";
  if (qSep.test(trimmed)) {
    question = trimmed.split(qSep)[1]?.trim() ?? "";
  }

  return { question, files };
}
