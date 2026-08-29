<script setup lang="ts">
import type { Property } from "~/types/api";

useSeoMeta({
  title: "Properties — Regale Hotels",
  description: "Browse Regale's four boutique properties across Kerala, Delhi, and Goa.",
});

const { request } = useApi();
const { data: properties, pending } = useAsyncData(
  "properties-list",
  () => request<Property[]>("/api/properties"),
  { lazy: true }
);

const META: Record<string, { tag: string; rating: string }> = {
  "alleppey-ledger": { tag: "Backwaters", rating: "4.9" },
  "munnar-estate": { tag: "Hills", rating: "4.8" },
  "lutyens-haven": { tag: "Heritage", rating: "4.7" },
  "assagao-villa": { tag: "Coastal", rating: "4.9" },
};

const locations = ["All", "Kerala", "North India", "Goa"];
const activeLocation = ref("All");
const locationOf = (state: string) => (state === "Kerala" ? "Kerala" : state === "Delhi" ? "North India" : state === "Goa" ? "Goa" : state);
const filtered = computed(() => {
  if (!properties.value) return [];
  if (activeLocation.value === "All") return properties.value;
  return properties.value.filter((p) => locationOf(p.state) === activeLocation.value);
});
const fromPrice = (p: Property) =>
  p.room_types?.length ? Math.min(...p.room_types.map((r) => r.base_price)) : undefined;
</script>

<template>
  <div class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-20">
    <div class="text-center mb-14">
      <h1 class="font-headline-md text-headline-md text-on-background mb-3">Our Properties</h1>
      <p class="text-body-md text-on-surface-variant max-w-xl mx-auto">
        Four boutique houses, each restored in conversation with its landscape.
      </p>
    </div>

    <div class="flex gap-4 overflow-x-auto hide-scrollbar mb-12 justify-center">
      <button
        v-for="loc in locations"
        :key="loc"
        class="px-4 py-1.5 rounded-full font-label-ledger text-label-ledger whitespace-nowrap transition-colors"
        :class="
          activeLocation === loc
            ? 'bg-brass-tint text-secondary'
            : 'bg-transparent border border-outline-variant text-on-surface-variant hover:border-secondary'
        "
        @click="activeLocation = loc"
      >
        {{ loc }}
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
      <template v-if="pending">
        <PropertyCardSkeleton v-for="i in 4" :key="i" />
      </template>
      <PropertyCard
        v-else
        v-for="p in filtered"
        :key="p.id"
        :property="p"
        :tag="META[p.slug]?.tag"
        :rating="META[p.slug]?.rating"
        :from-price="fromPrice(p)"
      />
    </div>
  </div>
</template>
