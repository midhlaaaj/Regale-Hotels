<script setup lang="ts">
definePageMeta({ superAdminOnly: true });

import type { Property } from "~/types/api";

interface Testimonial {
  id: number;
  guest_name: string;
  guest_location: string;
  quote: string;
  approved: boolean;
}

const { request } = useApi();
const { data: properties } = useAsyncData<Property[]>(
  "settings-properties",
  () => request<Property[]>("/api/properties"),
  { lazy: true }
);
const { data: testimonials, pending: testimonialsPending, refresh: refreshTestimonials } = useAsyncData<Testimonial[]>(
  "settings-testimonials",
  () => request<Testimonial[]>("/api/admin/testimonials"),
  { lazy: true }
);
const pendingTestimonials = computed(() => testimonials.value?.filter((t) => !t.approved) ?? []);

async function approve(id: number) {
  await request(`/api/admin/testimonials/${id}/approve`, { method: "POST" });
  await refreshTestimonials();
}

const newUser = ref({ name: "", email: "", password: "", role: "property_manager" as "property_manager" | "super_admin", property_id: null as number | null });
const userMsg = ref("");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function extractErrorMessage(e: any, fallback: string): string {
  const detail = e?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length) return detail.map((d: any) => d.msg).join(" ");
  return fallback;
}

async function createUser() {
  userMsg.value = "";
  const u = newUser.value;
  if (!u.name.trim()) return (userMsg.value = "Name is required.");
  if (!EMAIL_RE.test(u.email.trim())) return (userMsg.value = "Enter a valid email address.");
  if (u.password.length < 8) return (userMsg.value = "Password must be at least 8 characters.");
  if (u.role === "property_manager" && u.property_id == null) return (userMsg.value = "Assign a property for this manager.");

  try {
    await request("/api/admin/users", {
      method: "POST",
      body: { ...u, name: u.name.trim(), email: u.email.trim() },
    });
    userMsg.value = "Account created.";
    newUser.value = { name: "", email: "", password: "", role: "property_manager", property_id: null };
  } catch (e: any) {
    userMsg.value = extractErrorMessage(e, "Could not create account.");
  }
}
</script>

<template>
  <div>
    <h1 class="font-display-lg text-headline-md text-on-background mb-8">Settings</h1>

    <section class="mb-10">
      <h2 class="font-label-ledger text-xs tracking-[0.1em] uppercase text-outline mb-3">Create staff account</h2>
      <div class="border border-outline/20 bg-white p-6 max-w-[520px]">
        <div class="grid gap-4 sm:grid-cols-2 mb-4">
          <input v-model="newUser.name" placeholder="Full name" maxlength="120" class="border-b border-secondary bg-transparent py-2" />
          <input v-model="newUser.email" type="email" placeholder="Email" maxlength="254" class="border-b border-secondary bg-transparent py-2" />
          <input
            v-model="newUser.password"
            type="password"
            placeholder="Temporary password (min. 8 characters)"
            maxlength="72"
            autocomplete="new-password"
            class="border-b border-secondary bg-transparent py-2"
          />
          <select v-model="newUser.role" class="border-b border-secondary bg-transparent py-2">
            <option value="property_manager">Property manager</option>
            <option value="super_admin">Super admin</option>
          </select>
          <select
            v-if="newUser.role === 'property_manager'"
            v-model.number="newUser.property_id"
            class="border-b border-secondary bg-transparent py-2 sm:col-span-2"
          >
            <option :value="null" disabled>Assign a property</option>
            <option v-for="p in properties" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>
        <button class="bg-primary text-white border-none cursor-pointer px-5 py-2.5 rounded-sm font-label-ledger text-xs uppercase" @click="createUser">
          Create account
        </button>
        <p v-if="userMsg" class="text-sm mt-3">{{ userMsg }}</p>
      </div>
    </section>

    <section>
      <h2 class="font-label-ledger text-xs tracking-[0.1em] uppercase text-outline mb-3">Testimonials awaiting approval</h2>
      <div class="border border-outline/20 bg-white">
        <template v-if="testimonialsPending">
          <div v-for="i in 2" :key="i" class="border-b border-outline/10 last:border-0 px-5 py-4 flex justify-between gap-4 items-start">
            <div class="flex-1">
              <Skeleton class="h-4 w-full mb-2" />
              <Skeleton class="h-3 w-32" />
            </div>
            <Skeleton class="h-8 w-20 flex-shrink-0" />
          </div>
        </template>
        <template v-else>
          <div v-for="t in pendingTestimonials" :key="t.id" class="border-b border-outline/10 last:border-0 px-5 py-4 flex justify-between gap-4 items-start">
            <div>
              <p class="text-sm italic text-on-background mb-1.5">&ldquo;{{ t.quote }}&rdquo;</p>
              <p class="font-label-ledger text-xs text-outline">{{ t.guest_name }} · {{ t.guest_location }}</p>
            </div>
            <button class="bg-secondary text-white border-none cursor-pointer px-3.5 py-2 rounded-sm font-label-ledger text-xs uppercase flex-shrink-0" @click="approve(t.id)">
              Approve
            </button>
          </div>
          <p v-if="pendingTestimonials.length === 0" class="px-5 py-8 text-center text-on-surface-variant">Nothing pending.</p>
        </template>
      </div>
    </section>
  </div>
</template>
