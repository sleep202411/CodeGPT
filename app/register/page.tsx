"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        password,
        userName: userName.trim() || undefined,
      }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      msg?: string;
    };
    if (!res.ok) {
      startTransition(() => {
        setLoading(false);
        setError(data.msg || "注册失败");
      });
      return;
    }

    startTransition(() => {
      setLoading(false);
      if (data.msg) {
        setInfo(data.msg);
      }
    });
    /* 整页跳转，避免翻译扩展改写 DOM 后与 React 提交冲突（removeChild 报错） */
    window.location.assign("/");
  }

  return (
    <AuthPageShell title="注册账号" noTranslate>
          <form onSubmit={onSubmit} className="mt-14 space-y-6">
            <div className="space-y-2">
              <label htmlFor="reg-email" className="text-sm font-medium text-[#4f5f75]">
                邮箱
              </label>
              <Input
                id="reg-email"
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
              <label htmlFor="reg-name" className="text-sm font-medium text-[#4f5f75]">
                用户昵称
              </label>
              <Input
                id="reg-name"
                name="userName"
                type="text"
                autoComplete="nickname"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="选填"
                className="h-14 rounded-xl border-[#d4deec] bg-[#f7faff] text-base focus-visible:ring-[#95baf3]"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="reg-password" className="text-sm font-medium text-[#4f5f75]">
                密码
              </label>
              <div className="relative">
                <Input
                  id="reg-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少 6 位"
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
            {info && (
              <p className="text-sm text-[#4f5f75]" role="status">
                {info}
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
                  注册中…
                </>
              ) : (
                "注册"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-[#6b7a90]">
            已有账号？{" "}
            <Link href="/login" className="font-medium text-[#1f7be9] hover:underline">
              去登录
            </Link>
          </p>
    </AuthPageShell>
  );
}
