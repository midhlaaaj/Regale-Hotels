function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function useAdminApi() {
  const config = useRuntimeConfig();
  const adminAuth = useAdminAuthStore();
  const router = useRouter();

  async function request<T>(path: string, opts: Parameters<typeof $fetch>[1] = {}): Promise<T> {
    const method = (opts?.method ?? "GET").toString().toUpperCase();
    const headers: Record<string, string> = { ...(opts?.headers as Record<string, string> | undefined) };
    if (!SAFE_METHODS.has(method)) {
      const csrf = readCookie("admin_csrf");
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
      if (e?.response?.status === 401 && router.currentRoute.value.path !== "/admin/login") {
        adminAuth.clear();
        router.push("/admin/login");
      }
      throw e;
    }
  }

  return { request };
}
