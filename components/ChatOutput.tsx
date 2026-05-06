"use client";
import type { Message } from "ai";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { UserAttachmentBubble } from "@/components/chat/UserAttachmentBubble";
import { parseStoredAttachmentBubble } from "@/lib/chat/parse-stored-attachment-message";
import { bubblePartsFromStored, sdkAttachmentParts } from "@/lib/chat/attachment-display-meta";

interface ChatOUtputProps {
  messages: Message[];
  status: string;
}

function isImageishKind(labelOrMime: string): boolean {
  const s = labelOrMime.toLowerCase();
  return s.includes("ocr") || s.includes("截图") || s.includes("image");
}

export default function ChatOutput({ messages, status }: ChatOUtputProps) {
  return (
    <>
      {messages.map((message, index) =>
        message.role === "user" ? (
          <UserChat key={index} message={message} />
        ) : (
          <AssistantChat key={index} content={message.content} />
        )
      )}
      {status === "submitted" && <div className="text-muted-foreground">Generating response....</div>}
      {status === "error" && <div className="text-red-500">An error occurred.</div>}
    </>
  );
}

const UserChat = ({ message }: { message: Message }) => {
  const parsed = parseStoredAttachmentBubble(message.content);
  if (parsed) {
    const cards = parsed.files.map((f) => ({
      parts: bubblePartsFromStored(f),
      imageish: isImageishKind(f.kindLabel),
    }));
    return <UserAttachmentBubble text={parsed.question} cards={cards} />;
  }

  const att = message.experimental_attachments;
  if (att && att.length > 0) {
    const cards = att.map((a) => {
      const parts = sdkAttachmentParts(a);
      const imageish = isImageishKind(a.contentType ?? "") || /\.(png|jpe?g|gif|webp|bmp|avif)$/i.test(parts.line1);
      return { parts, imageish };
    });
    return <UserAttachmentBubble text={message.content} cards={cards} />;
  }

  return (
    <div className="mb-2 ml-auto w-fit max-w-[80%] rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] px-4 py-2.5 shadow-sm">
      <div className="whitespace-pre-wrap text-[15px] leading-7 text-[var(--app-text)]">{message.content}</div>
    </div>
  );
};

const AssistantChat = ({ content }: { content: string }) => {
  return (
        <div className="mb-2 w-full max-w-full pl-1 pr-6 sm:pr-8">
            <ReactMarkdown
            components={{
            a:({href,children})=>(
                <a target='_blank ' href={href} className="text-pink-600 hover:text-pink-800 transition-colors underline decoration-dotted" >{children}</a>
            ),
            p:({children})=>(
                <p className="mb-2 text-[15px] leading-7 text-[var(--app-text)]">{children}</p>
            ),
            h1: ({ children }) => (
                <h1 className="mb-3 mt-5 text-[28px] font-bold leading-9 text-[var(--app-text)]">{children}</h1>
            ),
            h2: ({ children }) => (
                <h2 className="mb-2 mt-5 text-[22px] font-bold leading-8 text-[var(--app-text)]">{children}</h2>
            ),
            h3: ({ children }) => (
                <h3 className="mb-2 mt-4 text-[18px] font-semibold leading-7 text-[var(--app-text)]">{children}</h3>
            ),
            h4: ({ children }) => (
                <h4 className="mb-2 mt-3 text-[16px] font-semibold leading-6 text-[var(--app-text)]">{children}</h4>
            ),
            strong: ({ children }) => (
                <strong className="font-semibold text-[var(--app-text)]">{children}</strong>
            ),
            ul: ({ children }) => (
                <ul className="mb-3 list-disc space-y-1 pl-6 text-[15px] leading-7 text-[var(--app-text)]">{children}</ul>
            ),
            ol: ({ children }) => (
                <ol className="mb-3 list-decimal space-y-1 pl-6 text-[15px] leading-7 text-[var(--app-text)]">{children}</ol>
            ),
            li: ({ children }) => <li className="pl-1">{children}</li>,
            blockquote: ({ children }) => (
                <blockquote className="my-3 border-l-4 border-[var(--app-primary)] bg-[var(--app-primary-soft)] px-3 py-2 text-[var(--app-text-secondary)]">
                    {children}
                </blockquote>
            ),
            hr: () => <hr className="my-4 border-t border-[var(--app-border)]" />,
            code: ({ className, children }) => {
                const text = String(children ?? "");
                const isBlock = !!className?.startsWith("language-") || text.includes("\n");
                if (!isBlock) {
                    return (
                        <code className="rounded bg-[var(--app-hover)] px-1.5 py-0.5 font-mono text-[13px] text-[var(--app-text-secondary)]">
                            {text}
                        </code>
                    );
                }
                const language = className?.replace("language-", "") || "text";
                return <CopyableCodeBlock code={text.replace(/\n$/, "")} language={language} />;
            }}}>{content}</ReactMarkdown>
        </div>
  );
};

function CopyableCodeBlock({ code, language }: { code: string; language: string }) {
    const [copied, setCopied] = useState(false);

    async function onCopy() {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
        } catch {
            setCopied(false);
        }
    }

    function onDownload() {
        const ext = languageToExt(language);
        const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `code-snippet.${ext}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="my-2 overflow-hidden rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)]">
            <div className="flex items-center justify-between border-b border-[var(--app-border)] px-3 py-2">
                <span className="text-xs text-[var(--app-text-muted)]">{language}</span>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="cursor-pointer rounded bg-[var(--app-hover)] px-2 py-1 text-xs text-[var(--app-text-secondary)] hover:bg-[var(--app-primary-soft)] hover:text-[var(--app-primary)]"
                        onClick={onDownload}
                    >
                        下载代码
                    </button>
                    <button
                        type="button"
                        className="cursor-pointer rounded bg-[var(--app-hover)] px-2 py-1 text-xs text-[var(--app-text-secondary)] hover:bg-[var(--app-primary-soft)] hover:text-[var(--app-primary)]"
                        onClick={onCopy}
                    >
                        {copied ? "已复制" : "复制代码"}
                    </button>
                </div>
            </div>
            <pre className="overflow-x-auto bg-[var(--app-card)] p-3 text-[13px] leading-6 text-[var(--app-text)]">
                <code>{code}</code>
            </pre>
        </div>
    );
}

function languageToExt(language: string) {
    const key = language.toLowerCase();
    if (key === "javascript" || key === "js") return "js";
    if (key === "typescript" || key === "ts") return "ts";
    if (key === "tsx") return "tsx";
    if (key === "jsx") return "jsx";
    if (key === "python" || key === "py") return "py";
    if (key === "java") return "java";
    if (key === "go") return "go";
    if (key === "rust" || key === "rs") return "rs";
    if (key === "json") return "json";
    if (key === "bash" || key === "shell" || key === "sh") return "sh";
    if (key === "sql") return "sql";
    if (key === "html") return "html";
    if (key === "css") return "css";
    if (key === "markdown" || key === "md") return "md";
    return "txt";
}