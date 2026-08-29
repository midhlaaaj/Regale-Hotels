<script setup lang="ts">
import type { Property, Testimonial } from "~/types/api";

useSeoMeta({
  title: "Regale Hotels — Sanctuaries of Serenity",
  description:
    "Curated boutique properties offering an authentic, unhurried Indian editorial experience. Book direct at Regale Hotels' four heritage retreats.",
});

const { request } = useApi();

const { data: properties, pending: propertiesPending } = useAsyncData(
  "home-properties",
  () => request<Property[]>("/api/properties"),
  { lazy: true }
);
const { data: testimonials, pending: testimonialsPending } = useAsyncData(
  "home-testimonials",
  () => request<Testimonial[]>("/api/testimonials"),
  { lazy: true }
);

// Presentational metadata not modeled in the DB (tag/rating are design flourishes
// from the original reference, not guest-review-derived figures).
const META: Record<string, { tag: string; rating: string }> = {
  "alleppey-ledger": { tag: "Backwaters", rating: "4.9" },
  "munnar-estate": { tag: "Hills", rating: "4.8" },
  "lutyens-haven": { tag: "Heritage", rating: "4.7" },
  "assagao-villa": { tag: "Coastal", rating: "4.9" },
};

const locations = ["All", "Kerala", "North India", "Goa"];
const activeLocation = ref("All");
const locationOf = (city: string, state: string) => {
  if (state === "Kerala") return "Kerala";
  if (state === "Delhi") return "North India";
  if (state === "Goa") return "Goa";
  return state;
};
const filteredProperties = computed(() => {
  if (!properties.value) return [];
  if (activeLocation.value === "All") return properties.value;
  return properties.value.filter((p) => locationOf(p.city, p.state) === activeLocation.value);
});

const fromPrice = (p: Property) => p.room_types?.length
  ? Math.min(...(p.room_types.map((r) => r.base_price)))
  : undefined;

const destination = ref("");
const dates = ref("");
const guests = ref("2 Guests, 1 Room");
const router = useRouter();
function search() {
  router.push({ path: "/properties", query: destination.value ? { q: destination.value } : {} });
}

const advantages = [
  { icon: "payments", title: "Best Rate Guarantee", body: "We promise the lowest available price when you book directly with our properties." },
  { icon: "chat", title: "Direct WhatsApp Concierge", body: "Plan your stay, request amenities, or ask questions directly to our on-site team." },
  { icon: "edit_calendar", title: "Flexible Changes", body: "Life happens. Enjoy complimentary date modifications up to 7 days before arrival." },
];
</script>

