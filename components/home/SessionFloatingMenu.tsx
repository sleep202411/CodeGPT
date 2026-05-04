"use client";

import { Layers3, Pencil, Trash2 } from "lucide-react";

export type SessionMenuPosition = { id: string; top: number; left: number };

type SessionFloatingMenuProps = {
  menu: SessionMenuPosition;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onRename: () => void;
  onBatch: () => void;
  onDelete: () => void;
};

export function SessionFloatingMenu({
  menu,
  onMouseEnter,
  onMouseLeave,
  onRename,
  onBatch,
  onDelete,
}: SessionFloatingMenuProps) {
  return (
    <div
      className="fixed z-[60] w-[152px] rounded-lg border border-[var(--app-border)] bg-[var(--app-card)] p-1 shadow-[0_6px_16px_rgba(0,0,0,0.12)]"
      style={{ top: menu.top, left: menu.left }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        type="button"
        className="flex h-8 w-full cursor-pointer items-center gap-2 rounded-md px-2.5 text-[14px] leading-5 hover:bg-[var(--app-hover)]"
        onClick={onRename}
      >
        <Pencil className="h-[14px] w-[14px]" />
        重命名
      </button>
      <button
        type="button"
        className="flex h-8 w-full cursor-pointer items-center gap-2 rounded-md px-2.5 text-[14px] leading-5 hover:bg-[var(--app-hover)]"
        onClick={onBatch}
      >
        <Layers3 className="h-[14px] w-[14px]" />
        批量操作
      </button>
      <button
        type="button"
        className="flex h-8 w-full cursor-pointer items-center gap-2 rounded-md px-2.5 text-[14px] leading-5 text-[#ff4d4f] hover:bg-[var(--app-hover)]"
        onClick={onDelete}
      >
        <Trash2 className="h-[14px] w-[14px]" />
        删除
      </button>
    </div>
  );
}
