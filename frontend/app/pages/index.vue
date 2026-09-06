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
  "mattancherry-manor": { tag: "Heritage", rating: "4.7" },
  "varkala-cliff-villa": { tag: "Coastal", rating: "4.9" },
};

const fromPrice = (p: Property) => p.room_types?.length
  ? Math.min(...(p.room_types.map((r) => r.base_price)))
  : undefined;

const destinationOptions = computed(() => {
  const cities = new Set<string>();
  for (const p of properties.value ?? []) {
    cities.add(p.city);
    cities.add(p.name);
  }
  return [...cities];
});

const destination = ref("");
const today = new Date().toISOString().slice(0, 10);
const inWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
const inNineDays = new Date(Date.now() + 9 * 86400000).toISOString().slice(0, 10);
const checkIn = ref(inWeek);
const checkOut = ref(inNineDays);
const adultsCount = ref(2);
const childrenCount = ref(0);
const guestsCount = computed(() => adultsCount.value + childrenCount.value);

watch(checkIn, (newCheckIn) => {
  if (checkOut.value <= newCheckIn) {
    checkOut.value = new Date(new Date(newCheckIn).getTime() + 2 * 86400000).toISOString().slice(0, 10);
  }
});

const router = useRouter();
function search() {
  router.push({
    path: "/properties",
    query: {
      ...(destination.value.trim() ? { q: destination.value.trim() } : {}),
      check_in: checkIn.value,
      check_out: checkOut.value,
      guests: String(guestsCount.value),
    },
  });
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
        <h1 class="order-2 md:order-none font-display-lg text-display-lg-mobile md:text-display-lg text-surface-bright mb-6 max-w-3xl">
          Sanctuaries of Serenity
        </h1>
        <p class="order-3 md:order-none text-body-lg text-surface-variant mb-12 max-w-xl">
          Curated boutique properties offering an authentic, unhurried Indian editorial experience.
        </p>
        <div class="order-1 md:order-none mb-6 md:mb-0 flex flex-wrap justify-center items-center gap-x-5 gap-y-2 sm:gap-x-7 bg-on-background/45 backdrop-blur-md px-5 sm:px-6 py-3 rounded-full border border-surface/15 max-w-full">
          <div class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[18px]" style="font-variation-settings: 'FILL' 1; color: #c5a059">star</span>
            <span class="font-label-ledger text-label-ledger text-surface-bright whitespace-nowrap">4.8 Rating</span>
          </div>
          <span class="w-px h-4 bg-surface/25 flex-shrink-0 hidden sm:block" />
          <span class="font-label-ledger text-label-ledger text-surface-bright whitespace-nowrap">2,340 Direct Guests</span>
          <span class="w-px h-4 bg-surface/25 flex-shrink-0 hidden sm:block" />
          <span class="font-label-ledger text-label-ledger text-surface-bright whitespace-nowrap hidden sm:inline"
            >{{ properties?.length || 4 }} Kerala Properties</span
          >
        </div>
      </div>
    </section>

    <!-- Sits in normal document flow (not absolutely positioned) so the page's
         scrollable height is always correct — a fixed negative margin pulls it
         up over the hero on larger screens without needing to guess its height. -->
    <div class="relative z-20 w-full max-w-4xl mx-auto px-margin-mobile md:px-0 -mt-8 sm:-mt-12 md:-mt-14">
      <div class="bg-surface p-6 shadow-[4px_4px_0px_rgba(27,48,34,0.05)] border border-outline/10 flex flex-col md:flex-row gap-6 items-end">
        <div class="w-full md:w-1/3 flex flex-col gap-2 ledger-line pb-2 relative">
          <label class="font-label-ledger text-label-ledger text-on-surface-variant uppercase text-xs">Destination</label>
          <div class="flex items-center gap-2 text-on-surface">
            <span class="material-symbols-outlined text-secondary">location_on</span>
            <input
              v-model="destination"
              type="text"
              list="destination-options"
              placeholder="Where to?"
              class="w-full bg-transparent border-none p-0 focus:ring-0 text-body-md placeholder:text-outline-variant"
            />
            <datalist id="destination-options">
              <option v-for="d in destinationOptions" :key="d" :value="d" />
            </datalist>
          </div>
        </div>
        <div class="w-full md:w-1/3 flex gap-3">
          <div class="flex-1 flex flex-col gap-2 ledger-line pb-2">
            <label class="font-label-ledger text-label-ledger text-on-surface-variant uppercase text-xs">Check in</label>
            <div class="flex items-center gap-2 text-on-surface">
              <input
                v-model="checkIn"
                type="date"
                :min="today"
                class="w-full bg-transparent border-none p-0 focus:ring-0 text-body-md"
              />
            </div>
          </div>
          <div class="flex-1 flex flex-col gap-2 ledger-line pb-2">
            <label class="font-label-ledger text-label-ledger text-on-surface-variant uppercase text-xs">Check out</label>
            <div class="flex items-center gap-2 text-on-surface">
              <input
                v-model="checkOut"
                type="date"
                :min="checkIn"
                class="w-full bg-transparent border-none p-0 focus:ring-0 text-body-md"
              />
            </div>
          </div>
        </div>
        <div class="w-full md:w-1/4 flex flex-col gap-2 ledger-line pb-2">
          <label class="font-label-ledger text-label-ledger text-on-surface-variant uppercase text-xs">Guests</label>
          <GuestsPicker v-model:adults="adultsCount" v-model:children="childrenCount" />
        </div>
        <button
          class="w-full md:w-auto bg-primary text-on-primary px-8 py-3 font-label-ledger text-label-ledger uppercase tracking-wider hover:bg-primary-container transition-colors h-[48px] rounded flex items-center justify-center"
          @click="search"
        >
          Search
        </button>
      </div>
    </div>

    <section class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-16 md:pt-20 pb-24">
      <div class="mb-12">
        <h2 class="font-headline-md text-headline-md text-on-background mb-2">The Collection</h2>
        <p class="text-body-md text-on-surface-variant">Carefully restored heritage homes and intimate nature retreats.</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
        <template v-if="propertiesPending">
          <PropertyCardSkeleton v-for="i in 4" :key="i" />
        </template>
        <PropertyCard
          v-else
          v-for="p in properties"
          :key="p.id"
          :property="p"
          :tag="META[p.slug]?.tag"
          :rating="META[p.slug]?.rating"
          :from-price="fromPrice(p)"
          :check-in="checkIn"
          :check-out="checkOut"
          :guests="guestsCount"
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

    <section class="max-w-container-max mx-auto md:px-margin-desktop py-24 overflow-hidden">
      <h2 class="font-headline-md text-headline-md text-on-background mb-16 text-center px-margin-mobile md:px-0">From The Guest Ledger</h2>
      <div
        class="flex md:grid md:grid-cols-3 gap-gutter overflow-x-auto md:overflow-visible snap-x snap-mandatory px-margin-mobile md:px-0 pb-2 md:pb-0 hide-scrollbar"
      >
        <template v-if="testimonialsPending">
          <div v-for="i in 3" :key="i" class="bg-surface p-8 border border-outline/10 min-w-[85%] sm:min-w-[60%] md:min-w-0 flex-shrink-0 snap-center">
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
          class="min-w-[85%] sm:min-w-[60%] md:min-w-0 flex-shrink-0 snap-center"
        />
      </div>
    </section>
  </div>
</template>
