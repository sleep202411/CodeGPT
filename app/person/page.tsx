"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Pencil, Shield, UserRound } from "lucide-react";
import UserDropdownMenu from "@/components/UserDropdownMenu";
import { updateUserProfileName, fetchUserProfile } from "@/lib/api/person-client";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import type { UserProfile } from "@/lib/types/profile";

export default function PersonPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameDraft, setRenameDraft] = useState("");
  const [renameModalError, setRenameModalError] = useState<string | null>(null);
  const [supabaseHintOpen, setSupabaseHintOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProfile() {
      setLoading(true);
      setError(null);
      const result = await fetchUserProfile(controller.signal);
      if (result.status === "aborted") return;
      if (result.status === "error") {
        setError(result.message);
        setLoading(false);
        return;
      }
      setProfile(result.profile);
      setLoading(false);
    }

    loadProfile();
    return () => controller.abort();
  }, []);

  function openRenameUserNameModal() {
    if (!isSupabaseAuthConfigured()) {
      setSupabaseHintOpen(true);
      return;
    }
    if (!profile) return;
    setRenameDraft(profile.userName);
    setRenameModalError(null);
    setRenameModalOpen(true);
  }

  function closeRenameModal() {
    if (savingName) return;
    setRenameModalOpen(false);
    setRenameModalError(null);
  }

  async function submitRenameUserName() {
    const trimmed = renameDraft.trim();
    if (!trimmed) {
      setRenameModalError("用户名不能为空");
      return;
    }
    setSavingName(true);
    setRenameModalError(null);
    try {
      const result = await updateUserProfileName(trimmed);
      if (!result.ok) {
        throw new Error(result.error);
      }
      setProfile(result.profile);
      setRenameModalOpen(false);
    } catch (err) {
      setRenameModalError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSavingName(false);
    }
  }

  return (
    <main className="min-h-screen [background:var(--manager-bg-color,#2a84eb)]">
      <header className="flex h-16 items-center px-5">
        <div className="text-xl font-bold text-white">CodeGPT 智能问答平台</div>
        <UserDropdownMenu className="ml-auto" />
      </header>

      <section className="min-h-[calc(100vh-64px)] rounded-t-[24px] bg-[var(--app-bg)] px-[6%] pb-8 pt-6 md:px-[10%]">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--app-text-secondary)] hover:bg-[var(--app-hover)]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-[28px] font-semibold text-[var(--app-text)]">个人中心</h1>
        </div>

        <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-6 shadow-sm md:p-8">
          <h2 className="mb-6 text-lg font-semibold text-[var(--app-text)]">基本信息</h2>

          {error ? (
            <div className="mb-5 rounded-lg border border-[#f0d4d4] bg-[#fff5f5] px-3 py-2 text-sm text-[#b64b4b]">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-8 md:flex-row md:items-start">
            <div className="flex min-w-[140px] flex-col items-center gap-2">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--app-primary)] text-white shadow-md">
                <UserRound className="h-11 w-11" />
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <InfoRow
                label="用户名"
                value={loading ? "加载中..." : profile?.userName || "未设置"}
                editable
                onEdit={openRenameUserNameModal}
                editDisabled={savingName || loading}
              />
              <InfoRow
                label="用户角色"
                value={loading ? "加载中..." : profile?.userRole || "未设置"}
                icon={<Shield className="h-4 w-4" />}
              />
              <InfoRow label="邮箱地址" value={loading ? "加载中..." : profile?.userEmail || "未设置"} />
            </div>
          </div>
        </section>
      </section>

      {renameModalOpen ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/30 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rename-username-title"
          onClick={closeRenameModal}
        >
          <div
            className="w-full max-w-[360px] rounded-xl bg-[var(--app-card)] p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="rename-username-title" className="text-base font-semibold text-[var(--app-text)]">
              修改用户名
            </h3>
            <label htmlFor="rename-username-input" className="sr-only">
              新用户名
            </label>
            <input
              id="rename-username-input"
              type="text"
              autoFocus
              value={renameDraft}
              onChange={(e) => {
                setRenameDraft(e.target.value);
                if (renameModalError) setRenameModalError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") closeRenameModal();
                if (e.key === "Enter") void submitRenameUserName();
              }}
              disabled={savingName}
              className="mt-3 h-10 w-full rounded-md border border-[var(--app-border)] bg-[var(--app-surface)] px-3 text-sm text-[var(--app-text)] outline-none focus:border-[var(--app-primary)] focus:ring-1 focus:ring-[var(--app-primary)] disabled:opacity-50"
              placeholder="请输入用户名"
            />
            {renameModalError ? (
              <p className="mt-2 text-sm text-[#e54949]" role="alert">
                {renameModalError}
              </p>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={savingName}
                onClick={closeRenameModal}
                className="h-9 cursor-pointer rounded-md border border-[var(--app-border)] px-4 text-sm text-[var(--app-text-secondary)] hover:bg-[var(--app-hover)] disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="button"
                disabled={savingName}
                onClick={() => void submitRenameUserName()}
                className="h-9 cursor-pointer rounded-md bg-[var(--app-primary)] px-4 text-sm text-white hover:opacity-90 disabled:opacity-50"
              >
                {savingName ? "保存中…" : "确认"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {supabaseHintOpen ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/30 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="supabase-hint-title"
          onClick={() => setSupabaseHintOpen(false)}
        >
          <div
            className="w-full max-w-[360px] rounded-xl bg-[var(--app-card)] p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="supabase-hint-title" className="text-base font-semibold text-[var(--app-text)]">
              提示
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--app-text-secondary)]">
              未配置 Supabase 时无法保存用户名。请在 .env.local 中设置 NEXT_PUBLIC_SUPABASE_URL 与
              NEXT_PUBLIC_SUPABASE_ANON_KEY，并执行 profiles 相关数据库迁移脚本。
            </p>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSupabaseHintOpen(false)}
                className="h-9 cursor-pointer rounded-md bg-[var(--app-primary)] px-4 text-sm text-white hover:opacity-90"
              >
                知道了
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function InfoRow({
  label,
  value,
  editable = false,
  icon,
  onEdit,
  editDisabled = false,
}: {
  label: string;
  value: string;
  editable?: boolean;
  icon?: React.ReactNode;
  onEdit?: () => void;
  editDisabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center">
      <div className="w-[96px] shrink-0 text-sm text-[var(--app-text-secondary)]">{label}</div>
      <div className="flex h-11 flex-1 items-center rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 text-sm text-[var(--app-text)]">
        {icon ? <span className="mr-2 text-[var(--app-primary)]">{icon}</span> : null}
        <span>{value}</span>
        {editable && onEdit ? (
          <button
            type="button"
            disabled={editDisabled}
            onClick={onEdit}
            className="ml-auto cursor-pointer rounded p-1 text-[var(--app-text-muted)] hover:bg-[var(--app-hover)] hover:text-[var(--app-primary)] disabled:opacity-40"
            aria-label={`编辑${label}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
