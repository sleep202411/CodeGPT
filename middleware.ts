import { NextResponse, type NextRequest } from "next/server";

import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { updateSession } from "@/lib/supabase/middleware";

const LOGIN_PATH = "/login";
const REGISTER_PATH = "/register";
const AUTH_COOKIE = "codegpt_auth";
const AUTH_USER = "admin";

export async function middleware(request: NextRequest) {
  if (isSupabaseAuthConfigured()) {
    return updateSession(request);
  }

  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const isPublicAuthRoute =
    pathname === LOGIN_PATH ||
    pathname.startsWith(`${LOGIN_PATH}/`) ||
    pathname === REGISTER_PATH ||
    pathname.startsWith(`${REGISTER_PATH}/`);
  const isAuthenticated = token === AUTH_USER;

  if (!isAuthenticated && !isPublicAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (
    isAuthenticated &&
    (pathname === LOGIN_PATH ||
      pathname.startsWith(`${LOGIN_PATH}/`) ||
      pathname === REGISTER_PATH)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.delete("next");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
