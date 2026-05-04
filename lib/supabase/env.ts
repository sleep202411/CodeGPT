/** 是否已配置 Supabase（用于 Auth / profiles）；未配置时走旧版 cookie 登录 */
export function isSupabaseAuthConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
