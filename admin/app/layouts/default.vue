<script setup lang="ts">
const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const { request } = useApi();

const navItems = [
  { label: "Dashboard", icon: "dashboard", to: "/", superOnly: false },
  { label: "Bookings", icon: "event", to: "/bookings", superOnly: false },
  { label: "Inquiries", icon: "forum", to: "/inquiries", superOnly: false },
  { label: "Rooms & Rates", icon: "bed", to: "/rooms", superOnly: true },
  { label: "Packages", icon: "card_giftcard", to: "/packages", superOnly: true },
  { label: "Guests", icon: "group", to: "/guests", superOnly: false },
  { label: "Reports", icon: "bar_chart", to: "/reports", superOnly: true },
  { label: "Settings", icon: "settings", to: "/settings", superOnly: true },
];

const visibleNav = computed(() => navItems.filter((n) => !n.superOnly || auth.isSuperAdmin));

async function signOut() {
  try {
    await request("/api/admin/logout", { method: "POST" });
  } finally {
    auth.clear();
    router.push("/login");
  }
}
</script>

<template>
  <div class="min-h-screen flex items-stretch bg-surface">
    <aside class="w-[228px] flex-none bg-surface border-r border-outline/20 py-5 flex flex-col sticky top-0 h-screen">
      <div class="px-5 pb-4 border-b border-outline/15">
        <p class="font-display-lg text-2xl text-primary">Regale</p>
        <p class="font-label-ledger text-[9px] tracking-[0.16em] uppercase mt-1" :class="auth.isSuperAdmin ? 'text-outline' : 'text-secondary'">
          {{ auth.isSuperAdmin ? "Group operations" : "House desk" }}
        </p>
      </div>
      <nav class="flex flex-col px-2 py-3 gap-px flex-1 overflow-y-auto">
        <NuxtLink
          v-for="n in visibleNav"
          :key="n.to"
          :to="n.to"
          class="flex items-center gap-2.5 px-3 py-2.5 rounded-sm font-label-ledger text-[11px] tracking-[0.06em] uppercase border-l-2"
          :class="
            route.path === n.to
              ? 'bg-brass-tint text-ink-green border-primary'
              : 'text-on-surface-variant border-transparent hover:bg-surface-container'
          "
        >
          <span class="material-symbols-outlined text-[17px]">{{ n.icon }}</span>{{ n.label }}
        </NuxtLink>
      </nav>
      <div class="px-5 pt-3.5 border-t border-outline/15">
        <p class="font-label-ledger text-[11px] text-on-background">{{ auth.name }}</p>
        <p class="font-label-ledger text-[9px] tracking-[0.1em] uppercase text-outline mt-1 mb-2.5">
          {{ auth.isSuperAdmin ? "Super Admin" : "Property Manager" }}
        </p>
        <button
          class="bg-transparent border border-outline/30 cursor-pointer px-2.5 py-1.5 rounded-sm font-label-ledger text-[9px] tracking-[0.1em] uppercase text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
          @click="signOut"
        >
          Sign out
        </button>
      </div>
    </aside>

    <div class="flex-1 min-w-0 flex flex-col">
      <header class="bg-surface border-b border-outline/20 px-5 py-2.5 flex flex-wrap gap-3 items-center justify-between sticky top-0 z-40">
        <div class="flex items-center gap-2.5">
          <span v-if="!auth.isSuperAdmin" class="flex items-center gap-2 bg-ink-green text-surface px-3 py-2 rounded-sm">
            <span class="material-symbols-outlined text-[15px]" style="color: #c5a059">place</span>
            <span class="font-label-ledger text-[11px] tracking-[0.08em] uppercase">Your property</span>
          </span>
        </div>
        <span class="font-label-ledger text-[10px] text-outline uppercase">{{ auth.isSuperAdmin ? "All properties" : "" }}</span>
      </header>
      <main class="flex-1 p-5 md:p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
