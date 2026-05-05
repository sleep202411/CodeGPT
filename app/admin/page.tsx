"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ShieldCheck, Users } from "lucide-react";
import UserDropdownMenu from "@/components/UserDropdownMenu";

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

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/users", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
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
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "加载失败");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

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
                    </tr>
                  ))}
                {!loading && users.length === 0 ? (
                  <tr>
                    <td className="px-3 py-5 text-[var(--app-text-muted)]" colSpan={5}>
                      暂无用户数据
                    </td>
                  </tr>
                ) : null}
                {loading ? (
                  <tr>
                    <td className="px-3 py-5 text-[var(--app-text-muted)]" colSpan={5}>
                      正在加载用户信息...
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
