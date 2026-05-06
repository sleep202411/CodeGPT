import type { ChatUploadAttachment } from "@/components/ChatInput";

/** UI 占位：满足 AI SDK Attachment.url，但不携带真实文件体 */
export const ATTACH_UI_PLACEHOLDER_URL = "data:application/octet-stream;base64,";

function formatKb(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 2 : 1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb < 10 ? 2 : 1)} MB`;
}

function extFromName(name: string): string {
  const i = name.lastIndexOf(".");
  if (i <= 0 || i === name.length - 1) return "文件";
  return name.slice(i + 1).toUpperCase();
}

export function draftAttachmentToUiParts(a: ChatUploadAttachment): { line1: string; line2: string } {
  const isImg = a.category === "image";
  const upper = extFromName(a.name);
  const typePart = isImg ? (a.mimeType?.split("/")[1]?.toUpperCase() || upper) : upper;
  return {
    line1: a.name,
    line2: `${typePart} ${formatKb(a.size)}`,
  };
}

export function sdkAttachmentParts(a: { name?: string; contentType?: string }): { line1: string; line2: string } {
  const name = a.name?.trim() || "附件";
  const mime = (a.contentType ?? "").trim();
  const sizeMatch = /(?:^|;\s*)x-codegpt-size=(\d+)/.exec(mime);
  const mimeOnly = mime.replace(/(?:^|;)\s*x-codegpt-size=\d+\s*/gi, "").trim();
  const typePart = mimeOnly
    ? mimeOnly.split(";")[0]?.split("/").pop()?.toUpperCase() || extFromName(name)
    : extFromName(name);
  if (sizeMatch) {
    const bytes = Number(sizeMatch[1]);
    if (Number.isFinite(bytes) && bytes >= 0) {
      return { line1: name, line2: `${typePart} ${formatKb(bytes)}` };
    }
  }
  return { line1: name, line2: typePart };
}

export function bubblePartsFromStored(file: { name: string; kindLabel: string }): { line1: string; line2: string } {
  return { line1: file.name, line2: file.kindLabel };
}
