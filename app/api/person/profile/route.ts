import { NextResponse } from "next/server";
import { getProfile } from "@/lib/server/repositories/mock-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const profile = await getProfile();
    return NextResponse.json(
      { profile },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取个人信息失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
