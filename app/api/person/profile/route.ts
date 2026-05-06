import { NextResponse } from "next/server";

import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { data: row, error: profileError } = await supabase
      .from("profiles")
      .select("user_name, user_role, user_email")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    if (!row) {
      const userName =
        (user.user_metadata?.user_name as string | undefined) ||
        user.email?.split("@")[0] ||
        "用户";
      const { error: insertError } = await supabase.from("profiles").insert({
        id: user.id,
        user_name: userName,
        user_email: user.email ?? "",
        user_role: "用户",
      });
      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      return NextResponse.json(
        {
          profile: {
            userName,
            userRole: "用户",
            userEmail: user.email ?? "",
          },
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      {
        profile: {
          userName: row.user_name ?? "",
          userRole: row.user_role ?? "用户",
          userEmail: row.user_email ?? user.email ?? "",
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取个人信息失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { userName?: string };
    const userName = body.userName?.trim();
    if (!userName) {
      return NextResponse.json({ error: "用户名不能为空" }, { status: 400 });
    }

    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ user_name: userName, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const { data: row } = await supabase
      .from("profiles")
      .select("user_name, user_role, user_email")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      profile: {
        userName: row?.user_name ?? userName,
        userRole: row?.user_role ?? "用户",
        userEmail: row?.user_email ?? user.email ?? "",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "更新失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
