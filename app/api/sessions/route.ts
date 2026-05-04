import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/server/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const auth = await createServerSupabase();
    const {
      data: { user },
      error: userError,
    } = await auth.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const body = (await request.json().catch(() => ({}))) as { title?: string };
    const title = body.title?.trim() || "新对话";
    const admin = createSupabaseAdmin();
    const { data, error } = await admin
      .from("chat_sessions")
      .insert({ user_id: user.id, title })
      .select("id, title, updated_at")
      .single();
    if (error || !data) throw error ?? new Error("创建会话失败");
    return NextResponse.json({
      session: {
        id: data.id,
        title: data.title,
        updatedAt: data.updated_at,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建会话失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await createServerSupabase();
    const {
      data: { user },
      error: userError,
    } = await auth.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const body = (await request.json()) as { ids?: string[] };
    const ids = Array.isArray(body?.ids) ? body.ids.filter(Boolean) : [];
    if (ids.length === 0) {
      return NextResponse.json({ error: "请提供要删除的会话 id 列表" }, { status: 400 });
    }
    const admin = createSupabaseAdmin();
    const { data, error } = await admin
      .from("chat_sessions")
      .delete()
      .eq("user_id", user.id)
      .in("id", ids)
      .select("id");
    if (error) throw error;
    const deleted = data?.length ?? 0;
    return NextResponse.json(
      { deleted },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除会话失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
