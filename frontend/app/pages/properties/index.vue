<script setup lang="ts">
import type { Property } from "~/types/api";

useSeoMeta({
  title: "Properties — Regale Hotels",
  description: "Browse Regale's boutique properties across Kerala.",
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
  "mattancherry-manor": { tag: "Heritage", rating: "4.7" },
  "varkala-cliff-villa": { tag: "Coastal", rating: "4.9" },
};

// Derived from live property data rather than a fixed list, so a future
// property in a new city/state shows up as a filter automatically.
const locations = computed(() => ["All", ...new Set((properties.value ?? []).map((p) => p.city))]);
const activeLocation = ref("All");

// ---------- Search context, carried in from the homepage (or edited here) ----------
const route = useRoute();
const destination = ref((route.query.q as string) ?? "");
const today = new Date().toISOString().slice(0, 10);
const checkIn = ref((route.query.check_in as string) || today);
const checkOut = ref((route.query.check_out as string) || new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10));
// If the guest arrived with a total guest count (from the homepage) but no adults/children
// split, treat it all as adults — the split only matters once they open the picker here.
const adultsCount = ref(Number(route.query.guests) || 2);
const childrenCount = ref(0);
const guestsCount = computed(() => adultsCount.value + childrenCount.value);

watch(checkIn, (newCheckIn) => {
  if (checkOut.value <= newCheckIn) {
    checkOut.value = new Date(new Date(newCheckIn).getTime() + 2 * 86400000).toISOString().slice(0, 10);
  }
});

const filtered = computed(() => {
  if (!properties.value) return [];
  let list = properties.value;
  if (activeLocation.value !== "All") {
    list = list.filter((p) => p.city === activeLocation.value);
  }
  const q = destination.value.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (p) => p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q) || p.state.toLowerCase().includes(q)
    );
  }
  if (guestsCount.value > 1) {
    list = list.filter((p) => (p.room_types ?? []).some((r) => r.max_occupancy >= guestsCount.value));
  }
  return list;
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

    <div class="border border-outline/20 bg-white p-4 md:p-5 mb-8 flex flex-col md:flex-row gap-4 md:items-end max-w-4xl mx-auto">
      <div class="flex-1 flex flex-col gap-1.5">
        <label class="font-label-ledger text-[11px] tracking-[0.1em] uppercase text-outline">Destination</label>
        <input v-model="destination" type="text" placeholder="City or property" class="border-b border-secondary bg-transparent py-1.5 text-body-md" />
      </div>
      <div class="flex-1 flex gap-3">
        <div class="flex-1 flex flex-col gap-1.5">
          <label class="font-label-ledger text-[11px] tracking-[0.1em] uppercase text-outline">Check in</label>
          <input v-model="checkIn" type="date" :min="today" class="border-b border-secondary bg-transparent py-1.5 text-body-md w-full" />
        </div>
        <div class="flex-1 flex flex-col gap-1.5">
          <label class="font-label-ledger text-[11px] tracking-[0.1em] uppercase text-outline">Check out</label>
          <input v-model="checkOut" type="date" :min="checkIn" class="border-b border-secondary bg-transparent py-1.5 text-body-md w-full" />
        </div>
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="font-label-ledger text-[11px] tracking-[0.1em] uppercase text-outline">Guests</label>
        <GuestsPicker v-model:adults="adultsCount" v-model:children="childrenCount" />
      </div>
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
        :check-in="checkIn"
        :check-out="checkOut"
        :guests="guestsCount"
      />
      <p v-if="!pending && filtered.length === 0" class="col-span-full text-center py-16 text-on-surface-variant">
        No properties match this search. Try different dates, guests, or destination.
      </p>
    </div>
  </div>
</template>
