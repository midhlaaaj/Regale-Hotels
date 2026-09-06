export default defineNuxtPlugin(async () => {
  const auth = useAuthStore();
  auth.restore();

  if (!auth.role) return;

  // The cached profile is only a UI convenience — confirm the httpOnly session
  // cookie is still valid server-side, since it may have expired or been
  // revoked (e.g. a deactivated account) since the last visit.
  const { request } = useApi();
  try {
    await request("/api/admin/me");
  } catch {
    auth.clear();
  }
});
