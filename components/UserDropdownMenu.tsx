"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Moon, Sun, UserRound } from "lucide-react";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(THEME_ENUM_LOCAL_STORAGE_KEY);
    const nextTheme: ThemeMode = saved === "dark" ? "dark" : "light";
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }, []);

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

  function onLogout() {
    const confirmed = window.confirm("是否确认登出账号");
    if (!confirmed) return;
    document.cookie = "codegpt_auth=; path=/; max-age=0; samesite=lax";
    router.replace("/login");
    router.refresh();
  }

  return (
    <div
      className={`relative ${className}`}
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
        <div className="absolute right-0 top-12 z-20 w-[180px] rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] p-2 shadow-lg">
          {!pathname.startsWith("/person") && (
            <Link
              href="/person"
              onClick={() => setOpen(false)}
              className="block cursor-pointer rounded-md px-3 py-2 text-center text-base leading-6 text-[var(--app-text)] hover:bg-[var(--app-hover)]"
            >
              admin
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
            onClick={onLogout}
            className="mt-1 flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-md px-3 text-sm text-[var(--app-primary)] hover:bg-[var(--app-hover)]"
          >
            <LogOut className="h-4 w-4" />
            登出
          </button>
        </div>
      )}
    </div>
  );
}
