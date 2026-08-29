export function useApi() {
  const config = useRuntimeConfig();

  function request<T>(path: string, opts: Parameters<typeof $fetch>[1] = {}): Promise<T> {
    return $fetch<T>(path, {
      baseURL: config.public.apiBase as string,
      ...opts,
    });
  }

  return { request };
}
