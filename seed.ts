/**
 * 代码知识库向量化脚本（Jina Embedding）
 */
import dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

type CodeChunk = {
  content: string;
  filePath: string;
  language: string;
  startLine: number;
  endLine: number;
};

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;
const JINA_EMBED_MODEL = process.env.JINA_EMBED_MODEL ?? "jina-embeddings-v3";
const EMBEDDING_DIMENSION = 1024;
const WEB_CRAWL_MAX_DEPTH = Number(process.env.WEB_CRAWL_MAX_DEPTH ?? 1);
const WEB_CRAWL_MAX_PAGES = Number(process.env.WEB_CRAWL_MAX_PAGES ?? 40);
const CODE_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json",
  ".md", ".css", ".scss", ".less", ".html", ".yml", ".yaml", ".sql",
]);

dotenv.config({ path: ".env.local" });
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL ?? "", process.env.SUPABASE_KEY ?? "");

function detectLanguage(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    ".ts": "typescript",
    ".tsx": "typescript",
    ".js": "javascript",
    ".jsx": "javascript",
    ".md": "markdown",
    ".sql": "sql",
    ".json": "json",
  };
  return map[ext] ?? (ext.replace(".", "") || "text");
}

function collectCodeFiles(target: string): string[] {
  if (!fs.existsSync(target)) return [];
  const stat = fs.statSync(target);
  if (stat.isFile()) {
    const ext = path.extname(target).toLowerCase();
    return CODE_EXTENSIONS.has(ext) ? [target] : [];
  }
  const result: string[] = [];
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === ".next") continue;
    const full = path.join(target, entry.name);
    if (entry.isDirectory()) result.push(...collectCodeFiles(full));
    else if (entry.isFile() && CODE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) result.push(full);
  }
  return result;
}

