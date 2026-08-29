export function useApi() {
  const config = useRuntimeConfig();
  const auth = useAuthStore();

  function request<T>(path: string, opts: Parameters<typeof $fetch>[1] = {}): Promise<T> {
    return $fetch<T>(path, {
      baseURL: config.public.apiBase as string,
      headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : undefined,
      ...opts,
    });
  }

  return { request };
}
