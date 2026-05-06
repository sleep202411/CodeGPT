import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/server/supabase-admin";
import { ocrImageFromBuffer } from "@/lib/server/ocr-image";
import {
  CODE_FILE_MAX_BYTES,
  CODE_TEXT_RETURN_MAX_CHARS,
  IMAGE_MAX_BYTES,
  isAllowedCodeFilename,
  isAllowedImageMime,
  looksLikeImageFilename,
} from "@/lib/upload-policy";

function fmtMb(bytes: number) {
  return `${Math.floor(bytes / (1024 * 1024))}MB`;
}

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const auth = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await auth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "请先登录后再上传" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "缺少上传文件" }, { status: 400 });
    }

    if (file.size <= 0) {
      return NextResponse.json({ error: "不能上传空文件" }, { status: 400 });
    }

    const name = file.name || "file";

    const mimeImage = Boolean(file.type && isAllowedImageMime(file.type));
    const inferredImage =
      !file.type && looksLikeImageFilename(name) && !isAllowedCodeFilename(name);
    const treatAsImage = mimeImage || inferredImage;

    if (treatAsImage) {
      if (file.size > IMAGE_MAX_BYTES) {
        return NextResponse.json(
          {
            error: `图片体积超过上限（当前单张不超过 ${fmtMb(IMAGE_MAX_BYTES)}，本文件约 ${fmtMb(file.size)}）`,
            code: "FILE_TOO_LARGE",
            limitBytes: IMAGE_MAX_BYTES,
          },
          { status: 413 }
        );
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      let extractedText: string;
      try {
        extractedText = await ocrImageFromBuffer(buffer);
      } catch {
        return NextResponse.json({ error: "图片文字识别失败，请换一张更清晰的截图重试" }, { status: 422 });
      }
      if (!extractedText.trim()) {
        return NextResponse.json({ error: "未识别到文字，请上传含清晰文字的截图" }, { status: 422 });
      }
      const capped = extractedText.slice(0, CODE_TEXT_RETURN_MAX_CHARS);
      return await persistAndRespond(user.id, name, file.size, file.type || "image/png", "ocr_image", capped);
    }

    if (!isAllowedCodeFilename(name)) {
      return NextResponse.json(
        { error: "仅支持常见代码/配置文件，或含文字的图片截图（OCR）。音视频、Office、PDF 等暂不支持。" },
        { status: 400 }
      );
    }

    if (file.size > CODE_FILE_MAX_BYTES) {
      return NextResponse.json(
        {
          error: `代码/配置文件体积超过上限（单文件不超过 ${fmtMb(CODE_FILE_MAX_BYTES)}，本文件约 ${fmtMb(file.size)}）`,
          code: "FILE_TOO_LARGE",
          limitBytes: CODE_FILE_MAX_BYTES,
        },
        { status: 413 }
      );
    }

    let text: string;
    try {
      text = await file.text();
    } catch {
      return NextResponse.json({ error: "无法将该文件作为文本读取，请确认是源码/配置文件" }, { status: 400 });
    }

    const capped = text.slice(0, CODE_TEXT_RETURN_MAX_CHARS);
    return await persistAndRespond(user.id, name, file.size, file.type || "text/plain", "code", capped);
  } catch (error) {
    const message = error instanceof Error ? error.message : "上传失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function persistAndRespond(
  userId: string,
  name: string,
  size: number,
  mimeType: string,
  kind: "code" | "ocr_image",
  extractedText: string
) {
  const admin = createSupabaseAdmin();
  const { data: row, error } = await admin
    .from("chat_attachments")
    .insert({
      user_id: userId,
      file_name: name,
      mime_type: mimeType,
      size_bytes: size,
      kind,
      extracted_text: extractedText,
    })
    .select("id")
    .single();

  if (error || !row) {
    throw error ?? new Error("附件写入失败");
  }

  const fileId = row.id as string;
  const upload = {
    id: fileId,
    name,
    size,
    mimeType,
    category: kind === "ocr_image" ? ("image" as const) : ("document" as const),
    createdAt: new Date().toISOString(),
    extractedText,
  };

  return NextResponse.json(
    { fileId, upload, extractedText },
    { headers: { "Cache-Control": "no-store" } }
  );
}
