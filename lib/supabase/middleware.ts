import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isSupabaseAuthConfigured } from "./env";

const LOGIN_PATH = "/login";
const REGISTER_PATH = "/register";
const ADMIN_PATH = "/admin";
const ADMIN_ROLE = "管理员";

/**
 * Refreshes Auth session + enforces: 未登录 → /login，已登录访问 /login → /
 */
export async function updateSession(request: NextRequest) {
  if (!isSupabaseAuthConfigured()) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublicAuth =
    path === LOGIN_PATH ||
    path.startsWith(`${LOGIN_PATH}/`) ||
    path === REGISTER_PATH ||
    path.startsWith(`${REGISTER_PATH}/`);

  if (!user && !isPublicAuth) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user && (path === LOGIN_PATH || path.startsWith(`${LOGIN_PATH}/`) || path === REGISTER_PATH)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.delete("next");
    return NextResponse.redirect(url);
  }

  if (user && (path === ADMIN_PATH || path.startsWith(`${ADMIN_PATH}/`))) {
    const { data: me } = await supabase
      .from("profiles")
      .select("user_role")
      .eq("id", user.id)
      .maybeSingle();
    if ((me?.user_role ?? "") !== ADMIN_ROLE) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
