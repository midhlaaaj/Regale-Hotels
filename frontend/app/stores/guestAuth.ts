import { defineStore } from "pinia";

interface GuestProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface GuestAuthState {
  profile: GuestProfile | null;
}

const STORAGE_KEY = "regale_guest_profile";

export const useGuestAuthStore = defineStore("guestAuth", {
  state: (): GuestAuthState => ({ profile: null }),
  getters: {
    // The JWT itself lives in an httpOnly cookie the JS layer never sees — this
    // is only a UI convenience (avoids a login flash on refresh), not the real
    // auth gate. The backend rejects any request whose cookie is missing or
    // expired, and useApi's caller clears this on a 401.
    isLoggedIn: (s) => !!s.profile,
  },
  actions: {
    setProfile(profile: GuestProfile) {
      this.profile = profile;
      if (import.meta.client) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      }
    },
    restore() {
      if (!import.meta.client) return;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      try {
        this.profile = JSON.parse(raw);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    },
    clear() {
      this.profile = null;
      if (import.meta.client) localStorage.removeItem(STORAGE_KEY);
    },
  },
});
