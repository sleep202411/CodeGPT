import { createServerSupabase } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/server/supabase-admin";

export const dynamic = "force-dynamic";

const KEYWORD_MAX_LEN = 128;
const SESSION_LIMIT = 50;

type SessionRow = { id: string; title?: string; updated_at?: string };

export async function GET(request: Request) {
  try {
    const auth = await createServerSupabase();
    const {
      data: { user },
      error: userError,
    } = await auth.auth.getUser();
    if (userError || !user) {
      return Response.json({ error: "未登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keyword = (searchParams.get("keyword") ?? "").trim().slice(0, KEYWORD_MAX_LEN);
    const admin = createSupabaseAdmin();

    let query = admin
      .from("chat_sessions")
      .select("id, title, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(SESSION_LIMIT);

    if (keyword) {
      query = query.ilike("title", `%${keyword}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data ?? []) as SessionRow[];
    const sessions = rows.map((item) => ({
      id: item.id as string,
      title: (item.title as string) ?? "新对话",
      updatedAt: item.updated_at as string,
    }));

    return Response.json(
      { sessions },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取最近会话失败";
    return Response.json({ error: message }, { status: 500 });
  }
}
