export default defineNuxtRouteMiddleware((to) => {
  if (!import.meta.client) return;
  const auth = useAuthStore();
  if (!auth.token) auth.restore();

  if (to.path !== "/login" && !auth.token) {
    return navigateTo("/login");
  }
  if (to.path === "/login" && auth.token) {
    return navigateTo("/");
  }
  // Client-side convenience only — the real enforcement lives server-side
  // (scope_property_id in the FastAPI backend). This just hides the nav path.
  if (to.meta.superAdminOnly && auth.role !== "super_admin") {
    return navigateTo("/");
  }
});
