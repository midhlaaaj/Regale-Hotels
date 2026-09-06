import { defineStore } from "pinia";

export type Role = "super_admin" | "property_manager";

interface AdminAuthState {
  role: Role | null;
  propertyId: number | null;
  name: string | null;
}

const STORAGE_KEY = "regale_admin_profile";

export const useAdminAuthStore = defineStore("adminAuth", {
  state: (): AdminAuthState => ({ role: null, propertyId: null, name: null }),
  getters: {
    isSuperAdmin: (s) => s.role === "super_admin",
    // The JWT itself lives in an httpOnly cookie the JS layer never sees — this
    // flag is only a UI convenience (avoids a login-page flash on refresh) and
    // is not the real auth gate. The backend rejects any request whose cookie
    // is missing or expired, and the 401 interceptor in useAdminApi clears this.
    isLoggedIn: (s) => !!s.role,
  },
  actions: {
    setSession(session: { role: Role; property_id: number | null; name: string }) {
      this.role = session.role;
      this.propertyId = session.property_id;
      this.name = session.name;
      if (import.meta.client) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.$state));
      }
    },
    restore() {
      if (!import.meta.client) return;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      try {
        Object.assign(this, JSON.parse(raw));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    },
    clear() {
      this.$reset();
      if (import.meta.client) localStorage.removeItem(STORAGE_KEY);
    },
  },
});
