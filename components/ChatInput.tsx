"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, FileText, ImageIcon, Paperclip, X } from "lucide-react";
import {
  CODE_FILE_ACCEPT_ATTR,
  CODE_FILE_MAX_BYTES,
  IMAGE_MAX_BYTES,
  MAX_ATTACHMENTS_PER_MESSAGE,
} from "@/lib/upload-policy";
import { draftAttachmentToUiParts } from "@/lib/chat/attachment-display-meta";

export type ChatUploadAttachment = {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  category: "media" | "image" | "document" | "other";
  createdAt: string;
  extractedText?: string;
  /** 持久化后的附件 id（`chat_attachments`）；为 null 时发送走正文内拼接 */
  fileId?: string | null;
};

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  attachments: ChatUploadAttachment[];
  onAttachmentsChange: React.Dispatch<React.SetStateAction<ChatUploadAttachment[]>>;
  onUploadingChange?: (uploading: boolean) => void;
}

export default function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  attachments,
  onAttachmentsChange,
  onUploadingChange,
}: ChatInputProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    onUploadingChange?.(uploading);
  }, [uploading, onUploadingChange]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", onClickOutside);
    }
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  async function onPickFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const incoming = Array.from(files);
    if (attachments.length + incoming.length > MAX_ATTACHMENTS_PER_MESSAGE) {
      setUploadError(`单次最多 ${MAX_ATTACHMENTS_PER_MESSAGE} 个附件，请删除部分后再添加`);
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const uploaded = await Promise.all(incoming.map((file) => uploadSingleFile(file)));
      onAttachmentsChange((prev) => [...prev, ...uploaded]);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  function removeAttachment(index: number) {
    onAttachmentsChange((prev) => prev.filter((_, i) => i !== index));
  }

  const codeMb = Math.floor(CODE_FILE_MAX_BYTES / (1024 * 1024));
  const imageMb = Math.floor(IMAGE_MAX_BYTES / (1024 * 1024));

  const canSend =
    input.trim().length > 0 || attachments.some((a) => Boolean(a.extractedText?.trim()));

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="relative w-full rounded-md border border-[var(--app-border)] bg-[var(--app-card)] px-4 py-3 focus-within:border-[var(--app-primary)]"
    >
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((file, idx) => {
            const { line1, line2 } = draftAttachmentToUiParts(file);
            const isImg = file.category === "image";
            return (
              <div
                key={`${file.id}-${idx}`}
                title={file.name}
                className="flex max-w-[280px] gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-hover)]/60 px-2.5 py-2 text-xs text-[var(--app-text-secondary)]"
              >
                <div
                  className={
                    isImg
                      ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--app-primary-soft)] text-[var(--app-primary)]"
                      : "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--app-surface)] text-[var(--app-text-secondary)]"
                  }
                >
                  {isImg ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="truncate text-[13px] font-semibold text-[var(--app-text)]">{line1}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="cursor-pointer shrink-0 rounded p-0.5 hover:bg-[var(--app-border)]"
                      aria-label="移除附件"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-[var(--app-text-muted)]">{line2}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {uploading && <p className="mb-2 text-xs text-[var(--app-text-muted)]">上传中...</p>}
      {uploadError && <p className="mb-2 text-xs text-[#b64b4b]">{uploadError}</p>}

      <textarea
        onChange={handleInputChange}
        onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
          if (e.key !== "Enter") return;
          if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return;
          if (e.nativeEvent.isComposing) return;
          if (uploading || !canSend) return;
          e.preventDefault();
          const form = formRef.current;
          if (!form) return;
          handleSubmit({
            preventDefault() {},
            stopPropagation() {},
            currentTarget: form,
            target: form,
          } as unknown as React.FormEvent<HTMLFormElement>);
        }}
        value={input}
        placeholder="请输入问题"
        title="Enter 发送，Shift+Enter 换行"
        rows={3}
        className="w-full resize-none border-0 bg-transparent px-0 pb-10 pr-14 text-sm leading-6 text-[var(--app-text)] outline-none placeholder:text-[var(--app-text-muted)]"
      />

      <div className="absolute bottom-3 left-3 flex items-center gap-2 text-[var(--app-primary)]" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="cursor-pointer rounded p-1.5 hover:bg-[var(--app-hover)]"
          aria-label="上传"
          title="上传"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        {menuOpen && (
          <div className="absolute bottom-12 left-0 w-[260px] rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] p-2 shadow-lg">
            <button
              type="button"
              className="flex h-11 w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-left text-[14px] leading-5 text-[var(--app-text)] hover:bg-[var(--app-hover)]"
              onClick={() => {
                fileInputRef.current?.click();
                setMenuOpen(false);
              }}
            >
              <FileText className="h-4 w-4 shrink-0 text-[var(--app-text-secondary)]" />
              <span>
                上传代码文件
                <span className="block text-[11px] font-normal text-[var(--app-text-muted)]">
                  常见源码/配置，≤{codeMb}MB
                </span>
              </span>
            </button>
            <button
              type="button"
              className="mt-1 flex h-11 w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-left text-[14px] leading-5 text-[var(--app-text)] hover:bg-[var(--app-hover)]"
              onClick={() => {
                imageInputRef.current?.click();
                setMenuOpen(false);
              }}
            >
              <ImageIcon className="h-4 w-4 shrink-0 text-[var(--app-text-secondary)]" />
              <span>
                上传图片
                <span className="block text-[11px] font-normal text-[var(--app-text-muted)]">
                  OCR 提取图中文字，≤{imageMb}MB
                </span>
              </span>
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={CODE_FILE_ACCEPT_ATTR}
        multiple
        onChange={(e) => {
          onPickFiles(e.target.files);
          e.currentTarget.value = "";
        }}
      />
      <input
        ref={imageInputRef}
        type="file"
        className="hidden"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/bmp,image/avif"
        multiple
        onChange={(e) => {
          onPickFiles(e.target.files);
          e.currentTarget.value = "";
        }}
      />

      <Button
        type="submit"
        disabled={uploading || !canSend}
        className="absolute bottom-3 right-3 h-9 w-9 cursor-pointer rounded-md bg-[var(--app-primary)] p-0 text-white shadow-none hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ArrowUp className="h-4.5 w-4.5" />
        <span className="sr-only">发送</span>
      </Button>
    </form>
  );
}

async function uploadSingleFile(file: File): Promise<ChatUploadAttachment> {
  const formData = new FormData();
  formData.set("file", file);
  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || "上传失败");
  }
  const upload = data.upload as ChatUploadAttachment;
  const extractedText = typeof data.extractedText === "string" ? data.extractedText : upload.extractedText;
  const fileId =
    typeof data.fileId === "string" && data.fileId.length > 0 ? data.fileId : data.fileId === null ? null : undefined;
  return { ...upload, extractedText, fileId };
}
