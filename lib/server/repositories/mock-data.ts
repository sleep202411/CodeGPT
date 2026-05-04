export type RecentSessionRecord = {
  id: string;
  title: string;
  updatedAt: string;
};

export type UserProfileRecord = {
  userName: string;
  userRole: string;
  userEmail: string;
};

export type UploadRecord = {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  category: "media" | "image" | "document" | "other";
  createdAt: string;
  /** 代码文件全文或图片 OCR 文本（截断后） */
  extractedText?: string;
};

const recentSessionsSeed: RecentSessionRecord[] = [
  { id: "session-1", title: "Next.js 路由守卫怎么写更稳", updatedAt: new Date().toISOString() },
  { id: "session-2", title: "RAG 检索召回率低怎么优化", updatedAt: new Date().toISOString() },
  { id: "session-3", title: "Supabase 向量检索 SQL 调优建议", updatedAt: new Date().toISOString() },
  { id: "session-4", title: "CodeGPT 上传接口返回 500 排查", updatedAt: new Date().toISOString() },
  { id: "session-5", title: "个人中心接口字段如何设计", updatedAt: new Date().toISOString() },
  { id: "session-6", title: "会话列表重命名与删除接口联调", updatedAt: new Date().toISOString() },
  { id: "session-7", title: "聊天输入框样式优化", updatedAt: new Date().toISOString() },
  { id: "session-8", title: "最近对话批量操作交互优化", updatedAt: new Date().toISOString() },
  { id: "session-9", title: "OpenAI embedding 成本怎么降", updatedAt: new Date().toISOString() },
  { id: "session-10", title: "TypeScript 严格模式报错修复", updatedAt: new Date().toISOString() },
  { id: "session-11", title: "pnpm 与 npm 锁文件如何统一", updatedAt: new Date().toISOString() },
  { id: "session-12", title: "Markdown 代码块高亮渲染异常", updatedAt: new Date().toISOString() },
  { id: "session-13", title: "API 鉴权中间件与登录态衔接", updatedAt: new Date().toISOString() },
  { id: "session-14", title: "聊天消息持久化表结构设计", updatedAt: new Date().toISOString() },
  { id: "session-15", title: "对话历史分页加载最佳实践", updatedAt: new Date().toISOString() },
  { id: "session-16", title: "上传图片 OCR 后再做向量化", updatedAt: new Date().toISOString() },
  { id: "session-17", title: "知识库增量更新如何避免重复", updatedAt: new Date().toISOString() },
  { id: "session-18", title: "检索结果重排与相关性评分", updatedAt: new Date().toISOString() },
  { id: "session-19", title: "Top-K 和阈值参数如何调参", updatedAt: new Date().toISOString() },
  { id: "session-20", title: "流式输出中断后的重试策略", updatedAt: new Date().toISOString() },
  { id: "session-21", title: "多文件上传大小限制与提示文案", updatedAt: new Date().toISOString() },
  { id: "session-22", title: "会话标题自动生成逻辑设计", updatedAt: new Date().toISOString() },
  { id: "session-23", title: "Prompt 模板拆分与版本管理", updatedAt: new Date().toISOString() },
  { id: "session-24", title: "向量索引构建脚本性能优化", updatedAt: new Date().toISOString() },
  { id: "session-25", title: "侧边栏交互细节优化", updatedAt: new Date().toISOString() },
  { id: "session-26", title: "暗黑模式下组件配色变量规范", updatedAt: new Date().toISOString() },
  { id: "session-27", title: "个人中心资料编辑接口设计", updatedAt: new Date().toISOString() },
  { id: "session-28", title: "错误码体系与前端提示统一", updatedAt: new Date().toISOString() },
  { id: "session-29", title: "生产环境日志采集与排错流程", updatedAt: new Date().toISOString() },
  { id: "session-30", title: "RAG 回答来源标注格式优化", updatedAt: new Date().toISOString() },
];

const userProfileSeed: UserProfileRecord = {
  userName: "admin",
  userRole: "管理员",
  userEmail: "admin@codegpt.local",
};

const uploadsSeed: UploadRecord[] = [];

export async function listRecentSessions(): Promise<RecentSessionRecord[]> {
  return [...recentSessionsSeed];
}

export async function searchRecentSessions(keyword?: string): Promise<RecentSessionRecord[]> {
  const q = keyword?.trim().toLowerCase();
  if (!q) return listRecentSessions();
  return recentSessionsSeed.filter((item) => item.title.toLowerCase().includes(q));
}

export async function renameSession(id: string, title: string): Promise<RecentSessionRecord> {
  const trimmed = title.trim();
  if (!trimmed) {
    throw new Error("会话名称不能为空");
  }
  const item = recentSessionsSeed.find((session) => session.id === id);
  if (!item) {
    throw new Error("会话不存在");
  }
  item.title = trimmed;
  item.updatedAt = new Date().toISOString();
  return item;
}

export async function deleteSessions(ids: string[]): Promise<number> {
  if (!Array.isArray(ids) || ids.length === 0) return 0;
  const idSet = new Set(ids);
  const before = recentSessionsSeed.length;
  for (let i = recentSessionsSeed.length - 1; i >= 0; i -= 1) {
    if (idSet.has(recentSessionsSeed[i].id)) {
      recentSessionsSeed.splice(i, 1);
    }
  }
  return before - recentSessionsSeed.length;
}

export async function getProfile(): Promise<UserProfileRecord> {
  return userProfileSeed;
}

export async function createUploadRecord(input: {
  name: string;
  size: number;
  mimeType: string;
  extractedText?: string;
}): Promise<UploadRecord> {
  const category = resolveCategory(input.mimeType);
  const record: UploadRecord = {
    id: `upload_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: input.name,
    size: input.size,
    mimeType: input.mimeType,
    category,
    createdAt: new Date().toISOString(),
    ...(input.extractedText !== undefined ? { extractedText: input.extractedText } : {}),
  };
  uploadsSeed.unshift(record);
  return record;
}

function resolveCategory(mimeType: string): UploadRecord["category"] {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/") || mimeType.startsWith("video/")) return "media";
  if (
    mimeType.includes("pdf") ||
    mimeType.includes("msword") ||
    mimeType.includes("officedocument") ||
    mimeType.includes("text/")
  ) {
    return "document";
  }
  return "other";
}
