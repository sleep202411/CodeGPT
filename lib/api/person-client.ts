import type { UserProfile } from "@/lib/types/profile";

export const PERSON_PROFILE_API = "/api/person/profile";

export type FetchUserProfileResult =
  | { status: "success"; profile: UserProfile | null }
  | { status: "error"; message: string }
  | { status: "aborted" };

export async function fetchUserProfile(signal?: AbortSignal): Promise<FetchUserProfileResult> {
  try {
    const response = await fetch(PERSON_PROFILE_API, {
      method: "GET",
      cache: "no-store",
      signal,
    });
    if (response.status === 404) {
      return { status: "success", profile: null };
    }
    if (!response.ok) {
      return { status: "error", message: `个人信息获取失败 (${response.status})` };
    }
    const data = (await response.json()) as { profile?: UserProfile };
    return { status: "success", profile: data.profile ?? null };
  } catch (err) {
    if (signal?.aborted) return { status: "aborted" };
    if (err instanceof DOMException && err.name === "AbortError") {
      return { status: "aborted" };
    }
    return {
      status: "error",
      message: err instanceof Error ? err.message : "个人信息获取失败",
    };
  }
}

export async function updateUserProfileName(
  userName: string
): Promise<{ ok: true; profile: UserProfile } | { ok: false; error: string }> {
  const res = await fetch(PERSON_PROFILE_API, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userName }),
  });
  const data = (await res.json()) as { error?: string; profile?: UserProfile };
  if (!res.ok) {
    return { ok: false, error: data.error || "保存失败" };
  }
  if (!data.profile) {
    return { ok: false, error: "保存失败" };
  }
  return { ok: true, profile: data.profile };
}
