import { NextResponse } from "next/server";
import { searchRecentSessions } from "@/lib/server/repositories/mock-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword") ?? "";
    const sessions = await searchRecentSessions(keyword);
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
