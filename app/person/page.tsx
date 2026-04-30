"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Pencil, Shield, UserRound } from "lucide-react";
import UserDropdownMenu from "@/components/UserDropdownMenu";

type Profile = {
  userName: string;
  userRole: string;
  userEmail: string;
};

export default function PersonPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProfile() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/person/profile", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });
        if (response.status === 404) {
          setProfile(null);
          return;
        }
        if (!response.ok) {
          throw new Error(`个人信息获取失败 (${response.status})`);
        }
        const data = (await response.json()) as { profile?: Profile };
        setProfile(data.profile ?? null);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "个人信息获取失败");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchProfile();
    return () => controller.abort();
  }, []);

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
              <InfoRow label="用户名" value={loading ? "加载中..." : profile?.userName || "未设置"} editable />
              <InfoRow
                label="用户角色"
                value={loading ? "加载中..." : profile?.userRole || "未设置"}
                icon={<Shield className="h-4 w-4" />}
              />
              <InfoRow label="邮箱地址" value={loading ? "加载中..." : profile?.userEmail || "未设置"} editable />
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function InfoRow({
  label,
  value,
  editable = false,
  icon,
}: {
  label: string;
  value: string;
  editable?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center">
      <div className="w-[96px] shrink-0 text-sm text-[var(--app-text-secondary)]">{label}</div>
      <div className="flex h-11 flex-1 items-center rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 text-sm text-[var(--app-text)]">
        {icon ? <span className="mr-2 text-[var(--app-primary)]">{icon}</span> : null}
        <span>{value}</span>
        {editable ? (
          <button
            type="button"
            className="ml-auto rounded p-1 text-[var(--app-text-muted)] hover:bg-[var(--app-hover)] hover:text-[var(--app-primary)]"
            aria-label={`编辑${label}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
