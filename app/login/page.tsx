"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getBrowserSupabase,
  isSupabaseAuthConfigured,
} from "@/lib/supabase/browser-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const configured = isSupabaseAuthConfigured();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!configured) {
      setError("未配置 NEXT_PUBLIC_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_ANON_KEY");
      return;
    }
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("无法初始化 Supabase 客户端");
      return;
    }
    setLoading(true);
    const { error: signError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (signError) {
      setError(signError.message);
      return;
    }
    const next = new URLSearchParams(window.location.search).get("next");
    const dest =
      next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
    router.replace(dest);
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-50/80 via-background to-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 bg-clip-text text-transparent tracking-wide"
          >
            CodeGPT
          </Link>
          <p className="text-muted-foreground text-sm mt-2">登录以继续使用</p>
        </div>

        <div className="rounded-2xl border border-blue-100/80 bg-card/80 backdrop-blur-sm shadow-lg shadow-blue-500/5 p-8">
          {!configured && (
            <p className="text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900 rounded-lg px-3 py-2 mb-6">
              请在 <code className="text-xs">.env.local</code> 中配置{" "}
              <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> 与{" "}
              <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
              （项目 Settings → API 中的 anon public key），并在 Supabase
              Authentication 中启用 Email 登录。
            </p>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
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
                placeholder="you@example.com"
                className="h-11 rounded-xl border-blue-100 focus-visible:ring-blue-200"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
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
                placeholder="••••••••"
                className="h-11 rounded-xl border-blue-100 focus-visible:ring-blue-200"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" />
                  登录中…
                </>
              ) : (
                "登录"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            <Link href="/" className="text-blue-600 hover:text-blue-700 underline-offset-4 hover:underline">
              返回首页
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
