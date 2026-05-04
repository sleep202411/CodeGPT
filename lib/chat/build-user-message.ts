import type { ChatUploadAttachment } from "@/components/ChatInput";
import { mergeAttachmentsWithQuestion } from "@/lib/attachment-markdown";

export function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id.trim());
}

/** 未落库时用本地全文拼接（与 mergeAttachmentsWithQuestion 一致） */
export function buildMessageWithAttachments(userText: string, attachments: ChatUploadAttachment[]): string {
  const rows = attachments
    .filter((a) => a.extractedText?.trim())
    .map((a) => ({
      file_name: a.name,
      kind: (a.category === "image" ? "ocr_image" : "code") as "code" | "ocr_image",
      extracted_text: a.extractedText!,
    }));
  return mergeAttachmentsWithQuestion(rows, userText.trim());
}
