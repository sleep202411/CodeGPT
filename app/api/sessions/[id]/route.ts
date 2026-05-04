import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/server/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const auth = await createServerSupabase();
    const {
      data: { user },
      error: userError,
    } = await auth.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const admin = createSupabaseAdmin();
    const { data: session, error: sessionError } = await admin
      .from("chat_sessions")
      .select("id, title, updated_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (sessionError) throw sessionError;
    if (!session) {
      return NextResponse.json({ error: "会话不存在" }, { status: 404 });
    }
    const { data: messageRows, error: messagesError } = await admin
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("session_id", id)
      .order("created_at", { ascending: true });
    if (messagesError) throw messagesError;
    const messages = (messageRows ?? []).map((item) => ({
      id: String(item.id),
      role: item.role,
      content: item.content,
      createdAt: item.created_at,
    }));
    return NextResponse.json({
      session: {
        id: session.id,
        title: session.title,
        updatedAt: session.updated_at,
      },
      messages,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取会话详情失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const auth = await createServerSupabase();
    const {
      data: { user },
      error: userError,
    } = await auth.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const body = (await request.json()) as { title?: string };
    const title = body?.title?.trim() ?? "";
    if (!title) {
      return NextResponse.json({ error: "会话名称不能为空" }, { status: 400 });
    }
    const admin = createSupabaseAdmin();
    const { data, error } = await admin
      .from("chat_sessions")
      .update({ title, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id, title, updated_at")
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "会话不存在" }, { status: 404 });
    }
    return NextResponse.json(
      {
        session: {
          id: data.id,
          title: data.title,
          updatedAt: data.updated_at,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "重命名会话失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
