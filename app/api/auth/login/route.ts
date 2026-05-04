import { NextResponse } from "next/server";

import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function toLoginErrorMessage(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login credentials")) {
    return "邮箱或密码错误";
  }
  if (normalized.includes("email not confirmed")) {
    return "邮箱未验证，请先完成邮箱验证";
  }
  if (normalized.includes("too many requests")) {
    return "操作过于频繁，请稍后再试";
  }
  return "登录失败";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim();
    const password = body.password;
    if (!email || !password) {
      return NextResponse.json({ error: "请填写邮箱和密码" }, { status: 400 });
    }

    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return NextResponse.json({ error: toLoginErrorMessage(error.message) }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "登录失败" }, { status: 500 });
  }
}
