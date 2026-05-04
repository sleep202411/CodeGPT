import { createClient } from "@supabase/supabase-js";

export function createSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_KEY;
  if (!url || !serviceKey) {
    throw new Error("SUPABASE_URL 或 SUPABASE_KEY 未配置");
  }
  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

