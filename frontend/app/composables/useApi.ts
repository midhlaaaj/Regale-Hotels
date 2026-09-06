function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function useApi() {
  const config = useRuntimeConfig();

  async function request<T>(path: string, opts: Parameters<typeof $fetch>[1] = {}): Promise<T> {
    const method = (opts?.method ?? "GET").toString().toUpperCase();
    const headers: Record<string, string> = { ...(opts?.headers as Record<string, string> | undefined) };
    if (!SAFE_METHODS.has(method)) {
      const csrf = readCookie("guest_csrf");
      if (csrf) headers["X-CSRF-Token"] = csrf;
    }
    try {
      return await $fetch<T>(path, {
        baseURL: config.public.apiBase as string,
        credentials: "include",
        ...opts,
        headers,
      });
    } catch (e: any) {
      // A guest-authenticated call whose session has expired/been revoked —
      // clear the cached profile so the UI stops assuming we're logged in.
      // Not done for /api/auth/login|signup, where a 401 just means "wrong
      // password", not "your session died".
      if (e?.response?.status === 401 && import.meta.client && !path.startsWith("/api/auth/login") && !path.startsWith("/api/auth/signup")) {
        useGuestAuthStore().clear();
      }
      throw e;
    }
  }

  return { request };
}
