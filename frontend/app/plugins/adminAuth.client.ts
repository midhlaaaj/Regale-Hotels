export default defineNuxtPlugin(async () => {
  const adminAuth = useAdminAuthStore();
  adminAuth.restore();

  if (!adminAuth.role) return;

  // The cached profile is only a UI convenience — confirm the httpOnly session
  // cookie is still valid server-side, since it may have expired or been
  // revoked (e.g. a deactivated account) since the last visit.
  const { request } = useAdminApi();
  try {
    await request("/api/admin/me");
  } catch {
    adminAuth.clear();
  }
});
