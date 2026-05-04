/** 登录/注册成功后的跳转路径：仅允许站内相对路径。 */
export function getSafePostAuthRedirect(): string {
  if (typeof window === "undefined") return "/";
  const next = new URLSearchParams(window.location.search).get("next");
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return "/";
}
