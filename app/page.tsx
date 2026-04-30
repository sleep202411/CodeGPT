"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import Link from "next/link";
import {
  CheckSquare,
  Layers3,
  MessageSquarePlus,
  MoreVertical,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Search,
  Trash2,
  UserRound,
  XSquare,
} from "lucide-react";
import ChatInput from "@/components/ChatInput";
import ChatOutput from "@/components/ChatOutput";
import UserDropdownMenu from "@/components/UserDropdownMenu";

type RecentSession = {
  id: string;
  title: string;
  updatedAt?: string;
};

const RECENT_SESSIONS_API = "/api/sessions/recent";
const FALLBACK_SESSIONS: RecentSession[] = [
  { id: "demo-1", title: "欧盟关税教育影响" },
  { id: "demo-2", title: "伊朗袭击美国" },
  { id: "demo-3", title: "战斗机" },
  { id: "demo-4", title: "你是谁" },
  { id: "demo-5", title: "知识库索引方案" },
];

export default function Home() {
  const { input, messages, status, handleInputChange, handleSubmit, setMessages, setInput } = useChat();
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sideBarOpen, setSideBarOpen] = useState(true);
  const [showSessionSearch, setShowSessionSearch] = useState(false);
  const [sessionKeyword, setSessionKeyword] = useState("");
  const [batchMode, setBatchMode] = useState(false);
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
  const [menuState, setMenuState] = useState<{ id: string; top: number; left: number } | null>(null);
  const closeMenuTimerRef = useRef<number | null>(null);
  const [renameSessionId, setRenameSessionId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [sessionsLoadingAction, setSessionsLoadingAction] = useState(false);

  const debouncedKeyword = useDebouncedValue(sessionKeyword, 300);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchRecentSessions() {
      setSessionsLoading(true);
      setSessionsError(null);
      try {
        const query = debouncedKeyword.trim()
          ? `?keyword=${encodeURIComponent(debouncedKeyword.trim())}`
          : "";
        const res = await fetch(`${RECENT_SESSIONS_API}${query}`, {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
        });
        if (!res.ok) {
          setRecentSessions(FALLBACK_SESSIONS);
          if (!activeSessionId) {
            setActiveSessionId(FALLBACK_SESSIONS[0]?.id ?? null);
          }
          setSessionsError("后端会话接口暂不可用，当前显示演示数据");
          return;
        }
        const data = (await res.json()) as { sessions?: RecentSession[] };
        const sessions = Array.isArray(data.sessions) ? data.sessions : [];
        setRecentSessions(sessions);
        if (!activeSessionId && sessions.length > 0) {
          setActiveSessionId(sessions[0].id);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        setRecentSessions(FALLBACK_SESSIONS);
        if (!activeSessionId) {
          setActiveSessionId(FALLBACK_SESSIONS[0]?.id ?? null);
        }
        setSessionsError(error instanceof Error ? error.message : "获取最近会话失败");
      } finally {
        if (!controller.signal.aborted) {
          setSessionsLoading(false);
        }
      }
    }

    fetchRecentSessions();
    return () => controller.abort();
  }, [debouncedKeyword]);

  function startNewChat() {
    setMessages([]);
    setInput("");
    setActiveSessionId(null);
  }

  function toggleSelectSession(id: string) {
    setSelectedSessionIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedSessionIds(checked ? recentSessions.map((item) => item.id) : []);
  }

  async function doDelete(ids: string[]) {
    if (ids.length === 0) return;
    const ok = window.confirm(ids.length > 1 ? `确定删除选中的 ${ids.length} 个会话吗？` : "确定删除该会话吗？");
    if (!ok) return;
    setSessionsLoadingAction(true);
    const res = await fetch("/api/sessions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    setSessionsLoadingAction(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data?.error || "删除失败");
      return;
    }
    setRecentSessions((prev) => prev.filter((item) => !ids.includes(item.id)));
    setSelectedSessionIds((prev) => prev.filter((id) => !ids.includes(id)));
    if (ids.includes(activeSessionId ?? "")) {
      setActiveSessionId(null);
      setMessages([]);
      setInput("");
    }
  }

  async function submitRename(sessionId: string) {
    const title = renameValue.trim();
    if (!title) {
      alert("会话名称不能为空");
      return;
    }
    setSessionsLoadingAction(true);
    const res = await fetch(`/api/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setSessionsLoadingAction(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data?.error || "重命名失败");
      return;
    }
    const data = (await res.json()) as { session: RecentSession };
    setRecentSessions((prev) => prev.map((item) => (item.id === sessionId ? data.session : item)));
    setRenameSessionId(null);
    setRenameValue("");
  }

  function openFloatingMenu(sessionId: string, target: HTMLElement) {
    if (closeMenuTimerRef.current) {
      window.clearTimeout(closeMenuTimerRef.current);
      closeMenuTimerRef.current = null;
    }
    const rect = target.getBoundingClientRect();
    setMenuState({
      id: sessionId,
      top: rect.bottom + 6,
      left: rect.right + 8,
    });
  }

  function scheduleCloseFloatingMenu() {
    if (closeMenuTimerRef.current) {
      window.clearTimeout(closeMenuTimerRef.current);
    }
    closeMenuTimerRef.current = window.setTimeout(() => {
      setMenuState(null);
      closeMenuTimerRef.current = null;
    }, 120);
  }

  return (
    <main className="flex h-screen w-screen bg-[var(--app-bg)] text-[var(--app-text)]">
      <aside
        className={`hidden h-full flex-col border-r border-[var(--app-border-strong)] bg-[var(--app-surface)] p-3 transition-all duration-300 lg:flex ${
          sideBarOpen ? "w-[312px]" : "w-[88px]"
        }`}
      >
        <div className={`mb-3 flex h-14 items-center ${sideBarOpen ? "justify-between px-2" : "justify-center"}`}>
          <div className={`flex items-center gap-2 overflow-hidden ${sideBarOpen ? "max-w-full" : "max-w-0"}`}>
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--app-primary)] text-sm font-bold text-white">
              C
            </span>
            <span className="text-2xl font-bold text-[var(--app-primary)]">CodeGPT</span>
          </div>
          <button
            className="cursor-pointer rounded p-1 text-[var(--app-text-muted)] hover:bg-[var(--app-hover)]"
            aria-label="切换侧边栏"
            onClick={() => setSideBarOpen((v) => !v)}
          >
            {sideBarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
          </button>
        </div>

        <button
          type="button"
          onClick={startNewChat}
          className={`mb-4 flex h-[46px] w-full cursor-pointer items-center rounded-[4px] bg-[var(--app-primary-soft)] text-[16px] text-[var(--app-primary)] transition-all duration-300 ${
            sideBarOpen ? "justify-start px-[14px]" :"justify-center px-0"
          }`}
        >
          <MessageSquarePlus className="h-[20px] w-[20px] shrink-0" />
          <span
            className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
              sideBarOpen ? "ml-[16px] max-w-[220px] opacity-100" : "ml-0 max-w-0 opacity-0"
            }`}
          >
            新对话
          </span>
        </button>

        <div className={`flex-1 min-h-0 overflow-hidden ${sideBarOpen ? "" : "hidden"}`}>
          <div className="h-full space-y-2 overflow-auto pr-1">
          <div className="sticky top-0 z-10 bg-[var(--app-surface)]">
            <div className="mb-2 border-t border-[var(--app-border)] pt-3 text-xs text-[var(--app-text-muted)]">
              {!showSessionSearch ? (
                <div className="flex items-center">
                  <span>最近对话</span>
                  <button
                    type="button"
                    className="ml-auto cursor-pointer rounded p-1 hover:bg-[var(--app-hover)]"
                    onClick={() => setShowSessionSearch(true)}
                    aria-label="搜索会话"
                  >
                    <Search className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex h-9 items-center rounded-md border border-[var(--app-border)] bg-[var(--app-card)] px-2">
                  <Search className="h-3.5 w-3.5 text-[var(--app-text-muted)]" />
                  <input
                    value={sessionKeyword}
                    onChange={(e) => setSessionKeyword(e.target.value)}
                    onBlur={() => {
                      if (!sessionKeyword.trim()) {
                        setShowSessionSearch(false);
                      }
                    }}
                    placeholder="搜索会话"
                    autoFocus
                    className="ml-2 w-full bg-transparent text-sm text-[var(--app-text)] outline-none placeholder:text-[var(--app-text-muted)]"
                  />
                </div>
              )}
            </div>
            {batchMode && (
              <div className="mb-2 flex h-10 items-center rounded-md border border-[var(--app-border)] bg-[var(--app-card)] px-2 text-xs">
                <input
                  type="checkbox"
                  checked={recentSessions.length > 0 && selectedSessionIds.length === recentSessions.length}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                />
                <span className="ml-2 text-[var(--app-primary)]">批量删除</span>
                <button
                  type="button"
                  className="ml-auto cursor-pointer rounded p-1 text-[var(--app-text-muted)] hover:bg-[var(--app-hover)]"
                  onClick={() => {
                    setBatchMode(false);
                    setSelectedSessionIds([]);
                  }}
                >
                  <XSquare className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={selectedSessionIds.length === 0 || sessionsLoadingAction}
                  className="ml-1 cursor-pointer rounded p-1 text-[var(--app-primary)] hover:bg-[var(--app-hover)] disabled:opacity-40"
                  onClick={() => doDelete(selectedSessionIds)}
                >
                  <CheckSquare className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {sessionsLoading &&
            Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={`skeleton-${idx}`}
                className="h-8 animate-pulse rounded bg-[var(--app-hover)]"
              />
            ))}

          {!sessionsLoading && sessionsError && (
            <div className="rounded border border-[#f0d4d4] bg-[#fff5f5] px-2 py-2 text-xs text-[#b64b4b]">
              {sessionsError}
            </div>
          )}

          {!sessionsLoading && !sessionsError && recentSessions.length === 0 && (
            <div className="rounded px-2 py-2 text-sm text-[var(--app-text-muted)]">暂无最近对话</div>
          )}

          {!sessionsLoading && !sessionsError && debouncedKeyword.trim() && recentSessions.length === 0 && (
            <div className="rounded px-2 py-2 text-sm text-[var(--app-text-muted)]">未找到匹配的对话</div>
          )}

          {!sessionsLoading &&
            !sessionsError &&
            recentSessions.map((item) => {
              const isActive = item.id === activeSessionId;
              return (
                <div
                  key={item.id}
                  className={`group relative flex h-[46px] cursor-pointer items-center gap-2 rounded px-2.5 text-left text-sm transition-colors ${
                    isActive
                      ? "bg-[var(--app-primary-soft)] text-[var(--app-primary)]"
                      : "text-[var(--app-text-secondary)] hover:bg-[var(--app-hover)]"
                  }`}
                >
                  {batchMode && (
                    <input
                      type="checkbox"
                      checked={selectedSessionIds.includes(item.id)}
                      onChange={() => toggleSelectSession(item.id)}
                    />
                  )}
                  {renameSessionId === item.id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => {
                        setRenameSessionId(null);
                        setRenameValue("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          submitRename(item.id);
                        }
                      }}
                      className="h-8 w-full rounded border border-[var(--app-border)] bg-[var(--app-card)] px-2 text-sm outline-none"
                    />
                  ) : (
                    <button
                      type="button"
                      className="flex-1 cursor-pointer truncate text-left"
                      onClick={() => {
                        if (batchMode) {
                          toggleSelectSession(item.id);
                          return;
                        }
                        setActiveSessionId(item.id);
                      }}
                      title={item.title}
                    >
                      {item.title}
                    </button>
                  )}
                  {!batchMode && renameSessionId !== item.id && (
                    <>
                      <div
                        className="relative"
                        onMouseLeave={scheduleCloseFloatingMenu}
                      >
                        <button
                          type="button"
                          onMouseEnter={(e) => openFloatingMenu(item.id, e.currentTarget)}
                          className={`cursor-pointer rounded p-1 text-[var(--app-text-muted)] hover:bg-[var(--app-hover)] ${
                            menuState?.id === item.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                          }`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {menuState && (
          <div
            className="fixed z-[60] w-[152px] rounded-lg border border-[var(--app-border)] bg-[var(--app-card)] p-1 shadow-[0_6px_16px_rgba(0,0,0,0.12)]"
            style={{ top: menuState.top, left: menuState.left }}
            onMouseEnter={() => {
              if (closeMenuTimerRef.current) {
                window.clearTimeout(closeMenuTimerRef.current);
                closeMenuTimerRef.current = null;
              }
            }}
            onMouseLeave={scheduleCloseFloatingMenu}
          >
            <button
              type="button"
              className="flex h-8 w-full cursor-pointer items-center gap-2 rounded-md px-2.5 text-[14px] leading-5 hover:bg-[var(--app-hover)]"
              onClick={() => {
                const current = recentSessions.find((s) => s.id === menuState.id);
                if (!current) return;
                setRenameSessionId(menuState.id);
                setRenameValue(current.title);
                setMenuState(null);
              }}
            >
              <Pencil className="h-[14px] w-[14px]" />
              重命名
            </button>
            <button
              type="button"
              className="flex h-8 w-full cursor-pointer items-center gap-2 rounded-md px-2.5 text-[14px] leading-5 hover:bg-[var(--app-hover)]"
              onClick={() => {
                setBatchMode(true);
                setSelectedSessionIds([menuState.id]);
                setMenuState(null);
              }}
            >
              <Layers3 className="h-[14px] w-[14px]" />
              批量操作
            </button>
            <button
              type="button"
              className="flex h-8 w-full cursor-pointer items-center gap-2 rounded-md px-2.5 text-[14px] leading-5 text-[#ff4d4f] hover:bg-[var(--app-hover)]"
              onClick={() => {
                const id = menuState.id;
                setMenuState(null);
                doDelete([id]);
              }}
            >
              <Trash2 className="h-[14px] w-[14px]" />
              删除
            </button>
          </div>
        )}

        <div className="mt-auto border-t border-[var(--app-border)] pt-3">
          <Link
            href="/person"
            className={`flex h-[46px] items-center rounded-md text-sm text-[var(--app-text-secondary)] hover:bg-[var(--app-hover)] ${
              sideBarOpen ? "px-3" : "justify-center px-0"
            }`}
          >
            <UserRound className="h-4 w-4 shrink-0" />
            <span
              className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                sideBarOpen ? "ml-3 max-w-[180px] opacity-100" : "ml-0 max-w-0 opacity-0"
              }`}
            >
              个人中心
            </span>
          </Link>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center px-6">
          <UserDropdownMenu className="ml-auto" />
        </header>

        <div className="flex min-h-0 flex-1 flex-col px-6 pb-4">
          {messages.length === 0 ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
              <div className="text-center">
                <h1 className="font-brand text-[44px] font-bold tracking-wide text-[var(--app-text)]">
                  欢迎使用 <span className="text-[var(--app-primary)]">CodeGPT</span>
                </h1>
                <p className="mt-2 text-sm text-[var(--app-text-muted)]">高效AI搜索</p>
              </div>
              <div className="mt-10 w-full max-w-4xl rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] px-3 py-3 shadow-sm">
                <ChatInput input={input} handleInputChange={handleInputChange} handleSubmit={handleSubmit} />
              </div>
              <p className="pt-4 text-center text-xs text-[var(--app-text-muted)]">
                内容由AI生成，仅供参考。请遵守平台用户协议和隐私政策。
              </p>
            </div>
          ) : (
            <>
              <div className="flex min-h-0 flex-1 flex-col items-center overflow-auto">
                <div className="w-full max-w-4xl py-6">
                  <ChatOutput messages={messages} status={status} />
                </div>
              </div>
              <div className="mx-auto w-full max-w-4xl rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] px-3 py-3 shadow-sm">
                <ChatInput input={input} handleInputChange={handleInputChange} handleSubmit={handleSubmit} />
              </div>
              <p className="pt-4 text-center text-xs text-[var(--app-text-muted)]">
                内容由AI生成，仅供参考。请遵守平台用户协议和隐私政策。
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function useDebouncedValue(value: string, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}