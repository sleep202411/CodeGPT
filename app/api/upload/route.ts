import { NextResponse } from "next/server";
import { createUploadRecord } from "@/lib/server/repositories/mock-data";

const MEDIA_LIMIT = 50 * 1024 * 1024;
const IMAGE_LIMIT = 30 * 1024 * 1024;
const DOC_LIMIT = 100 * 1024 * 1024;

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "缺少上传文件" }, { status: 400 });
    }

    const maxSize = resolveSizeLimit(file.type);
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `文件超过大小限制，当前上限 ${Math.floor(maxSize / (1024 * 1024))}MB` },
        { status: 400 }
      );
    }

    const upload = await createUploadRecord({
      name: file.name,
      size: file.size,
      mimeType: file.type || "application/octet-stream",
    });

    return NextResponse.json(
      { upload },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "上传失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function resolveSizeLimit(mimeType: string): number {
  if (mimeType.startsWith("audio/") || mimeType.startsWith("video/")) return MEDIA_LIMIT;
  if (mimeType.startsWith("image/")) return IMAGE_LIMIT;
  return DOC_LIMIT;
}
