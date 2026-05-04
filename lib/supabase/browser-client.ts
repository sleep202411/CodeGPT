import { createBrowserClient } from "@supabase/ssr";

import { isSupabaseAuthConfigured } from "./env";

type BrowserSupabaseClient = ReturnType<typeof createBrowserClient>;

let client: BrowserSupabaseClient | null = null;

/** Browser Supabase client（cookie session，供中间件识别）；只用 anon key。 */
export function getBrowserSupabase(): BrowserSupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  if (!client) {
    client = createBrowserClient(url, anonKey);
  }
  return client;
}

export { isSupabaseAuthConfigured };
