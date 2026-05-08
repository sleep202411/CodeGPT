"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import type { Message } from "ai";
import { ChatMainPanel } from "@/components/home/ChatMainPanel";
import { HomeSidebar } from "@/components/home/HomeSidebar";
import type { ChatUploadAttachment } from "@/components/ChatInput";
import { ATTACH_UI_PLACEHOLDER_URL } from "@/lib/chat/attachment-display-meta";
import { buildMessageWithAttachments, isUuid } from "@/lib/chat/build-user-message";
import { RECENT_SESSIONS_API } from "@/lib/api/sessions-constants";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import type { RecentSession } from "@/lib/types/session";
import { MAX_ATTACHMENTS_PER_MESSAGE, MAX_USER_MESSAGE_CHARS } from "@/lib/upload-policy";
import { ConfirmModal } from "@/components/ui/confirm-modal";

export default function Home() {
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
  const [deleteTargetIds, setDeleteTargetIds] = useState<string[] | null>(null);
  const [chatAttachments, setChatAttachments] = useState<ChatUploadAttachment[]>([]);
  const [attachmentsUploading, setAttachmentsUploading] = useState(false);
  const { input, messages, status, handleInputChange, append, setMessages, setInput } = useChat({
    api: "/api/chat",
    body: { sessionId: activeSessionId ?? undefined },
    onResponse: (response) => {
      const returnedSessionId = response.headers.get("x-session-id");
      if (returnedSessionId && returnedSessionId !== activeSessionId) {
        setActiveSessionId(returnedSessionId);
      }
    },
  });

  const debouncedKeyword = useDebouncedValue(sessionKeyword, 300);

  const fetchRecentSessions = useCallback(
    async (signal?: AbortSignal) => {
      setSessionsLoading(true);
      setSessionsError(null);
      try {
        const q = debouncedKeyword.trim().slice(0, 128);
        const query = q ? `?keyword=${encodeURIComponent(q)}` : "";
        const res = await fetch(`${RECENT_SESSIONS_API}${query}`, {
          method: "GET",
          signal,
          cache: "no-store",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || "获取最近会话失败");
        }
        const data = (await res.json()) as { sessions?: RecentSession[] };
        const sessions = Array.isArray(data.sessions) ? data.sessions : [];
        setRecentSessions(sessions);
      } catch (error) {
        if (signal?.aborted) return;
        setRecentSessions([]);
        setSessionsError(error instanceof Error ? error.message : "获取最近会话失败");
      } finally {
        if (!signal?.aborted) {
          setSessionsLoading(false);
        }
      }
    },
    [debouncedKeyword]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchRecentSessions(controller.signal);
    return () => controller.abort();
  }, [fetchRecentSessions]);

  useEffect(() => {
    const controller = new AbortController();
    if (!activeSessionId) {
      setMessages([]);
      return () => controller.abort();
    }
    async function loadSessionMessages() {
      const res = await fetch(`/api/sessions/${activeSessionId}`, {
        method: "GET",
        signal: controller.signal,
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { messages?: Array<{ id?: string; role: string; content: string }> };
      const normalized = Array.isArray(data.messages)
        ? data.messages.map(
            (item, idx): Message => ({
              id: item.id || `${activeSessionId}-${idx}`,
              role: item.role as Message["role"],
              content: item.content,
            })
          )
        : [];
      setMessages(normalized);
    }
    loadSessionMessages();
    return () => controller.abort();
  }, [activeSessionId, setMessages]);

  useEffect(() => {
    setChatAttachments([]);
  }, [activeSessionId]);

  function startNewChat() {
    setMessages([]);
    setInput("");
    setChatAttachments([]);
    setActiveSessionId(null);
  }

  async function handleChatSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (attachmentsUploading) {
      alert("请等待文件上传完成后再发送");
      return;
    }
    const question = input.trim();
    const hasExtracted = chatAttachments.some((a) => a.extractedText?.trim());
    if (!question && !hasExtracted) return;

    const useServerAttachmentIds =
      chatAttachments.length > 0 && chatAttachments.every((a) => a.fileId && isUuid(a.fileId));

    if (chatAttachments.length > MAX_ATTACHMENTS_PER_MESSAGE) {
      alert(`单次最多 ${MAX_ATTACHMENTS_PER_MESSAGE} 个附件，请删减后重试`);
      return;
    }

    if (chatAttachments.length > 0) {
      const mergedLen = buildMessageWithAttachments(question, chatAttachments).length;
      if (mergedLen > MAX_USER_MESSAGE_CHARS) {
        alert(
          `合并附件后的正文过长（约 ${mergedLen} 字），服务端上限 ${MAX_USER_MESSAGE_CHARS} 字，请减少附件或缩短内容`
        );
        return;
      }
    }

    const userLine = question || (chatAttachments.length > 0 ? "请结合附件内容回答。" : "");
    const requestBody = {
      sessionId: activeSessionId ?? undefined,
      userQuestion: question,
      ...(useServerAttachmentIds
        ? { attachmentIds: chatAttachments.map((a) => a.fileId!) }
        : chatAttachments.length > 0
          ? {
              attachmentRowsFallback: chatAttachments.map((a) => ({
                file_name: a.name,
                kind: (a.category === "image" ? "ocr_image" : "code") as "code" | "ocr_image",
                extracted_text: a.extractedText?.trim() ?? "",
              })),
            }
          : {}),
    };

    setInput("");
    setChatAttachments([]);

    await append(
      {
        role: "user",
        content: userLine,
        ...(chatAttachments.length > 0
          ? {
              experimental_attachments: chatAttachments.map((a) => ({
                name: a.name,
                contentType: `${a.mimeType || "application/octet-stream"}; x-codegpt-size=${a.size}`,
                url: ATTACH_UI_PLACEHOLDER_URL,
              })),
            }
          : {}),
      },
      { body: requestBody }
    );
    fetchRecentSessions();
  }

  function toggleSelectSession(id: string) {
    setSelectedSessionIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedSessionIds(checked ? recentSessions.map((item) => item.id) : []);
  }

  function requestDelete(ids: string[]) {
    if (ids.length === 0) return;
    setDeleteTargetIds(ids);
  }

  function closeDeleteConfirm() {
    if (sessionsLoadingAction) return;
    setDeleteTargetIds(null);
  }

  async function doDelete(ids: string[]) {
    if (ids.length === 0) return;
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
      setChatAttachments([]);
    }
  }

  async function confirmDelete() {
    if (!deleteTargetIds || deleteTargetIds.length === 0) return;
    await doDelete(deleteTargetIds);
    setDeleteTargetIds(null);
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

  function clearCloseMenuTimer() {
    if (closeMenuTimerRef.current) {
      window.clearTimeout(closeMenuTimerRef.current);
      closeMenuTimerRef.current = null;
    }
  }

  return (
    <main className="flex h-screen w-screen bg-[var(--app-bg)] text-[var(--app-text)]">
      <HomeSidebar
        sideBarOpen={sideBarOpen}
        onToggleSidebar={() => setSideBarOpen((v) => !v)}
        onStartNewChat={startNewChat}
        activeSessionId={activeSessionId}
        onActivateSession={setActiveSessionId}
        showSessionSearch={showSessionSearch}
        onShowSessionSearch={setShowSessionSearch}
        sessionKeyword={sessionKeyword}
        onSessionKeywordChange={setSessionKeyword}
        batchMode={batchMode}
        onExitBatchMode={() => {
          setBatchMode(false);
          setSelectedSessionIds([]);
        }}
        selectedSessionIds={selectedSessionIds}
        onToggleSelectSession={toggleSelectSession}
        onToggleSelectAll={toggleSelectAll}
        onDeleteSelectedInBatch={() => requestDelete(selectedSessionIds)}
        sessionsLoadingAction={sessionsLoadingAction}
        recentSessions={recentSessions}
        sessionsLoading={sessionsLoading}
        sessionsError={sessionsError}
        debouncedKeyword={debouncedKeyword}
        sessionSearchPending={sessionKeyword.trim() !== debouncedKeyword.trim()}
        renameSessionId={renameSessionId}
        renameValue={renameValue}
        onRenameValueChange={setRenameValue}
        onRenameInputBlur={() => {
          setRenameSessionId(null);
          setRenameValue("");
        }}
        onRenameKeyDown={(sessionId, key) => {
          if (key === "Enter") {
            submitRename(sessionId);
          }
        }}
        menuState={menuState}
        onOpenSessionMenu={openFloatingMenu}
        onScheduleCloseSessionMenu={scheduleCloseFloatingMenu}
        onSessionMenuMouseEnter={clearCloseMenuTimer}
        onMenuRename={() => {
          if (!menuState) return;
          const current = recentSessions.find((s) => s.id === menuState.id);
          if (!current) return;
          setRenameSessionId(menuState.id);
          setRenameValue(current.title);
          setMenuState(null);
        }}
        onMenuBatch={() => {
          if (!menuState) return;
          setBatchMode(true);
          setSelectedSessionIds([menuState.id]);
          setMenuState(null);
        }}
        onMenuDelete={() => {
          if (!menuState) return;
          const id = menuState.id;
          setMenuState(null);
          requestDelete([id]);
        }}
      />

      <ConfirmModal
        open={!!deleteTargetIds}
        title="删除确认"
        description={
          deleteTargetIds && deleteTargetIds.length > 1
            ? `是否确认删除选中的 ${deleteTargetIds.length} 个会话？删除后不可恢复。`
            : "是否确认删除该会话？删除后不可恢复。"
        }
        confirmText="确认删除"
        processingText="删除中…"
        confirming={sessionsLoadingAction}
        danger
        onClose={closeDeleteConfirm}
        onConfirm={confirmDelete}
      />

      <ChatMainPanel
        input={input}
        messages={messages}
        status={status}
        handleInputChange={handleInputChange}
        onChatSubmit={handleChatSubmit}
        chatAttachments={chatAttachments}
        onAttachmentsChange={setChatAttachments}
        onUploadingChange={setAttachmentsUploading}
      />
    </main>
  );
}
