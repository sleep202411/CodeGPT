"use client";

import { useEffect } from "react";

type FormModalProps = Readonly<{
  open: boolean;
  title: string;
  onClose: () => void;
  disableClose?: boolean;
  children: React.ReactNode;
  actions?: React.ReactNode;
}>;

export function FormModal({
  open,
  title,
  onClose,
  disableClose = false,
  children,
  actions,
}: FormModalProps) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !disableClose) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, disableClose, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/30 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-modal-title"
      onClick={() => {
        if (!disableClose) onClose();
      }}
    >
      <div
        className="w-full max-w-[360px] rounded-xl bg-[var(--app-card)] p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="form-modal-title" className="text-base font-semibold text-[var(--app-text)]">
          {title}
        </h3>
        <div className="mt-3">{children}</div>
        {actions ? <div className="mt-5 flex justify-end gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
