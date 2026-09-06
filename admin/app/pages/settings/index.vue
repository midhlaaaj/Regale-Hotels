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

// ---------- About page content ----------
interface AboutValue {
  title: string;
  body: string;
}
interface AboutContent {
  headline?: string;
  intro?: string;
  story?: string;
  values?: AboutValue[];
}

// Mirrors the guest site's fallback copy (frontend/app/pages/about.vue) so the
// form starts pre-filled with what's actually showing, not a blank page.
const ABOUT_DEFAULTS: Required<AboutContent> = {
  headline: "Four houses, one ledger",
  intro:
    "Regale began with a single restoration — a spice merchant's home on Lake Vembanad, saved from demolition and reopened as a nine-room house. What we learned there, about patience with old buildings and about letting a place keep its own character, shaped every property since.",
  story:
    "Each of our four houses is restored rather than built, staffed by people from the town it sits in, and run with the same conviction: a hotel should feel like being let into somewhere real, not checked into somewhere generic.",
  values: [
    {
      title: "Restoration, not construction",
      body: "Every Regale property was a building before it was a hotel. We keep the walls, the floors, and the stories, and add only what a guest genuinely needs.",
    },
    {
      title: "Local, always",
      body: "Every host lives in the town the house sits in. There's no regional manager between you and the person who greets you at the door.",
    },
    {
      title: "Direct, on principle",
      body: "We'd rather answer your questions ourselves — on WhatsApp, at the price we actually charge — than have an aggregator stand between us.",
    },
  ],
};

const about = ref<Required<AboutContent>>(structuredClone(ABOUT_DEFAULTS));
const aboutMsg = ref("");
const savingAbout = ref(false);

const { data: fetchedAbout, pending: aboutPending } = useAsyncData<AboutContent>(
  "settings-about",
  () => request<AboutContent>("/api/content/about"),
  { lazy: true }
);
watch(
  fetchedAbout,
  (data) => {
    if (!data) return;
    about.value = {
      headline: data.headline || ABOUT_DEFAULTS.headline,
      intro: data.intro || ABOUT_DEFAULTS.intro,
      story: data.story || ABOUT_DEFAULTS.story,
      values: data.values?.length ? data.values : structuredClone(ABOUT_DEFAULTS.values),
    };
  },
  { immediate: true }
);

function addValue() {
  if (about.value.values.length >= 6) return;
  about.value.values.push({ title: "", body: "" });
}
function removeValue(i: number) {
  about.value.values.splice(i, 1);
}

async function saveAbout() {
  aboutMsg.value = "";
  const a = about.value;
  if (!a.headline.trim() || !a.intro.trim() || !a.story.trim()) {
    aboutMsg.value = "Headline, intro, and story can't be blank.";
    return;
  }
  if (a.values.some((v) => !v.title.trim() || !v.body.trim())) {
    aboutMsg.value = "Every value needs both a title and a body (or remove it).";
    return;
  }
  savingAbout.value = true;
  try {
    await request("/api/admin/content/about", {
      method: "POST",
      body: {
        headline: a.headline.trim(),
        intro: a.intro.trim(),
        story: a.story.trim(),
        values: a.values.map((v) => ({ title: v.title.trim(), body: v.body.trim() })),
      },
    });
    aboutMsg.value = "Saved.";
  } catch (e: any) {
    aboutMsg.value = extractErrorMessage(e, "Could not save changes.");
  } finally {
    savingAbout.value = false;
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

    <section class="mb-10">
      <h2 class="font-label-ledger text-xs tracking-[0.1em] uppercase text-outline mb-3">About page content</h2>
      <div class="border border-outline/20 bg-white p-6 max-w-[720px]">
        <div v-if="aboutPending" class="flex flex-col gap-3">
          <Skeleton class="h-9 w-full" />
          <Skeleton class="h-20 w-full" />
          <Skeleton class="h-20 w-full" />
        </div>
        <div v-else class="flex flex-col gap-5">
          <div class="flex flex-col gap-1.5">
            <label class="font-label-ledger text-[11px] uppercase text-outline">Headline</label>
            <input v-model="about.headline" maxlength="200" class="border-b border-secondary bg-transparent py-2" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="font-label-ledger text-[11px] uppercase text-outline">Intro paragraph</label>
            <textarea v-model="about.intro" rows="3" maxlength="1500" class="border-b border-secondary bg-transparent py-2 resize-y" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="font-label-ledger text-[11px] uppercase text-outline">Story paragraph</label>
            <textarea v-model="about.story" rows="3" maxlength="1500" class="border-b border-secondary bg-transparent py-2 resize-y" />
          </div>

          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="font-label-ledger text-[11px] uppercase text-outline">Values</label>
              <button
                v-if="about.values.length < 6"
                class="text-xs font-label-ledger uppercase text-secondary border border-outline/25 rounded-sm px-2.5 py-1"
                @click="addValue"
              >
                + Add value
              </button>
            </div>
            <div v-for="(v, i) in about.values" :key="i" class="border border-outline/15 p-4 mb-3 flex flex-col gap-2">
              <div class="flex gap-2 items-center">
                <input v-model="v.title" placeholder="Title" maxlength="100" class="border-b border-secondary bg-transparent py-1.5 flex-1" />
                <button class="text-xs font-label-ledger uppercase text-error border border-error/40 rounded-sm px-2 py-1" @click="removeValue(i)">
                  Remove
                </button>
              </div>
              <textarea v-model="v.body" placeholder="Body" rows="2" maxlength="500" class="border-b border-secondary bg-transparent py-1.5 resize-y" />
            </div>
          </div>

          <div>
            <button
              :disabled="savingAbout"
              class="bg-primary text-white border-none cursor-pointer px-5 py-2.5 rounded-sm font-label-ledger text-xs uppercase disabled:opacity-50"
              @click="saveAbout"
            >
              {{ savingAbout ? "Saving…" : "Save about page" }}
            </button>
            <p v-if="aboutMsg" class="text-sm mt-3">{{ aboutMsg }}</p>
          </div>
        </div>
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
