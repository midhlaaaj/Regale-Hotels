import { defineStore } from "pinia";

export type Role = "super_admin" | "property_manager";

interface AuthState {
  token: string | null;
  role: Role | null;
  propertyId: number | null;
  name: string | null;
}

const STORAGE_KEY = "regale_admin_auth";

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({ token: null, role: null, propertyId: null, name: null }),
  getters: {
    isSuperAdmin: (s) => s.role === "super_admin",
    isLoggedIn: (s) => !!s.token,
  },
  actions: {
    setSession(session: { access_token: string; role: Role; property_id: number | null; name: string }) {
      this.token = session.access_token;
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
    logout() {
      this.$reset();
      if (import.meta.client) localStorage.removeItem(STORAGE_KEY);
    },
  },
});
