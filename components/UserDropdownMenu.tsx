"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Moon, ShieldCheck, Sun, UserRound } from "lucide-react";

import { fetchUserProfile } from "@/lib/api/person-client";

const THEME_ENUM_LOCAL_STORAGE_KEY = "theme";

type ThemeMode = "light" | "dark";

function applyTheme(theme: ThemeMode) {
  document.body.setAttribute("theme", theme);
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export default function UserDropdownMenu({ className = "" }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [menuLabel, setMenuLabel] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(THEME_ENUM_LOCAL_STORAGE_KEY);
    const nextTheme: ThemeMode = saved === "dark" ? "dark" : "light";
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }, []);

  useEffect(() => {
    // 个人中心页本身会拉 profile，这里再请求会重复；该页也不展示「进个人中心」入口
    if (pathname.startsWith("/person")) {
      return;
    }
    const controller = new AbortController();
    (async () => {
      const result = await fetchUserProfile(controller.signal);
      if (result.status !== "success") return;
      const name = result.profile?.userName?.trim();
      setMenuLabel(name || "用户");
      setIsAdmin((result.profile?.userRole ?? "") === "管理员");
    })();
    return () => controller.abort();
  }, [pathname]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  function openMenu() {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpen(true);
  }

  function scheduleCloseMenu() {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, 120);
  }

  function changeTheme() {
    const nextTheme: ThemeMode = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem(THEME_ENUM_LOCAL_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
    setOpen(false);
  }

  async function confirmLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setLogoutConfirmOpen(false);
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {isAdmin && !pathname.startsWith("/admin") ? (
        <Link
          href="/admin"
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--app-border)] bg-[var(--app-surface)] px-2.5 text-xs font-medium text-[var(--app-text-secondary)] hover:bg-[var(--app-hover)] hover:text-[var(--app-text)]"
        >
          <ShieldCheck className="h-3.5 w-3.5 text-[var(--app-primary)]" />
          后台管理
        </Link>
      ) : null}
      <div
        className="relative"
        ref={containerRef}
        onMouseEnter={openMenu}
        onMouseLeave={scheduleCloseMenu}
      >
        <button
          type="button"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[var(--app-primary)] text-white"
          aria-label="打开用户菜单"
        >
          <UserRound className="h-5 w-5" />
        </button>
      {open && (
        <div className="absolute right-0 top-12 z-20 w-[190px] rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] p-2 shadow-lg">
          {!pathname.startsWith("/person") && (
            <Link
              href="/person"
              onClick={() => setOpen(false)}
              className="block cursor-pointer rounded-md px-3 py-2 text-center text-base leading-6 text-[var(--app-text)] hover:bg-[var(--app-hover)]"
            >
              {menuLabel || "…"}
            </Link>
          )}
          <button
            type="button"
            onClick={changeTheme}
            className="mt-1 flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-md px-3 text-sm text-[var(--app-text-secondary)] hover:bg-[var(--app-hover)]"
          >
            {theme === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "light" ? "暗色模式" : "亮色模式"}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setLogoutConfirmOpen(true);
            }}
            className="mt-1 flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-md px-3 text-sm text-[var(--app-primary)] hover:bg-[var(--app-hover)]"
          >
            <LogOut className="h-4 w-4" />
            登出
          </button>
        </div>
      )}
      {logoutConfirmOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-[360px] rounded-xl bg-[var(--app-card)] p-5 shadow-xl">
            <h3 className="text-base font-semibold text-[var(--app-text)]">提示</h3>
            <p className="mt-2 text-sm text-[var(--app-text-secondary)]">是否确认登出账号</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLogoutConfirmOpen(false)}
                className="h-9 cursor-pointer rounded-md border border-[var(--app-border)] px-4 text-sm text-[var(--app-text-secondary)] hover:bg-[var(--app-hover)]"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="h-9 cursor-pointer rounded-md bg-[var(--app-primary)] px-4 text-sm text-white hover:opacity-90"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
