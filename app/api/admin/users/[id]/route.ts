import { createSupabaseAdmin } from "@/lib/server/supabase-admin";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ADMIN_ROLE = "管理员";
const MAX_USER_NAME_LEN = 48;

/** 若非管理员或未登录返回错误 Response；否则返回 null */
async function requireAdmin(): Promise<Response | null> {
  const auth = await createServerSupabase();
  const {
    data: { user },
    error: userError,
  } = await auth.auth.getUser();

  if (userError || !user) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  const { data: me } = await auth.from("profiles").select("user_role").eq("id", user.id).maybeSingle();
  if ((me?.user_role ?? "") !== ADMIN_ROLE) {
    return Response.json({ error: "无权限访问管理员接口" }, { status: 403 });
  }

  return null;
}

type UserRow = {
  id: string;
  user_name: string | null;
  user_role: string | null;
  user_email: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function mapRow(row: UserRow) {
  return {
    id: row.id,
    userName: row.user_name ?? "",
    userRole: row.user_role ?? "用户",
    userEmail: row.user_email ?? "",
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? "",
  };
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: targetId } = await context.params;
    const id = typeof targetId === "string" ? targetId.trim() : "";
    if (!id) {
      return Response.json({ error: "缺少用户 id" }, { status: 400 });
    }

    const body = (await req.json()) as { userName?: unknown; userRole?: unknown };
    if (body.userRole !== undefined) {
      return Response.json({ error: "不允许修改用户角色" }, { status: 400 });
    }

    let nextName: string | undefined;
    if (body.userName !== undefined) {
      if (typeof body.userName !== "string") {
        return Response.json({ error: "userName 必须为字符串" }, { status: 400 });
      }
      const trimmed = body.userName.trim();
      if (!trimmed) {
        return Response.json({ error: "用户名不能为空" }, { status: 400 });
      }
      if (trimmed.length > MAX_USER_NAME_LEN) {
        return Response.json(
          { error: `用户名不能超过 ${MAX_USER_NAME_LEN} 个字符` },
          { status: 400 }
        );
      }
      nextName = trimmed;
    }

    if (nextName === undefined) {
      return Response.json({ error: "请提供 userName" }, { status: 400 });
    }

    const denied = await requireAdmin();
    if (denied) return denied;

    const admin = createSupabaseAdmin();
    const { data, error } = await admin
      .from("profiles")
      .update({
        ...(nextName !== undefined ? { user_name: nextName } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id, user_name, user_role, user_email, created_at, updated_at")
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return Response.json({ error: "用户不存在" }, { status: 404 });
    }

    return Response.json(
      { user: mapRow(data as UserRow) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "更新用户失败";
    return Response.json({ error: message }, { status: 500 });
  }
}
