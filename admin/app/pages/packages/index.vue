<script setup lang="ts">
definePageMeta({ superAdminOnly: true });

import type { Property } from "~/types/api";

interface Package {
  id: number;
  property_id: number;
  name: string;
  nights: number;
  description: string;
  price: number;
  meal_plan: string;
  rooms_included: number;
  max_guests: number;
  cover_image_url: string | null;
  active: boolean;
}

const { request } = useApi();
const { data: properties } = useAsyncData<Property[]>("packages-properties", () => request<Property[]>("/api/properties"), {
  lazy: true,
});
const { data: packages, pending, refresh } = useAsyncData<Package[]>(
  "admin-packages",
  () => request<Package[]>("/api/admin/packages"),
  { lazy: true }
);
const propertyName = (id: number) => properties.value?.find((p) => p.id === id)?.name || `#${id}`;

function extractErrorMessage(e: any, fallback: string): string {
  const detail = e?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length) return detail.map((d: any) => d.msg).join(" ");
  return fallback;
}

const showNew = ref(false);
const newPkg = ref({
  property_id: null as number | null,
  name: "",
  nights: 3,
  description: "",
  price: 30000,
  meal_plan: "Breakfast included",
  rooms_included: 1,
  max_guests: 2,
  cover_image_url: "",
});
const newPkgError = ref("");
const saving = ref(false);

function resetForm() {
  newPkg.value = {
    property_id: null,
    name: "",
    nights: 3,
    description: "",
    price: 30000,
    meal_plan: "Breakfast included",
    rooms_included: 1,
    max_guests: 2,
    cover_image_url: "",
  };
  newPkgError.value = "";
}

async function createPackage() {
  newPkgError.value = "";
  const p = newPkg.value;
  if (!p.property_id) return (newPkgError.value = "Choose a property.");
  if (!p.name.trim() || !p.description.trim() || !p.meal_plan.trim()) {
    return (newPkgError.value = "Name, description, and meal plan are required.");
  }
  saving.value = true;
  try {
    await request("/api/admin/packages", {
      method: "POST",
      body: {
        property_id: p.property_id,
        name: p.name.trim(),
        nights: p.nights,
        description: p.description.trim(),
        price: p.price,
        meal_plan: p.meal_plan.trim(),
        rooms_included: p.rooms_included,
        max_guests: p.max_guests,
        cover_image_url: p.cover_image_url.trim() || undefined,
      },
    });
    resetForm();
    showNew.value = false;
    await refresh();
  } catch (e: any) {
    newPkgError.value = extractErrorMessage(e, "Could not create package.");
  } finally {
    saving.value = false;
  }
}

const busyId = ref<number | null>(null);
async function toggleActive(pkg: Package) {
  busyId.value = pkg.id;
  try {
    await request(`/api/admin/packages/${pkg.id}`, { method: "PATCH", body: { active: !pkg.active } });
    await refresh();
  } finally {
    busyId.value = null;
  }
}
async function deletePackage(pkg: Package) {
  if (!confirm(`Delete "${pkg.name}"?`)) return;
  busyId.value = pkg.id;
  try {
    await request(`/api/admin/packages/${pkg.id}`, { method: "DELETE" });
    await refresh();
  } finally {
    busyId.value = null;
  }
}
</script>

