"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    setLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 300));

    if (username.trim() !== "admin" || password !== "admin123") {
      setLoading(false);
      setError("用户名或密码错误");
      return;
    }

    document.cookie = `codegpt_auth=admin; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;

    setLoading(false);
    const next = new URLSearchParams(window.location.search).get("next");
    const dest =
      next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
    router.replace(dest);
    router.refresh();
  }

  return (
    <div className="w-full min-h-screen bg-[#eef3fb]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1320px] items-center px-8 py-10">
        <div className="hidden w-1/2 items-center justify-center lg:flex">
          <div className="h-[420px] w-[420px] rounded-full bg-gradient-to-br from-sky-200/50 to-blue-100/20 blur-xl" />
        </div>
        <div className="flex-1 rounded-2xl border border-[#dfe7f4] bg-white px-8 py-10 shadow-sm md:px-14 md:py-16 lg:max-w-[560px]">
          <div className="font-brand mb-4 text-center font-semibold text-[40px] leading-[40px] text-[#1f7be9]">
            欢迎使用
          </div>
          <div className="border-b border-dashed border-[#d7dfea] pb-8 text-center text-[22px] font-semibold text-[#6b7a90]">
            CodeGPT
          </div>

          <form onSubmit={onSubmit} className="mt-14 space-y-6">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-[#4f5f75]">
                用户名
              </label>
              <Input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                className="h-14 rounded-xl border-[#d4deec] bg-[#f7faff] text-base focus-visible:ring-[#95baf3]"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-[#4f5f75]">
                密码
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="h-14 rounded-xl border-[#d4deec] bg-[#f7faff] text-base focus-visible:ring-[#95baf3]"
              />
            </div>

            {error && (
              <p className="text-sm text-[#e54949]" role="alert">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="mt-12 h-14 w-full rounded-xl bg-[#1f7be9] text-[17px] text-white hover:bg-[#1d70d5]"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" />
                  登录中…
                </>
              ) : (
                "立即登录"
              )}
            </Button>
          </form>

          <p className="mt-4 text-xs text-[#8c9aaf]">
            测试账号：用户名 <span className="font-medium text-[#4f5f75]">admin</span>，密码{" "}
            <span className="font-medium text-[#4f5f75]">admin123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
