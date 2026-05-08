"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Pencil, ShieldCheck, Users } from "lucide-react";
import { EditUserModal } from "@/components/admin/EditUserModal";
import UserDropdownMenu from "@/components/UserDropdownMenu";

const MAX_USER_NAME_LEN = 48;

type AdminUser = {
  id: string;
  userName: string;
  userRole: string;
  userEmail: string;
  createdAt: string;
  updatedAt: string;
};

function formatDateTime(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", { hour12: false });
}

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editNameDraft, setEditNameDraft] = useState("");
  const [editModalError, setEditModalError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const loadUsers = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "GET",
        cache: "no-store",
        signal,
      });
      const data = (await res.json().catch(() => ({}))) as {
        users?: AdminUser[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || `请求失败 (${res.status})`);
      }
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (err) {
      if (signal?.aborted) return;
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadUsers(controller.signal);
    return () => controller.abort();
  }, [loadUsers]);

  function openEditModal(u: AdminUser) {
    setEditUser(u);
    setEditNameDraft(u.userName || "");
    setEditModalError(null);
  }

  function closeEditModal() {
    if (savingEdit) return;
    setEditUser(null);
    setEditModalError(null);
  }

  async function submitEditUser() {
    if (!editUser) return;
    const trimmed = editNameDraft.trim();
    if (!trimmed) {
      setEditModalError("用户名不能为空");
      return;
    }
    if (trimmed.length > MAX_USER_NAME_LEN) {
      setEditModalError(`用户名不能超过 ${MAX_USER_NAME_LEN} 个字符`);
      return;
    }
    const nameUnchanged = trimmed === (editUser.userName ?? "").trim();
    if (nameUnchanged) {
      closeEditModal();
      return;
    }

    setSavingEdit(true);
    setEditModalError(null);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(editUser.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: trimmed,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { user?: AdminUser; error?: string };
      if (!res.ok) {
        throw new Error(data.error || `保存失败 (${res.status})`);
      }
      const updated = data.user;
      if (!updated) {
        throw new Error("接口未返回用户信息");
      }
      setUsers((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
      closeEditModal();
    } catch (err) {
      setEditModalError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <main className="min-h-screen [background:var(--manager-bg-color,#2a84eb)]">
      <header className="flex h-16 items-center px-5">
        <div className="text-xl font-bold text-white">CodeGPT 管理后台</div>
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
          <h1 className="text-[28px] font-semibold text-[var(--app-text)]">管理员入口</h1>
        </div>

        <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-6 shadow-sm md:p-8">
          <div className="mb-4 flex items-center gap-2 text-[var(--app-text)]">
            <ShieldCheck className="h-5 w-5 text-[var(--app-primary)]" />
            <h2 className="text-lg font-semibold">用户信息总览</h2>
            <span className="ml-auto inline-flex items-center gap-1 text-sm text-[var(--app-text-secondary)]">
              <Users className="h-4 w-4" />
              {loading ? "加载中..." : `${users.length} 位用户`}
            </span>
          </div>

          {error ? (
            <div className="mb-4 rounded-lg border border-[#f0d4d4] bg-[#fff5f5] px-3 py-2 text-sm text-[#b64b4b]">
              {error}
            </div>
          ) : null}

          <div className="overflow-x-auto rounded-xl border border-[var(--app-border)]">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-[var(--app-surface)] text-[var(--app-text-secondary)]">
                <tr>
                  <th className="px-3 py-2 font-medium">用户名</th>
                  <th className="px-3 py-2 font-medium">角色</th>
                  <th className="px-3 py-2 font-medium">邮箱</th>
                  <th className="px-3 py-2 font-medium">创建时间</th>
                  <th className="px-3 py-2 font-medium">更新时间</th>
                  <th className="w-[100px] px-3 py-2 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {!loading &&
                  users.map((u) => (
                    <tr key={u.id} className="border-t border-[var(--app-border)] text-[var(--app-text)]">
                      <td className="px-3 py-2">{u.userName || "-"}</td>
                      <td className="px-3 py-2">{u.userRole || "用户"}</td>
                      <td className="px-3 py-2">{u.userEmail || "-"}</td>
                      <td className="px-3 py-2">{formatDateTime(u.createdAt)}</td>
                      <td className="px-3 py-2">{formatDateTime(u.updatedAt)}</td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(u)}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[var(--app-primary)] hover:bg-[var(--app-primary-soft)]"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          编辑
                        </button>
                      </td>
                    </tr>
                  ))}
                {!loading && users.length === 0 ? (
                  <tr>
                    <td className="px-3 py-5 text-[var(--app-text-muted)]" colSpan={6}>
                      暂无用户数据
                    </td>
                  </tr>
                ) : null}
                {loading ? (
                  <tr>
                    <td className="px-3 py-5 text-[var(--app-text-muted)]" colSpan={6}>
                      正在加载用户信息...
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      <EditUserModal
        open={!!editUser}
        userEmail={editUser?.userEmail ?? ""}
        userName={editNameDraft}
        maxUserNameLen={MAX_USER_NAME_LEN}
        error={editModalError}
        saving={savingEdit}
        onClose={closeEditModal}
        onSubmit={submitEditUser}
        onChangeUserName={(value) => {
          setEditNameDraft(value);
          if (editModalError) setEditModalError(null);
        }}
      />
    </main>
  );
}
