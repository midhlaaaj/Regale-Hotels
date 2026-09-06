export default defineNuxtRouteMiddleware((to) => {
  if (!to.path.startsWith("/admin")) return;
  if (!import.meta.client) return;

  const adminAuth = useAdminAuthStore();
  if (!adminAuth.role) adminAuth.restore();

  if (to.path !== "/admin/login" && !adminAuth.role) {
    return navigateTo("/admin/login");
  }
  if (to.path === "/admin/login" && adminAuth.role) {
    return navigateTo("/admin");
  }
  // Client-side convenience only — the real enforcement lives server-side
  // (scope_property_id in the FastAPI backend). This just hides the nav path.
  if (to.meta.superAdminOnly && adminAuth.role !== "super_admin") {
    return navigateTo("/admin");
  }
});
