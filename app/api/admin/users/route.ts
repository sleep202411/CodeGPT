import { createSupabaseAdmin } from "@/lib/server/supabase-admin";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ADMIN_ROLE = "管理员";
const MAX_USERS = 500;

type UserRow = {
  id: string;
  user_name: string | null;
  user_role: string | null;
  user_email: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export async function GET() {
  try {
    const auth = await createServerSupabase();
    const {
      data: { user },
      error: userError,
    } = await auth.auth.getUser();

    if (userError || !user) {
      return Response.json({ error: "未登录" }, { status: 401 });
    }

    const { data: me } = await auth
      .from("profiles")
      .select("user_role")
      .eq("id", user.id)
      .maybeSingle();

    if ((me?.user_role ?? "") !== ADMIN_ROLE) {
      return Response.json({ error: "无权限访问管理员接口" }, { status: 403 });
    }

    const admin = createSupabaseAdmin();
    const { data, error } = await admin
      .from("profiles")
      .select("id, user_name, user_role, user_email, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(MAX_USERS);

    if (error) throw error;

    const users = ((data ?? []) as UserRow[]).map((row) => ({
      id: row.id,
      userName: row.user_name ?? "",
      userRole: row.user_role ?? "用户",
      userEmail: row.user_email ?? "",
      createdAt: row.created_at ?? "",
      updatedAt: row.updated_at ?? "",
    }));

    return Response.json(
      { users },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取用户列表失败";
    return Response.json({ error: message }, { status: 500 });
  }
}
