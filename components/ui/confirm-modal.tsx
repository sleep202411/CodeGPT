"use client";

import { useEffect } from "react";

type ConfirmModalProps = Readonly<{
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  processingText?: string;
  cancelText?: string;
  confirming?: boolean;
  danger?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}>;

export function ConfirmModal({
  open,
  title,
  description,
  confirmText = "确认",
  processingText = "处理中…",
  cancelText = "取消",
  confirming = false,
  danger = false,
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !confirming) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, confirming, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/30 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={() => {
        if (!confirming) onClose();
      }}
    >
      <div
        className="w-full max-w-[360px] rounded-xl bg-[var(--app-card)] p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="confirm-modal-title" className="text-base font-semibold text-[var(--app-text)]">
          {title}
        </h3>
        <p className="mt-2 text-sm text-[var(--app-text-secondary)]">{description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={confirming}
            onClick={onClose}
            className="h-9 cursor-pointer rounded-md border border-[var(--app-border)] px-4 text-sm text-[var(--app-text-secondary)] hover:bg-[var(--app-hover)] disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={confirming}
            onClick={() => void onConfirm()}
            className={`h-9 cursor-pointer rounded-md px-4 text-sm text-white hover:opacity-90 disabled:opacity-50 ${
              danger ? "bg-[#e54949]" : "bg-[var(--app-primary)]"
            }`}
          >
            {confirming ? processingText : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
