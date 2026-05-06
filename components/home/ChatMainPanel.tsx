"use client";

import { useEffect, useRef, type Dispatch, type FormEvent, type SetStateAction } from "react";
import type { Message } from "ai";

import ChatInput, { type ChatUploadAttachment } from "@/components/ChatInput";
import ChatOutput from "@/components/ChatOutput";
import UserDropdownMenu from "@/components/UserDropdownMenu";

const DISCLAIMER = "内容由AI生成，仅供参考。请遵守平台用户协议和隐私政策。";

/** 对话主列上限，避免在大屏/DevTools 并排时铺满显得过宽 */
const CHAT_COLUMN_MAX = "max-w-3xl";

type ChatMainPanelProps = Readonly<{
  input: string;
  messages: Message[];
  status: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onChatSubmit: (e: FormEvent<HTMLFormElement>) => void;
  chatAttachments: ChatUploadAttachment[];
  onAttachmentsChange: Dispatch<SetStateAction<ChatUploadAttachment[]>>;
  onUploadingChange?: (uploading: boolean) => void;
}>;

export function ChatMainPanel({
  input,
  messages,
  status,
  handleInputChange,
  onChatSubmit,
  chatAttachments,
  onAttachmentsChange,
  onUploadingChange,
}: ChatMainPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const empty = messages.length === 0;

  useEffect(() => {
    if (empty) return;
    const el = scrollRef.current;
    if (!el) return;
    const frame = requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
    return () => cancelAnimationFrame(frame);
  }, [empty, messages, status]);

  const inputBlock = (
    <div className={`w-full ${CHAT_COLUMN_MAX} rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] px-3 py-3 shadow-sm`}>
      <ChatInput
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={onChatSubmit}
        attachments={chatAttachments}
        onAttachmentsChange={onAttachmentsChange}
        onUploadingChange={onUploadingChange}
      />
    </div>
  );

  return (
    <section className="flex min-w-0 flex-1 flex-col">
      <header className="flex h-14 items-center px-6">
        <UserDropdownMenu className="ml-auto" />
      </header>

      <div className="flex min-h-0 flex-1 flex-col px-6 pb-4">
        {empty ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
            <div className="text-center">
              <h1 className="font-brand text-[44px] font-bold tracking-wide text-[var(--app-text)]">
                欢迎使用 <span className="text-[var(--app-primary)]">CodeGPT</span>
              </h1>
              <p className="mt-2 text-sm text-[var(--app-text-muted)]">高效AI搜索</p>
            </div>
            <div className="mt-10 flex w-full justify-center">{inputBlock}</div>
            <p className="pt-4 text-center text-xs text-[var(--app-text-muted)]">{DISCLAIMER}</p>
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col overflow-auto">
              <div className={`mx-auto w-full ${CHAT_COLUMN_MAX} py-6`}>
                <ChatOutput messages={messages} status={status} />
              </div>
            </div>
            <div className={`mx-auto w-full ${CHAT_COLUMN_MAX}`}>{inputBlock}</div>
            <p className="pt-4 text-center text-xs text-[var(--app-text-muted)]">{DISCLAIMER}</p>
          </>
        )}
      </div>
    </section>
  );
}
