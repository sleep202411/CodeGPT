/** 附件块 + 用户问题（服务端与前端共用） */

export type AttachmentRow = {
  file_name: string;
  kind: "code" | "ocr_image";
  extracted_text: string;
};

export function mergeAttachmentsWithQuestion(rows: AttachmentRow[], question: string): string {
  if (rows.length === 0) return question.trim();
  const blocks = rows
    .map((r) => {
      const label = r.kind === "ocr_image" ? "截图 OCR 文本" : "代码/配置文件";
      return `#### ${r.file_name}（${label}）\n\n\`\`\`text\n${r.extracted_text.trim()}\n\`\`\``;
    })
    .join("\n\n");
  const q = question.trim();
  if (!q) {
    return `以下为用户上传的资料，请阅读并回答问题或给出修改建议：\n\n${blocks}`;
  }
  return `以下为用户上传的资料（附件已解析）。请参考后回答用户问题。\n\n${blocks}\n\n---\n\n**用户问题：**\n${q}`;
}
