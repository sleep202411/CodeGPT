"use client";

import Link from "next/link";
import {
  CheckSquare,
  Layers3,
  MessageSquarePlus,
  MoreVertical,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  UserRound,
  XSquare,
} from "lucide-react";

import type { RecentSession } from "@/lib/types/session";
import { SessionFloatingMenu, type SessionMenuPosition } from "./SessionFloatingMenu";

export type HomeSidebarProps = Readonly<{
  sideBarOpen: boolean;
  onToggleSidebar: () => void;
  onStartNewChat: () => void;
  activeSessionId: string | null;
  onActivateSession: (id: string) => void;
  showSessionSearch: boolean;
  onShowSessionSearch: (show: boolean) => void;
  sessionKeyword: string;
  onSessionKeywordChange: (value: string) => void;
  batchMode: boolean;
  onExitBatchMode: () => void;
  selectedSessionIds: string[];
  onToggleSelectSession: (id: string) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onDeleteSelectedInBatch: () => void;
  sessionsLoadingAction: boolean;
  recentSessions: RecentSession[];
  sessionsLoading: boolean;
  sessionsError: string | null;
  debouncedKeyword: string;
  renameSessionId: string | null;
  renameValue: string;
  onRenameValueChange: (value: string) => void;
  onRenameInputBlur: () => void;
  onRenameKeyDown: (sessionId: string, key: string) => void;
  menuState: SessionMenuPosition | null;
  onOpenSessionMenu: (sessionId: string, target: HTMLElement) => void;
  onScheduleCloseSessionMenu: () => void;
  onSessionMenuMouseEnter: () => void;
  onMenuRename: () => void;
  onMenuBatch: () => void;
  onMenuDelete: () => void;
}>;

export function HomeSidebar(props: HomeSidebarProps) {
  const {
    sideBarOpen,
    onToggleSidebar,
    onStartNewChat,
    activeSessionId,
    onActivateSession,
    showSessionSearch,
    onShowSessionSearch,
    sessionKeyword,
    onSessionKeywordChange,
    batchMode,
    onExitBatchMode,
    selectedSessionIds,
    onToggleSelectSession,
    onToggleSelectAll,
    onDeleteSelectedInBatch,
    sessionsLoadingAction,
    recentSessions,
    sessionsLoading,
    sessionsError,
    debouncedKeyword,
    renameSessionId,
    renameValue,
    onRenameValueChange,
    onRenameInputBlur,
    onRenameKeyDown,
    menuState,
    onOpenSessionMenu,
    onScheduleCloseSessionMenu,
    onSessionMenuMouseEnter,
    onMenuRename,
    onMenuBatch,
    onMenuDelete,
  } = props;

  return (
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
          type="button"
          className="cursor-pointer rounded p-1 text-[var(--app-text-muted)] hover:bg-[var(--app-hover)]"
          aria-label="切换侧边栏"
          onClick={onToggleSidebar}
        >
          {sideBarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
        </button>
      </div>

      <button
        type="button"
        onClick={onStartNewChat}
        className={`mb-4 flex h-[46px] w-full cursor-pointer items-center rounded-[4px] text-[16px] transition-all duration-300 ${
          activeSessionId === null
            ? "bg-[var(--app-primary-soft)] text-[var(--app-primary)]"
            : "text-[var(--app-text-secondary)] hover:bg-[var(--app-hover)]"
        } ${sideBarOpen ? "justify-start px-[14px]" : "justify-center px-0"}`}
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
                    onClick={() => onShowSessionSearch(true)}
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
                    onChange={(e) => onSessionKeywordChange(e.target.value)}
                    onBlur={() => {
                      if (!sessionKeyword.trim()) {
                        onShowSessionSearch(false);
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
                  onChange={(e) => onToggleSelectAll(e.target.checked)}
                />
                <span className="ml-2 text-[var(--app-primary)]">批量删除</span>
                <button
                  type="button"
                  className="ml-auto cursor-pointer rounded p-1 text-[var(--app-text-muted)] hover:bg-[var(--app-hover)]"
                  onClick={onExitBatchMode}
                >
                  <XSquare className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={selectedSessionIds.length === 0 || sessionsLoadingAction}
                  className="ml-1 cursor-pointer rounded p-1 text-[var(--app-primary)] hover:bg-[var(--app-hover)] disabled:opacity-40"
                  onClick={onDeleteSelectedInBatch}
                >
                  <CheckSquare className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {sessionsLoading &&
            Array.from({ length: 5 }).map((_, idx) => (
              <div key={`skeleton-${idx}`} className="h-8 animate-pulse rounded bg-[var(--app-hover)]" />
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
                      onChange={() => onToggleSelectSession(item.id)}
                    />
                  )}
                  {renameSessionId === item.id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => onRenameValueChange(e.target.value)}
                      onBlur={onRenameInputBlur}
                      onKeyDown={(e) => onRenameKeyDown(item.id, e.key)}
                      className="h-8 w-full rounded border border-[var(--app-border)] bg-[var(--app-card)] px-2 text-sm outline-none"
                    />
                  ) : (
                    <button
                      type="button"
                      className="flex-1 cursor-pointer truncate text-left"
                      onClick={() => {
                        if (batchMode) {
                          onToggleSelectSession(item.id);
                          return;
                        }
                        onActivateSession(item.id);
                      }}
                      title={item.title}
                    >
                      {item.title}
                    </button>
                  )}
                  {!batchMode && renameSessionId !== item.id && (
                    <div className="relative" onMouseLeave={onScheduleCloseSessionMenu}>
                      <button
                        type="button"
                        onMouseEnter={(e) => onOpenSessionMenu(item.id, e.currentTarget)}
                        className={`cursor-pointer rounded p-1 text-[var(--app-text-muted)] hover:bg-[var(--app-hover)] ${
                          menuState?.id === item.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {menuState && (
        <SessionFloatingMenu
          menu={menuState}
          onMouseEnter={onSessionMenuMouseEnter}
          onMouseLeave={onScheduleCloseSessionMenu}
          onRename={onMenuRename}
          onBatch={onMenuBatch}
          onDelete={onMenuDelete}
        />
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
  );
}
