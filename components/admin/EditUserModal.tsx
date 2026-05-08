"use client";

import { FormModal } from "@/components/ui/form-modal";

type EditUserModalProps = Readonly<{
  open: boolean;
  userEmail: string;
  userName: string;
  maxUserNameLen: number;
  error: string | null;
  saving: boolean;
  onChangeUserName: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
}>;

export function EditUserModal({
  open,
  userEmail,
  userName,
  maxUserNameLen,
  error,
  saving,
  onChangeUserName,
  onClose,
  onSubmit,
}: EditUserModalProps) {
  return (
    <FormModal
      open={open}
      title="编辑用户"
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
            {saving ? "保存中…" : "保存"}
          </button>
        </>
      }
    >
      <p className="truncate text-xs text-[var(--app-text-muted)]" title={userEmail}>
        {userEmail || "无邮箱"}
      </p>

      <label htmlFor="admin-edit-name" className="mt-4 block text-sm text-[var(--app-text-secondary)]">
        用户名
      </label>
      <input
        id="admin-edit-name"
        type="text"
        autoFocus
        value={userName}
        maxLength={maxUserNameLen}
        onChange={(e) => onChangeUserName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") void onSubmit();
        }}
        disabled={saving}
        className="mt-1.5 h-10 w-full rounded-md border border-[var(--app-border)] bg-[var(--app-surface)] px-3 text-sm text-[var(--app-text)] outline-none focus:border-[var(--app-primary)] focus:ring-1 focus:ring-[var(--app-primary)] disabled:opacity-50"
        placeholder="用户名"
      />

      {error ? (
        <p className="mt-3 text-sm text-[#e54949]" role="alert">
          {error}
        </p>
      ) : null}
    </FormModal>
  );
}