<template>
  <div>
    <section class="relative h-[85vh] min-h-[600px] flex items-center justify-center">
      <div class="absolute inset-0 overflow-hidden">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAk6EmCOSxbMeL1PfUfK8ynVGKiKuO_CMUxG27XcxklX_HL1IvViLvol9NUNutY5hDxNSOwRCQ0f3jQOROAQJ02PMFFu6aYn8JOjfrSEjzGJEfna5f9SXzYioj5fNX1lCiR49CcMzoD3yMnmrZfuYrawe94GdOuOZH3oEqSjF8LysJYRiK1dCQfNvKibHPtLdkqp1j9baRalvqZQvrEIjQDZFur3ZtyrJJFTSYxf5oXE0mglO4P3ExT"
          alt="A wooden houseboat gliding through Alleppey's backwaters at dawn"
          class="w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-on-background/80 via-on-background/20 to-transparent" />
      </div>
      <div class="relative z-10 w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop flex flex-col items-center text-center">
        <h1 class="font-display-lg text-display-lg-mobile md:text-display-lg text-surface-bright mb-6 max-w-3xl">
          Sanctuaries of Serenity
        </h1>
        <p class="text-body-lg text-surface-variant mb-12 max-w-xl">
          Curated boutique properties offering an authentic, unhurried Indian editorial experience.
        </p>
        <div class="flex items-center gap-4 bg-surface/10 backdrop-blur-sm px-4 py-2 rounded-full border border-surface/20">
          <span class="font-label-ledger text-label-ledger text-surface-bright">4.8★ from 2,340 direct guests</span>
        </div>
      </div>

      <div class="absolute bottom-0 translate-y-1/2 w-full max-w-4xl mx-auto px-margin-mobile md:px-0 z-20 left-1/2 -translate-x-1/2">
        <div class="bg-surface p-6 shadow-[4px_4px_0px_rgba(27,48,34,0.05)] border border-outline/10 flex flex-col md:flex-row gap-6 items-end">
          <div class="w-full md:w-1/3 flex flex-col gap-2 ledger-line pb-2 relative">
            <label class="font-label-ledger text-label-ledger text-on-surface-variant uppercase text-xs">Destination</label>
            <div class="flex items-center gap-2 text-on-surface">
              <span class="material-symbols-outlined text-secondary">location_on</span>
              <input v-model="destination" type="text" placeholder="Where to?" class="w-full bg-transparent border-none p-0 focus:ring-0 text-body-md placeholder:text-outline-variant" />
            </div>
          </div>
          <div class="w-full md:w-1/3 flex flex-col gap-2 ledger-line pb-2">
            <label class="font-label-ledger text-label-ledger text-on-surface-variant uppercase text-xs">Dates</label>
            <div class="flex items-center gap-2 text-on-surface">
              <span class="material-symbols-outlined text-secondary">calendar_month</span>
              <input v-model="dates" type="text" placeholder="Check in - Check out" class="w-full bg-transparent border-none p-0 focus:ring-0 text-body-md placeholder:text-outline-variant" />
            </div>
          </div>
          <div class="w-full md:w-1/4 flex flex-col gap-2 ledger-line pb-2">
            <label class="font-label-ledger text-label-ledger text-on-surface-variant uppercase text-xs">Guests</label>
            <div class="flex items-center gap-2 text-on-surface">
              <span class="material-symbols-outlined text-secondary">group</span>
              <input v-model="guests" type="text" class="w-full bg-transparent border-none p-0 focus:ring-0 text-body-md placeholder:text-outline-variant" />
            </div>
          </div>
          <button
            class="w-full md:w-auto bg-primary text-on-primary px-8 py-3 font-label-ledger text-label-ledger uppercase tracking-wider hover:bg-primary-container transition-colors h-[48px] rounded flex items-center justify-center"
            @click="search"
          >
            Search
          </button>
        </div>
      </div>
    </section>

    <div class="h-32 md:h-24" />

    <section class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-24">
      <div class="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div>
          <h2 class="font-headline-md text-headline-md text-on-background mb-2">The Collection</h2>
          <p class="text-body-md text-on-surface-variant">Carefully restored heritage homes and intimate nature retreats.</p>
        </div>
        <div class="flex gap-4 overflow-x-auto hide-scrollbar w-full md:w-auto pb-2">
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
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
        <template v-if="propertiesPending">
          <PropertyCardSkeleton v-for="i in 4" :key="i" />
        </template>
        <PropertyCard
          v-else
          v-for="p in filteredProperties"
          :key="p.id"
          :property="p"
          :tag="META[p.slug]?.tag"
          :rating="META[p.slug]?.rating"
          :from-price="fromPrice(p)"
        />
      </div>
    </section>

    <section class="bg-surface-container-low py-24 border-y border-outline/10">
      <div class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center">
        <h2 class="font-headline-md text-headline-md text-on-background mb-16">The Direct Advantage</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-gutter">
          <div v-for="a in advantages" :key="a.title" class="flex flex-col items-center">
            <div class="w-16 h-16 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center mb-6">
              <span class="material-symbols-outlined text-3xl">{{ a.icon }}</span>
            </div>
            <h3 class="font-headline-sm text-headline-sm text-on-background mb-3">{{ a.title }}</h3>
            <p class="text-body-md text-on-surface-variant max-w-xs text-center">{{ a.body }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-24">
      <h2 class="font-headline-md text-headline-md text-on-background mb-16 text-center">From The Guest Ledger</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <template v-if="testimonialsPending">
          <div v-for="i in 3" :key="i" class="bg-surface p-8 border border-outline/10">
            <Skeleton class="h-4 w-24 mb-6" />
            <Skeleton class="h-4 w-full mb-2" />
            <Skeleton class="h-4 w-full mb-2" />
            <Skeleton class="h-4 w-2/3 mb-8" />
            <div class="border-t border-outline/20 pt-4">
              <Skeleton class="h-4 w-28 mb-2" />
              <Skeleton class="h-3 w-36" />
            </div>
          </div>
        </template>
        <TestimonialCard
          v-else
          v-for="t in testimonials"
          :key="t.id"
          :testimonial="t"
          :property-name="properties?.find((p) => p.id === t.property_id)?.name"
        />
      </div>
    </section>
  </div>
</template>
