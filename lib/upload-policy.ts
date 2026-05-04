/** 仅允许：常见源码/配置扩展名；图片走 OCR（见 /api/upload） */

const CODE_EXTENSIONS = new Set([
  "ts",
  "tsx",
  "mts",
  "cts",
  "js",
  "jsx",
  "mjs",
  "cjs",
  "json",
  "jsonc",
  "yaml",
  "yml",
  "toml",
  "md",
  "mdx",
  "txt",
  "sql",
  "sh",
  "bash",
  "zsh",
  "ps1",
  "py",
  "pyi",
  "rb",
  "php",
  "go",
  "rs",
  "java",
  "kt",
  "kts",
  "swift",
  "c",
  "cc",
  "cpp",
  "cxx",
  "h",
  "hh",
  "hpp",
  "hxx",
  "cs",
  "vue",
  "svelte",
  "html",
  "htm",
  "css",
  "scss",
  "sass",
  "less",
  "xml",
  "gradle",
  "properties",
  "ini",
  "cfg",
  "conf",
  "gitignore",
  "dockerignore",
  "prisma",
  "graphql",
  "gql",
]);

const CODE_BASE_NAMES = new Set([
  "dockerfile",
  "makefile",
  "gemfile",
  "rakefile",
  "jenkinsfile",
  "vagrantfile",
]);

/** 带点号的完整文件名 */
const CODE_DOTFILE_NAMES = new Set([
  ".gitignore",
  ".dockerignore",
  ".env.example",
  ".npmrc",
  ".nvmrc",
  ".editorconfig",
  ".prettierrc",
  ".eslintrc",
  ".eslintignore",
]);

export const IMAGE_MAX_BYTES = 12 * 1024 * 1024;
export const CODE_FILE_MAX_BYTES = 5 * 1024 * 1024;
export const CODE_TEXT_RETURN_MAX_CHARS = 80_000;

/** 单次聊天请求里 attachmentIds 最多条数（含图片与代码文件） */
export const MAX_ATTACHMENTS_PER_MESSAGE = 8;

/**
 * 合并附件后、单条用户消息最大字符数（防止撑爆模型/DB；与前端展示无关）
 */
export const MAX_USER_MESSAGE_CHARS = 120_000;

export const CODE_FILE_ACCEPT_ATTR = Array.from(CODE_EXTENSIONS)
  .map((ext) => `.${ext}`)
  .join(",");

export function getBasename(filename: string): string {
  return filename.split(/[/\\]/).pop() || "";
}

export function isAllowedCodeFilename(filename: string): boolean {
  const base = getBasename(filename).toLowerCase();
  if (!base) return false;
  if (CODE_BASE_NAMES.has(base)) return true;
  if (CODE_DOTFILE_NAMES.has(base)) return true;
  if (base.startsWith(".") && base.length > 1) {
    const rest = base.slice(1);
    if (CODE_EXTENSIONS.has(rest)) return true;
  }
  const dot = base.lastIndexOf(".");
  if (dot <= 0 || dot === base.length - 1) return false;
  const ext = base.slice(dot + 1);
  return CODE_EXTENSIONS.has(ext);
}

export function isAllowedImageMime(mimeType: string): boolean {
  const m = (mimeType || "").toLowerCase();
  if (!m.startsWith("image/")) return false;
  if (m === "image/svg+xml") return false;
  return true;
}

export function looksLikeImageFilename(filename: string): boolean {
  return /\.(png|jpe?g|gif|webp|bmp|avif)$/i.test(getBasename(filename));
}
