import { NextResponse } from "next/server";

import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function toRegisterErrorMessage(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes("user already registered")) {
    return "该邮箱已注册，请直接登录";
  }
  if (normalized.includes("password should be at least")) {
    return "密码强度不足，请设置更复杂的密码";
  }
  if (normalized.includes("unable to validate email address")) {
    return "邮箱格式不正确";
  }
  if (normalized.includes("too many requests")) {
    return "操作过于频繁，请稍后再试";
  }
  return "注册失败";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      userName?: string;
    };
    const email = body.email?.trim();
    const password = body.password;
    const userName = body.userName?.trim() || "";

    if (!email || !password) {
      return NextResponse.json({ ok: false, msg: "请填写邮箱和密码" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ ok: false, msg: "密码至少 6 位" }, { status: 400 });
    }

    const supabase = await createServerSupabase();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_name: userName || email.split("@")[0] || "用户",
        },
      },
    });

    if (error) {
      return NextResponse.json({ ok: false, msg: toRegisterErrorMessage(error.message) }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      msg: "注册成功",
    });
  } catch {
    return NextResponse.json({ ok: false, msg: "注册失败" }, { status: 500 });
  }
}
