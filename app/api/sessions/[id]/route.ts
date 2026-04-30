import { NextResponse } from "next/server";
import { renameSession } from "@/lib/server/repositories/mock-data";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { title?: string };
    const title = body?.title ?? "";
    const session = await renameSession(id, title);
    return NextResponse.json(
      { session },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "重命名会话失败";
    const status = message.includes("不存在") || message.includes("不能为空") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