function splitIntoChunks(content: string, filePath: string, language: string): CodeChunk[] {
  const chunks: CodeChunk[] = [];
  let start = 0;
  while (start < content.length) {
    const end = Math.min(content.length, start + CHUNK_SIZE);
    const slice = content.slice(start, end);
    const startLine = content.slice(0, start).split("\n").length;
    const endLine = content.slice(0, end).split("\n").length;
    if (slice.trim()) {
      chunks.push({ content: slice, filePath, language, startLine, endLine });
    }
    if (end === content.length) break;
    start = Math.max(end - CHUNK_OVERLAP, start + 1);
  }
  return chunks;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function extractLinks(html: string, baseUrl: string): string[] {
  const links = new Set<string>();
  const anchorRegex = /<a\s+[^>]*href=["']([^"'#]+)["'][^>]*>/gi;
  const base = new URL(baseUrl);
  let match: RegExpExecArray | null;
  while ((match = anchorRegex.exec(html)) !== null) {
    const raw = match[1]?.trim();
    if (!raw) continue;
    if (raw.startsWith("mailto:") || raw.startsWith("javascript:")) continue;
    try {
      const resolved = new URL(raw, base).toString();
      links.add(resolved);
    } catch {
      /* ignore invalid links */
    }
  }
  return Array.from(links);
}

function buildAllowedPrefixes(seeds: string[]): string[] {
  return seeds.map((url) => {
    const u = new URL(url);
    return `${u.origin}${u.pathname.replace(/\/+$/, "")}`;
  });
}

function isAllowedDocUrl(url: string, allowedPrefixes: string[]): boolean {
  return allowedPrefixes.some((prefix) => url.startsWith(prefix));
}

async function loadFromWebpages(urls: string[]) {
    const allChunks: CodeChunk[] = [];
  const allowedPrefixes = buildAllowedPrefixes(urls);
  const queue: Array<{ url: string; depth: number }> = urls.map((url) => ({ url, depth: 0 }));
  const visited = new Set<string>();

  while (queue.length > 0 && visited.size < WEB_CRAWL_MAX_PAGES) {
    const current = queue.shift();
    if (!current) break;
    const normalized = current.url.replace(/#.*$/, "");
    if (visited.has(normalized)) continue;
    if (!isAllowedDocUrl(normalized, allowedPrefixes)) continue;
    visited.add(normalized);
    try {
      console.log(`🌐 抓取文档 [depth=${current.depth}]: ${normalized}`);
      const response = await fetch(normalized, {
        headers: {
          "User-Agent": "CodeGPT-SeedBot/1.0 (+https://github.com/sleep202411/CodeGPT)",
        },
      });
      if (!response.ok) {
        console.warn(`⚠️ 抓取失败 [${normalized}]: ${response.status}`);
        continue;
      }
      const html = await response.text();
      const content = stripHtml(html);
      if (!content) {
        console.warn(`⚠️ 文档为空 [${normalized}]`);
        continue;
      }
      allChunks.push(...splitIntoChunks(content, normalized, "doc"));

      if (current.depth < WEB_CRAWL_MAX_DEPTH) {
        const links = extractLinks(html, normalized);
        for (const link of links) {
          const clean = link.replace(/#.*$/, "");
          if (!visited.has(clean) && isAllowedDocUrl(clean, allowedPrefixes)) {
            queue.push({ url: clean, depth: current.depth + 1 });
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ 抓取异常 [${normalized}]`, error);
    }
  }
  console.log(`ℹ️ 文档抓取完成，共抓取 ${visited.size} 页，产出 ${allChunks.length} 个文档分块`);
  if (allChunks.length > 0) {
    await vectorizeAndStore(allChunks);
  }
}

async function generateEmbedding(content: string): Promise<number[]> {
  const apiKey = process.env.JINA_API_KEY;
  if (!apiKey) throw new Error("JINA_API_KEY 未配置，无法生成向量");
  const response = await fetch(
    "https://api.jina.ai/v1/embeddings",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: JINA_EMBED_MODEL,
        input: [content],
        dimensions: EMBEDDING_DIMENSION,
      }),
    }
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Jina embedding 失败: ${text || response.statusText}`);
  }
  const data = (await response.json()) as { data?: Array<{ embedding?: number[] }> };
  const embedding = data.data?.[0]?.embedding;
  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error("Jina embedding 返回为空");
  }
  if (embedding.length !== EMBEDDING_DIMENSION) {
    throw new Error(`Jina embedding 维度为 ${embedding.length}，与数据库要求的 ${EMBEDDING_DIMENSION} 不一致`);
  }
  return embedding;
}

async function vectorizeAndStore(chunks: CodeChunk[]) {
  console.log(`📦 开始处理 ${chunks.length} 个代码块...`);
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    try {
      const embedding = await generateEmbedding(chunk.content);
      const { error } = await supabase.from("chunks").insert({
        content: chunk.content,
        vector: embedding,
        file_path: chunk.filePath,
        url: chunk.filePath,
        language: chunk.language,
        metadata: { startLine: chunk.startLine, endLine: chunk.endLine },
      });
      if (error) console.error(`❌ 存储失败 [${chunk.filePath}]`, error);
      else if ((i + 1) % 10 === 0) console.log(`✅ 已处理 ${i + 1}/${chunks.length} 个代码块`);
    } catch (error) {
      console.error(`❌ 处理失败 [${chunk.filePath}]`, error);
    }
  }
  console.log(`✨ 完成！共处理 ${chunks.length} 个代码块`);
}

async function loadFromCodeFiles(filePaths: string[]) {
    const allChunks: CodeChunk[] = [];
    for (const filePath of filePaths) {
    const files = collectCodeFiles(filePath);
    for (const file of files) {
      const content = fs.readFileSync(file, "utf8");
      const language = detectLanguage(file);
      allChunks.push(...splitIntoChunks(content, file, language));
    }
  }
    await vectorizeAndStore(allChunks);
}

async function main() {
  console.log("🚀 开始构建代码知识库向量索引...");
  const codePaths: string[] = ["./app", "./components", "./lib"];
  const codeDocUrls: string[] = [
    "https://nextjs.org/docs",
    "https://react.dev/learn",
    "https://www.typescriptlang.org/docs/",
    "https://tailwindcss.com/docs",
    "https://supabase.com/docs",
    "https://vercel.com/docs",
  ];
  if (codePaths.length === 0) {
    console.log("ℹ️ 请在 seed.ts 中配置代码文件路径");
  }
    if (codePaths.length > 0) {
        await loadFromCodeFiles(codePaths);
    }
    if (codeDocUrls.length > 0) {
        await loadFromWebpages(codeDocUrls);
    }
}

main().catch(console.error);
