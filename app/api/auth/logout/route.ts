import { NextResponse } from "next/server";

import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = await createServerSupabase();
    await supabase.auth.signOut();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "登出失败" }, { status: 500 });
  }
}
