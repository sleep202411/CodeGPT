import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/server/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await createServerSupabase();
    const {
      data: { user },
      error: userError,
    } = await auth.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const keyword = (searchParams.get("keyword") ?? "").trim();
    const admin = createSupabaseAdmin();
    let query = admin
      .from("chat_sessions")
      .select("id, title, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50);
    if (keyword) {
      query = query.ilike("title", `%${keyword}%`);
    }
    const { data, error } = await query;
    if (error) throw error;
    const sessions = (data ?? []).map((item) => ({
      id: item.id as string,
      title: (item.title as string) ?? "新对话",
      updatedAt: item.updated_at as string,
    }));
    return NextResponse.json(
      { sessions },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取最近会话失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
