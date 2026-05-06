"use client";

import { FileText, ImageIcon } from "lucide-react";

type CardLine = { line1: string; line2: string };

function CodeGPTFileCard({ parts, imageish }: { parts: CardLine; imageish?: boolean }) {
  return (
    <div className="flex w-fit min-w-[200px] max-w-full gap-2.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-hover)]/60 px-3 py-2.5">
      <div
        className={
          imageish
            ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--app-primary-soft)] text-[var(--app-primary)]"
            : "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--app-surface)] text-[var(--app-text-secondary)]"
        }
      >
        {imageish ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
      </div>
      <div className="max-w-[200px] min-w-0 sm:max-w-[280px]">
        <div className="truncate text-sm font-semibold text-[var(--app-text)]">{parts.line1}</div>
        <div className="mt-0.5 truncate text-xs text-[var(--app-text-muted)]">{parts.line2}</div>
      </div>
    </div>
  );
}

export function UserAttachmentBubble({
  text,
  cards,
}: Readonly<{
  text: string;
  cards: ReadonlyArray<{ parts: CardLine; imageish?: boolean }>;
}>) {
  return (
    <div className="mb-2 ml-auto flex w-fit max-w-[min(520px,85%)] flex-col items-end gap-2">
      {cards.length > 0 && (
        <div className="flex w-fit max-w-full flex-col items-end gap-2">
          {cards.map((c, i) => (
            <CodeGPTFileCard key={`${c.parts.line1}-${i}`} parts={c.parts} imageish={c.imageish} />
          ))}
        </div>
      )}
      {text.trim().length > 0 && (
        <div className="inline-block max-w-[min(520px,85%)] rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] px-4 py-2.5 shadow-sm">
          <p className="whitespace-pre-wrap break-words text-left text-[15px] leading-7 text-[var(--app-text)]">
            {text.trim()}
          </p>
        </div>
      )}
    </div>
  );
}