<template>
  <div>
    <div class="flex justify-between items-start flex-wrap gap-4 mb-8">
      <div>
        <h1 class="font-display-lg text-headline-md text-on-background mb-1.5">Packages</h1>
        <p class="text-body-md text-on-surface-variant">Multi-night stay bundles shown on the guest site's Packages page.</p>
      </div>
      <button
        class="bg-primary text-white border-none cursor-pointer px-5 py-2.5 rounded-sm font-label-ledger text-xs uppercase flex-shrink-0"
        @click="showNew ? (showNew = false) : (showNew = true)"
      >
        {{ showNew ? "Cancel" : "+ New package" }}
      </button>
    </div>

    <div v-if="showNew" class="border border-outline/20 bg-white p-6 mb-8 max-w-[680px]">
      <div class="grid gap-4 sm:grid-cols-2 mb-4">
        <select v-model.number="newPkg.property_id" class="border-b border-secondary bg-transparent py-2 sm:col-span-2">
          <option :value="null" disabled>Property</option>
          <option v-for="p in properties" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
        <input v-model="newPkg.name" placeholder="Package name" maxlength="150" class="border-b border-secondary bg-transparent py-2" />
        <div class="flex items-center gap-2">
          <label class="font-label-ledger text-[11px] uppercase text-outline flex-shrink-0">Nights</label>
          <input v-model.number="newPkg.nights" type="number" min="1" max="30" class="border-b border-secondary bg-transparent py-2 w-full" />
        </div>
        <input v-model.number="newPkg.price" type="number" min="1" placeholder="Total price" class="border-b border-secondary bg-transparent py-2" />
        <input v-model="newPkg.meal_plan" placeholder="Meal plan (e.g. All meals included)" maxlength="100" class="border-b border-secondary bg-transparent py-2" />
        <div class="flex items-center gap-2">
          <label class="font-label-ledger text-[11px] uppercase text-outline flex-shrink-0">Rooms</label>
          <input v-model.number="newPkg.rooms_included" type="number" min="1" max="20" class="border-b border-secondary bg-transparent py-2 w-full" />
        </div>
        <div class="flex items-center gap-2">
          <label class="font-label-ledger text-[11px] uppercase text-outline flex-shrink-0">Max guests</label>
          <input v-model.number="newPkg.max_guests" type="number" min="1" max="40" class="border-b border-secondary bg-transparent py-2 w-full" />
        </div>
        <input v-model="newPkg.cover_image_url" placeholder="Cover image URL (optional)" class="border-b border-secondary bg-transparent py-2 sm:col-span-2" />
        <textarea
          v-model="newPkg.description"
          placeholder="Description"
          rows="3"
          maxlength="2000"
          class="border-b border-secondary bg-transparent py-2 sm:col-span-2 resize-y"
        />
      </div>
      <button :disabled="saving" class="bg-primary text-white border-none cursor-pointer px-5 py-2.5 rounded-sm font-label-ledger text-xs uppercase disabled:opacity-50" @click="createPackage">
        {{ saving ? "Creating…" : "Create package" }}
      </button>
      <p v-if="newPkgError" class="text-error text-sm mt-3">{{ newPkgError }}</p>
    </div>

    <div class="border border-outline/20 bg-white overflow-x-auto">
      <table class="w-full text-sm min-w-[720px]">
        <thead>
          <tr class="border-b border-outline/20 font-label-ledger text-[11px] uppercase text-outline">
            <th class="px-5 py-3 text-left">Package</th>
            <th class="px-5 py-3 text-left">Property</th>
            <th class="px-5 py-3 text-left">Nights</th>
            <th class="px-5 py-3 text-right">Price</th>
            <th class="px-5 py-3 text-right">Status</th>
            <th class="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody v-if="pending">
          <tr v-for="i in 3" :key="i" class="border-b border-outline/10 last:border-0">
            <td class="px-5 py-3"><Skeleton class="h-4 w-32" /></td>
            <td class="px-5 py-3"><Skeleton class="h-4 w-24" /></td>
            <td class="px-5 py-3"><Skeleton class="h-4 w-8" /></td>
            <td class="px-5 py-3 text-right"><Skeleton class="h-4 w-16 ml-auto" /></td>
            <td class="px-5 py-3 text-right"><Skeleton class="h-5 w-16 ml-auto" /></td>
            <td class="px-5 py-3 text-right"><Skeleton class="h-6 w-20 ml-auto" /></td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr v-for="pkg in packages" :key="pkg.id" class="border-b border-outline/10 last:border-0">
            <td class="px-5 py-3">{{ pkg.name }}</td>
            <td class="px-5 py-3">{{ propertyName(pkg.property_id) }}</td>
            <td class="px-5 py-3">{{ pkg.nights }}</td>
            <td class="px-5 py-3 text-right font-price-display">₹{{ pkg.price.toLocaleString("en-IN") }}</td>
            <td class="px-5 py-3 text-right">
              <span
                class="px-2.5 py-1 rounded-sm font-label-ledger text-[11px] uppercase"
                :class="pkg.active ? 'bg-secondary-container text-ink-green' : 'bg-surface-container-highest text-on-surface-variant'"
                >{{ pkg.active ? "active" : "hidden" }}</span
              >
            </td>
            <td class="px-5 py-3 text-right whitespace-nowrap">
              <button
                :disabled="busyId === pkg.id"
                class="text-xs font-label-ledger uppercase text-secondary border border-outline/25 rounded-sm px-2.5 py-1.5 mr-1.5 disabled:opacity-40"
                @click="toggleActive(pkg)"
              >
                {{ pkg.active ? "Hide" : "Show" }}
              </button>
              <button
                :disabled="busyId === pkg.id"
                class="text-xs font-label-ledger uppercase text-error border border-error/40 rounded-sm px-2.5 py-1.5 disabled:opacity-40"
                @click="deletePackage(pkg)"
              >
                Delete
              </button>
            </td>
          </tr>
          <tr v-if="packages?.length === 0">
            <td colspan="6" class="px-5 py-8 text-center text-on-surface-variant">No packages yet.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
