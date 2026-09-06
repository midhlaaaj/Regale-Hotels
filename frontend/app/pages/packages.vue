<script setup lang="ts">
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
  property_name: string;
  property_slug: string;
  property_city: string;
}

useSeoMeta({
  title: "Packages — Regale Hotels",
  description: "Multi-night stay packages across Regale's Kerala properties, with meals and extras bundled in.",
});

const { request } = useApi();
const { data: packages, pending } = useAsyncData<Package[]>("packages-list", () => request<Package[]>("/api/packages"), {
  lazy: true,
});
</script>

<template>
  <div class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-8 md:pt-14 pb-24">
    <p class="font-label-ledger text-xs tracking-[0.16em] uppercase mb-3" style="color: #c5a059">Stay packages</p>
    <h1 class="font-display-lg text-[clamp(38px,6.5vw,64px)] leading-tight text-on-background mb-6">Packages</h1>
    <p class="text-body-lg text-on-surface-variant max-w-[56ch] mb-14">
      Multi-night stays bundled with meals and extras, priced as one package — bookable direct.
    </p>

    <div v-if="pending" class="grid gap-8 md:grid-cols-2">
      <div v-for="i in 2" :key="i" class="border border-outline/10 bg-surface-container-lowest">
        <Skeleton class="h-56 w-full" rounded="rounded-none" />
        <div class="p-6">
          <Skeleton class="h-4 w-24 mb-3" />
          <Skeleton class="h-6 w-2/3 mb-3" />
          <Skeleton class="h-4 w-full mb-2" />
          <Skeleton class="h-4 w-3/4" />
        </div>
      </div>
    </div>

    <div v-else-if="packages?.length" class="grid gap-8 md:grid-cols-2">
      <div v-for="pkg in packages" :key="pkg.id" class="border border-outline/10 bg-surface-container-lowest">
        <div class="relative h-56 overflow-hidden">
          <img :src="pkg.cover_image_url || ''" :alt="pkg.name" class="w-full h-full object-cover" />
          <span class="absolute top-4 left-4 bg-brass-tint text-secondary px-2.5 py-1 text-xs font-label-ledger rounded-sm"
            >{{ pkg.nights }} Nights, {{ pkg.nights - 1 }} Days</span
          >
        </div>
        <div class="p-6">
          <p class="font-label-ledger text-[11px] tracking-[0.12em] uppercase text-outline mb-2">
            {{ pkg.property_name }} · {{ pkg.property_city }}
          </p>
          <h3 class="font-display-lg text-headline-sm text-on-background mb-2.5">{{ pkg.name }}</h3>
          <p class="text-body-md text-on-surface-variant mb-4">{{ pkg.description }}</p>
          <div class="flex flex-wrap gap-2 mb-5">
            <span class="bg-surface-container-highest text-on-surface-variant px-2.5 py-1 text-xs font-label-ledger rounded-sm">{{
              pkg.meal_plan
            }}</span>
            <span class="bg-surface-container-highest text-on-surface-variant px-2.5 py-1 text-xs font-label-ledger rounded-sm"
              >{{ pkg.rooms_included }} {{ pkg.rooms_included === 1 ? "Room" : "Rooms" }}</span
            >
            <span class="bg-surface-container-highest text-on-surface-variant px-2.5 py-1 text-xs font-label-ledger rounded-sm"
              >Up to {{ pkg.max_guests }} guests</span
            >
          </div>
          <div class="flex justify-between items-end border-t border-outline/10 pt-4">
            <div>
              <p class="font-label-ledger text-[11px] uppercase text-on-surface-variant mb-0.5">Package price</p>
              <p class="font-price-display text-price-display text-on-background">₹{{ pkg.price.toLocaleString("en-IN") }}</p>
            </div>
            <NuxtLink
              :to="`/properties/${pkg.property_slug}`"
              class="bg-primary text-on-primary px-5 py-3 rounded font-label-ledger text-xs uppercase tracking-wider hover:bg-primary-container transition-colors"
              >View property</NuxtLink
            >
          </div>
        </div>
      </div>
    </div>

    <p v-else class="text-center py-16 text-on-surface-variant">No packages available right now — check back soon.</p>
  </div>
</template>
