"use client";

import { FormModal } from "@/components/ui/form-modal";

type RenameUserNameModalProps = Readonly<{
  open: boolean;
  value: string;
  error: string | null;
  saving: boolean;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
}>;

export function RenameUserNameModal({
  open,
  value,
  error,
  saving,
  onChange,
  onClose,
  onSubmit,
}: RenameUserNameModalProps) {
  return (
    <FormModal
      open={open}
      title="修改用户名"
      onClose={onClose}
      disableClose={saving}
      actions={
        <>
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="h-9 cursor-pointer rounded-md border border-[var(--app-border)] px-4 text-sm text-[var(--app-text-secondary)] hover:bg-[var(--app-hover)] disabled:opacity-50"
          >
            取消
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void onSubmit()}
            className="h-9 cursor-pointer rounded-md bg-[var(--app-primary)] px-4 text-sm text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "保存中…" : "确认"}
          </button>
        </>
      }
    >
      <label htmlFor="rename-username-input" className="sr-only">
        新用户名
      </label>
      <input
        id="rename-username-input"
        type="text"
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") void onSubmit();
        }}
        disabled={saving}
        className="h-10 w-full rounded-md border border-[var(--app-border)] bg-[var(--app-surface)] px-3 text-sm text-[var(--app-text)] outline-none focus:border-[var(--app-primary)] focus:ring-1 focus:ring-[var(--app-primary)] disabled:opacity-50"
        placeholder="请输入用户名"
      />
      {error ? (
        <p className="mt-2 text-sm text-[#e54949]" role="alert">
          {error}
        </p>
      ) : null}
    </FormModal>
  );
}
