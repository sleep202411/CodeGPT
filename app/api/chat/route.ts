import {
    streamText,
    type CoreMessage
} from 'ai';
import {
    createOpenAI
} from '@ai-sdk/openai';
import { createServerSupabase } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/server/supabase-admin";
import { mergeAttachmentsWithQuestion } from "@/lib/attachment-markdown";
import { MAX_ATTACHMENTS_PER_MESSAGE, MAX_USER_MESSAGE_CHARS } from "@/lib/upload-policy";

const deepseek = createOpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com/v1",
});
const JINA_EMBED_MODEL = process.env.JINA_EMBED_MODEL ?? "jina-embeddings-v3";
const EMBEDDING_DIMENSION = 1024;
const DEFAULT_SESSION_TITLE = "新对话";

function deriveSessionTitle(input: string) {
    const normalized = input.replace(/\s+/g, " ").trim();
    if (!normalized) return DEFAULT_SESSION_TITLE;
    return normalized.slice(0, 32);
}

async function generateEmbedding(message: string) {
    const apiKey = process.env.JINA_API_KEY;
    if (!apiKey) {
        throw new Error("JINA_API_KEY 未配置");
    }
    const response = await fetch(
        "https://api.jina.ai/v1/embeddings",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: JINA_EMBED_MODEL,
                input: [message],
                dimensions: EMBEDDING_DIMENSION,
            }),
        }
    );
    if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Jina 向量生成失败: ${detail || response.statusText}`);
    }
    const data = (await response.json()) as { data?: Array<{ embedding?: number[] }> };
    const vector = data.data?.[0]?.embedding;
    if (!Array.isArray(vector) || vector.length === 0) {
        throw new Error("Jina 向量返回为空");
    }
    if (vector.length !== EMBEDDING_DIMENSION) {
        throw new Error(`Jina 向量维度为 ${vector.length}，与数据库要求的 ${EMBEDDING_DIMENSION} 不一致`);
    }
    return vector;
}

async function fetchRelevantContext(embedding: number[]) {
    const supabase = createSupabaseAdmin();
    const {
        data,
        error
    } = await supabase.rpc("get_relevant_chunks", {
        query_vector: embedding,
        match_threshold: 0.7,
        match_count: 3
    })

    if (error) throw error;
    return JSON.stringify(
        (data ?? []).map((item: any) => `
        Source: ${item.url},
        Date Updated: ${item.date_updated}
        Content: ${item.content}  
      `)
    )
}

function findLastUserMessageIndex(messages: CoreMessage[]): number {
    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === "user") return i;
    }
    return -1;
}

const createPrompt = (context: string, userQuestion: string) => {
    return {
        role: 'system' as const,
        content: `
          你是 CodeGPT，一位专业的编程与代码问答助手。
          请使用以下上下文信息来回答用户问题：
          ----------------
          START CONTEXT
          ${context}
          END CONTEXT
          ----------------
          
          要求：
          - 用 Markdown 格式返回答案
          - 优先基于给定上下文回答，必要时补充通用编程知识
          - 若上下文不足，请明确说明“基于通用经验给出建议”
          - 回答应聚焦代码、工程实践、排错与架构设计
          - 对明显与编程无关的问题，可简短提醒当前助手主要用于代码问答
          
          ----------------
          QUESTION: ${userQuestion}
          ----------------`
    }
}

export async function POST(req: Request) {
    try {
        if (!process.env.DEEPSEEK_API_KEY) {
            throw new Error("DEEPSEEK_API_KEY 未配置");
        }
        const body = (await req.json()) as {
            messages?: Array<{ role: string; content: string }>;
            sessionId?: string;
            attachmentIds?: string[];
        };
        const attachmentIds = Array.isArray(body.attachmentIds)
            ? body.attachmentIds.filter((id): id is string => typeof id === "string" && id.length > 0)
            : [];

        let messagesCore: CoreMessage[] = Array.isArray(body.messages)
            ? body.messages
                .filter((item): item is { role: "system" | "user" | "assistant"; content: string } =>
                    (item.role === "system" || item.role === "user" || item.role === "assistant") &&
                    typeof item.content === "string"
                )
                .map((item) => ({ role: item.role, content: item.content }))
            : [];

        const lastUserIdx = findLastUserMessageIndex(messagesCore);
        if (lastUserIdx < 0) {
            return Response.json({ error: "用户消息不能为空" }, { status: 400 });
        }

        const rawUserLine = String(messagesCore[lastUserIdx].content ?? "");
        const userQuestionPlain = rawUserLine.trim();

        const authClient = await createServerSupabase();
        const {
            data: { user },
            error: userError,
        } = await authClient.auth.getUser();
        if (userError || !user) {
            return Response.json({ error: "未登录" }, { status: 401 });
        }

        if (attachmentIds.length > MAX_ATTACHMENTS_PER_MESSAGE) {
            return Response.json(
                {
                    error: `单次最多引用 ${MAX_ATTACHMENTS_PER_MESSAGE} 个附件，请删减后重试`,
                    code: "TOO_MANY_ATTACHMENTS",
                    max: MAX_ATTACHMENTS_PER_MESSAGE,
                },
                { status: 400 }
            );
        }
        if (new Set(attachmentIds).size !== attachmentIds.length) {
            return Response.json({ error: "附件 ID 列表存在重复" }, { status: 400 });
        }

        if (attachmentIds.length > 0) {
            const admin = createSupabaseAdmin();
            const { data: rows, error: attErr } = await admin
                .from("chat_attachments")
                .select("file_name, kind, extracted_text")
                .eq("user_id", user.id)
                .in("id", attachmentIds);
            if (attErr) throw attErr;
            if (!rows || rows.length !== attachmentIds.length) {
                return Response.json({ error: "附件不存在或无权访问" }, { status: 400 });
            }
            const merged = mergeAttachmentsWithQuestion(
                rows.map((r) => ({
                    file_name: r.file_name,
                    kind: r.kind as "code" | "ocr_image",
                    extracted_text: r.extracted_text,
                })),
                rawUserLine
            );
            const next = [...messagesCore] as CoreMessage[];
            next[lastUserIdx] = { role: "user", content: merged };
            messagesCore = next;
        }

        const latestMessage = String(messagesCore[lastUserIdx].content ?? "").trim();
        if (!latestMessage) {
            return Response.json({ error: "用户消息不能为空" }, { status: 400 });
        }

        if (latestMessage.length > MAX_USER_MESSAGE_CHARS) {
            return Response.json(
                {
                    error: `用户消息过长（合并附件后约 ${latestMessage.length} 字，上限 ${MAX_USER_MESSAGE_CHARS} 字）。请减少附件数量或缩短内容后重试`,
                    code: "MESSAGE_TOO_LONG",
                    maxChars: MAX_USER_MESSAGE_CHARS,
                },
                { status: 413 }
            );
        }

        const supabase = createSupabaseAdmin();
        let resolvedSessionId = body.sessionId?.trim() || "";
        if (!resolvedSessionId) {
            const title = deriveSessionTitle(userQuestionPlain || latestMessage);
            const { data: created, error: createError } = await supabase
                .from("chat_sessions")
                .insert({ user_id: user.id, title })
                .select("id")
                .single();
            if (createError || !created) {
                throw new Error(createError?.message || "创建会话失败");
            }
            resolvedSessionId = created.id as string;
        } else {
            const { data: exists, error: checkError } = await supabase
                .from("chat_sessions")
                .select("id")
                .eq("id", resolvedSessionId)
                .eq("user_id", user.id)
                .maybeSingle();
            if (checkError) {
                throw new Error(checkError.message);
            }
            if (!exists) {
                return Response.json({ error: "会话不存在或无权限" }, { status: 404 });
            }
        }
        const { error: insertUserError } = await supabase.from("chat_messages").insert({
            session_id: resolvedSessionId,
            role: "user",
            content: latestMessage,
        });
        if (insertUserError) throw insertUserError;
        await supabase
            .from("chat_sessions")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", resolvedSessionId)
            .eq("user_id", user.id);
        // embedding
        const embedding = await generateEmbedding(latestMessage);
        const context = await fetchRelevantContext(embedding);
        const prompt = createPrompt(context, latestMessage);
        const result = streamText({
            model: deepseek("deepseek-chat"),
            messages:[prompt,...messagesCore],
            onFinish: async ({ text }) => {
                if (!text?.trim()) return;
                const admin = createSupabaseAdmin();
                await admin.from("chat_messages").insert({
                    session_id: resolvedSessionId,
                    role: "assistant",
                    content: text,
                });
                const { data: currentSession } = await admin
                    .from("chat_sessions")
                    .select("title")
                    .eq("id", resolvedSessionId)
                    .eq("user_id", user.id)
                    .maybeSingle();
                if (currentSession?.title === DEFAULT_SESSION_TITLE) {
                    await admin
                        .from("chat_sessions")
                        .update({ title: deriveSessionTitle(userQuestionPlain || latestMessage) })
                        .eq("id", resolvedSessionId)
                        .eq("user_id", user.id);
                }
                await admin
                    .from("chat_sessions")
                    .update({ updated_at: new Date().toISOString() })
                    .eq("id", resolvedSessionId)
                    .eq("user_id", user.id);
            },
        });
        const streamResponse = result.toDataStreamResponse();
        const headers = new Headers(streamResponse.headers);
        headers.set("x-session-id", resolvedSessionId);
        return new Response(streamResponse.body, {
            status: streamResponse.status,
            headers,
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : "请求处理失败";
        return Response.json({ error: message }, { status: 500 });
    }
}