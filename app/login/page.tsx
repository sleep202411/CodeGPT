"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSafePostAuthRedirect } from "@/lib/auth-redirect";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    const data = (await res.json()) as { error?: string };
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "登录失败");
      return;
    }
    router.replace(getSafePostAuthRedirect());
    router.refresh();
  }

  return (
    <AuthPageShell title="欢迎使用">
          <form onSubmit={onSubmit} className="mt-14 space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-[#4f5f75]">
                邮箱
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱"
                className="h-14 rounded-xl border-[#d4deec] bg-[#f7faff] text-base focus-visible:ring-[#95baf3]"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-[#4f5f75]">
                密码
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="h-14 rounded-xl border-[#d4deec] bg-[#f7faff] pr-12 text-base focus-visible:ring-[#95baf3]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded p-1 text-[#7b8aa2] hover:bg-[#e9f0fb]"
                  aria-label={showPassword ? "隐藏密码" : "显示密码"}
                >
                  {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
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

          <p className="mt-6 text-center text-sm text-[#6b7a90]">
            还没有账号？{" "}
            <Link href="/register" className="font-medium text-[#1f7be9] hover:underline">
              去注册
            </Link>
          </p>
    </AuthPageShell>
  );
}
