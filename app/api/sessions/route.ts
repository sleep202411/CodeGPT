import { NextResponse } from "next/server";
import { deleteSessions } from "@/lib/server/repositories/mock-data";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { ids?: string[] };
    const ids = Array.isArray(body?.ids) ? body.ids : [];
    if (ids.length === 0) {
      return NextResponse.json({ error: "请提供要删除的会话 id 列表" }, { status: 400 });
    }
    const deleted = await deleteSessions(ids);
    return NextResponse.json(
      { deleted },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除会话失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
