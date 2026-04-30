"use client";
import { useEffect, useRef, useState } from "react";
import {
    Button
} from '@/components/ui/button';
import {
    ArrowUp,
    FileText,
    Film,
    ImageIcon,
    Paperclip,
    X
} from 'lucide-react';

interface ChatInputProps {
    input: string;
    handleInputChange: (e: any) => void;
    handleSubmit: (e: any) => void;
}

type UploadedAttachment = {
    id: string;
    name: string;
    size: number;
    mimeType: string;
    category: "media" | "image" | "document" | "other";
    createdAt: string;
};

// const ChatInput: React.FC<ChatInputProps> = ({
export default function ChatInput({
    input,
    handleInputChange,
    handleSubmit
}: ChatInputProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const mediaInputRef = useRef<HTMLInputElement>(null);
    const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
    const [menuOpen, setMenuOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

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
        setUploadError(null);
        setUploading(true);
        try {
            const uploaded = await Promise.all(Array.from(files).map((file) => uploadSingleFile(file)));
            setAttachments((prev) => [...prev, ...uploaded]);
        } catch (error) {
            setUploadError(error instanceof Error ? error.message : "上传失败");
        } finally {
            setUploading(false);
        }
    }

    function removeAttachment(index: number) {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="relative w-full rounded-md border border-[var(--app-border)] bg-[var(--app-card)] px-4 py-3 focus-within:border-[var(--app-primary)]"
        >
            {attachments.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                    {attachments.map((file, idx) => (
                        <div
                            key={`${file.id}-${idx}`}
                            className="flex max-w-[220px] items-center gap-1 rounded bg-[var(--app-hover)] px-2 py-1 text-xs text-[var(--app-text-secondary)]"
                            title={file.name}
                        >
                            <span className="truncate">{file.name}</span>
                            <button
                                type="button"
                                onClick={() => removeAttachment(idx)}
                                className="cursor-pointer rounded p-0.5 hover:bg-[var(--app-border)]"
                                aria-label="移除附件"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {uploading && <p className="mb-2 text-xs text-[var(--app-text-muted)]">上传中...</p>}
            {uploadError && <p className="mb-2 text-xs text-[#b64b4b]">{uploadError}</p>}

            <textarea
                onChange={handleInputChange}
                value={input}
                placeholder="请输入问题"
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
                    <div className="absolute bottom-12 left-0 w-[240px] rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] p-2 shadow-lg">
                        <button
                            type="button"
                            className="flex h-11 w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-[14px] leading-5 text-[var(--app-text)] hover:bg-[var(--app-hover)]"
                            onClick={() => {
                                mediaInputRef.current?.click();
                                setMenuOpen(false);
                            }}
                        >
                            <Film className="h-4 w-4 text-[var(--app-text-secondary)]" />
                            上传音/视频(50M)
                        </button>
                        <button
                            type="button"
                            className="flex h-11 w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-[14px] leading-5 text-[var(--app-text)] hover:bg-[var(--app-hover)]"
                            onClick={() => {
                                imageInputRef.current?.click();
                                setMenuOpen(false);
                            }}
                        >
                            <ImageIcon className="h-4 w-4 text-[var(--app-text-secondary)]" />
                            上传图片(30M)
                        </button>
                        <button
                            type="button"
                            className="flex h-11 w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-[14px] leading-5 text-[var(--app-text)] hover:bg-[var(--app-hover)]"
                            onClick={() => {
                                fileInputRef.current?.click();
                                setMenuOpen(false);
                            }}
                        >
                            <FileText className="h-4 w-4 text-[var(--app-text-secondary)]" />
                            上传文档(100M)
                        </button>
                    </div>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
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
                accept="image/*"
                multiple
                onChange={(e) => {
                    onPickFiles(e.target.files);
                    e.currentTarget.value = "";
                }}
            />
            <input
                ref={mediaInputRef}
                type="file"
                className="hidden"
                accept="audio/*,video/*"
                multiple
                onChange={(e) => {
                    onPickFiles(e.target.files);
                    e.currentTarget.value = "";
                }}
            />

            <Button
                type="submit"
                className="absolute bottom-3 right-3 h-9 w-9 cursor-pointer rounded-md bg-[var(--app-primary)] p-0 text-white shadow-none hover:opacity-90"
            >
                <ArrowUp className="h-4.5 w-4.5" />
                <span className="sr-only">发送</span>
            </Button>
        </form>
    )
}

async function uploadSingleFile(file: File): Promise<UploadedAttachment> {
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
    return data.upload as UploadedAttachment;
}