/**
 * 从图片 Buffer 识别文字（中英）。首次运行会下载语言包，可能较慢。
 */
export async function ocrImageFromBuffer(buffer: Buffer): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("chi_sim+eng");
  try {
    const ret = await worker.recognize(buffer);
    return (ret.data.text || "").trim();
  } finally {
    await worker.terminate();
  }
}
