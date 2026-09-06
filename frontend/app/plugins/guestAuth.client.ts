export default defineNuxtPlugin(async () => {
  const guestAuth = useGuestAuthStore();
  guestAuth.restore();

  if (!guestAuth.profile) return;

  // The cached profile is only a UI convenience — confirm the httpOnly session
  // cookie is still valid server-side, since it may have expired since the
  // last visit.
  const { request } = useApi();
  try {
    const profile = await request<{ id: number; name: string; email: string; phone: string }>("/api/auth/me");
    guestAuth.setProfile(profile);
  } catch {
    guestAuth.clear();
  }
});
