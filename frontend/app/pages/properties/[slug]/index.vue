<script setup lang="ts">
import type { Property, Testimonial } from "~/types/api";

const route = useRoute();
const slug = route.params.slug as string;
const { request } = useApi();
const { link: whatsappLink } = useWhatsapp();

// Carried forward from the homepage/properties search, if the guest arrived with one.
const searchQuery = computed(() => {
  const query: Record<string, string> = {};
  if (route.query.check_in) query.check_in = String(route.query.check_in);
  if (route.query.check_out) query.check_out = String(route.query.check_out);
  if (route.query.guests) query.guests = String(route.query.guests);
  return query;
});

const { data: property, pending } = useAsyncData(
  `property-${slug}`,
  () => request<Property>(`/api/properties/${slug}`),
  { lazy: true }
);
const { data: testimonials } = useAsyncData(
  `property-${slug}-testimonials`,
  () => request<Testimonial[]>(`/api/testimonials?property=${property.value?.id}`),
  { lazy: true, watch: [property] }
);

useSeoMeta({
  title: () => `${property.value?.name} — Regale Hotels`,
  description: () => property.value?.description,
});

const gallery = computed(() => {
  const p = property.value;
  if (!p) return [];
  const roomImages = (p.room_types || []).flatMap((r) => r.images);
  return [p.cover_image_url, ...roomImages, p.cover_image_url].slice(0, 5);
});

const fromPrice = computed(() =>
  property.value?.room_types?.length
    ? Math.min(...property.value.room_types.map((r) => r.base_price))
    : 0
);

const stats = computed(() => {
  const p = property.value;
  if (!p) return [];
  return [
    { k: "Room types", v: String(p.room_types?.length ?? 0) },
    { k: "Max occupancy", v: `${Math.max(...(p.room_types?.map((r) => r.max_occupancy) ?? [2]))} guests` },
    { k: "Location", v: `${p.city}, ${p.state}` },
  ];
});
</script>

<template>
  <div v-if="pending" class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-8">
    <Skeleton class="h-4 w-64 mb-6" />
    <div class="grid gap-2 mb-10" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))">
      <Skeleton rounded="rounded-none" class="min-h-[320px]" />
      <div class="grid grid-cols-2 gap-2">
        <Skeleton v-for="i in 4" :key="i" rounded="rounded-none" class="min-h-[156px]" />
      </div>
    </div>
    <div class="grid gap-8 md:gap-16 items-start" style="grid-template-columns: repeat(auto-fit, minmax(320px, 1fr))">
      <div>
        <Skeleton class="h-4 w-32 mb-3" />
        <Skeleton class="h-10 w-3/4 mb-5" />
        <Skeleton class="h-4 w-full mb-2" />
        <Skeleton class="h-4 w-5/6 mb-8" />
      </div>
      <Skeleton class="h-72" />
    </div>
  </div>
  <div v-else-if="!property" class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-24 text-center">
    <p class="font-display-lg text-headline-md text-on-background mb-3">Property not found</p>
    <NuxtLink to="/properties" class="text-primary font-label-ledger text-sm uppercase border-b border-primary pb-0.5"
      >Back to properties</NuxtLink
    >
  </div>
  <div v-else>
    <section class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-6">
      <p class="font-label-ledger text-xs tracking-[0.12em] uppercase text-outline mb-5">
        Properties / {{ property.state }} / {{ property.name }}
      </p>
    </section>

    <section class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
      <div class="grid gap-2" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))">
        <div class="relative min-h-[320px]">
          <img :src="gallery[0]" :alt="property.name" class="w-full h-full min-h-[320px] max-h-[520px] object-cover block" />
        </div>
        <div class="grid grid-cols-2 gap-2">
          <img
            v-for="(img, i) in gallery.slice(1)"
            :key="i"
            :src="img"
            :alt="`${property.name} — photo ${i + 2}`"
            loading="lazy"
            class="w-full h-full min-h-[156px] object-cover block"
          />
        </div>
      </div>
    </section>

    <section class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-8 md:pt-14 grid gap-8 md:gap-16 items-start" style="grid-template-columns: repeat(auto-fit, minmax(320px, 1fr))">
      <div>
        <p class="font-label-ledger text-xs tracking-[0.16em] uppercase mb-3" style="color: #c5a059">
          {{ property.city }}, {{ property.state }}
        </p>
        <h1 class="font-display-lg text-[clamp(36px,5.5vw,56px)] leading-[1.08] text-on-background mb-5">
          {{ property.name }}
        </h1>
        <p class="text-body-lg text-on-surface-variant mb-5">{{ property.description }}</p>

        <div class="border-t border-outline/20 py-5 grid gap-5" style="grid-template-columns: repeat(auto-fit, minmax(130px, 1fr))">
          <div v-for="s in stats" :key="s.k">
            <p class="font-label-ledger text-[11px] tracking-[0.12em] uppercase text-outline mb-1.5">{{ s.k }}</p>
            <p class="font-label-ledger text-base text-on-background">{{ s.v }}</p>
          </div>
        </div>

        <h2 class="font-display-lg text-headline-md text-on-background mt-10 mb-5">Amenities</h2>
        <div class="flex flex-wrap gap-2.5">
          <span
            v-for="a in property.amenities"
            :key="a"
            class="inline-flex items-center gap-1.5 bg-brass-tint text-secondary px-3.5 py-2 rounded-sm font-label-ledger text-[13px] tracking-[0.04em]"
          >
            <span class="material-symbols-outlined text-base">check</span>{{ a }}
          </span>
        </div>

        <h2 class="font-display-lg text-headline-md text-on-background mt-12 mb-4">Getting here</h2>
        <div
          class="border border-outline/20 h-[260px] flex flex-col items-center justify-center gap-2"
          style="background: repeating-linear-gradient(135deg, #f0eee9 0px, #f0eee9 9px, #e8e5dd 9px, #e8e5dd 18px)"
        >
          <span class="material-symbols-outlined text-3xl text-secondary">map</span>
          <p class="font-label-ledger text-xs tracking-[0.1em] uppercase text-on-surface-variant">
            Map embed — {{ property.city }}
          </p>
          <p v-if="property.latitude" class="font-label-ledger text-[11px] text-outline">
            {{ property.latitude }}° N, {{ property.longitude }}° E
          </p>
        </div>
      </div>

      <div class="border border-outline/20 bg-white shadow-[4px_4px_0px_rgba(27,48,34,0.05)] p-7 sticky top-[130px]">
        <p class="font-label-ledger text-[11px] tracking-[0.14em] uppercase text-outline mb-1.5">From / night</p>
        <p class="font-price-display text-[32px] text-on-background mb-1">₹{{ fromPrice.toLocaleString("en-IN") }}</p>
        <p class="text-sm text-outline mb-6">excl. 12% GST</p>
        <NuxtLink
          :to="`/properties/${property.slug}#rooms`"
          class="w-full block text-center bg-primary text-on-primary border-none cursor-pointer py-4 rounded font-label-ledger text-[13px] tracking-[0.1em] uppercase hover:bg-primary-container transition-colors"
        >
          Check availability
        </NuxtLink>
        <a
          :href="whatsappLink(`Hi, I have a question about ${property.name}`)"
          target="_blank"
          rel="noopener noreferrer"
          class="w-full mt-2.5 flex items-center justify-center gap-2 bg-transparent text-[#1B3022] border cursor-pointer py-3.5 rounded font-label-ledger text-[13px] tracking-[0.1em] uppercase hover:bg-brass-tint transition-colors"
          style="border-color: #c5a059"
        >
          <span class="material-symbols-outlined text-[17px]">forum</span>Ask on WhatsApp
        </a>
        <p class="text-[13px] text-outline mt-3.5 text-center">No card charged until you confirm.</p>
      </div>
    </section>

    <section id="rooms" class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-12 md:pt-20 scroll-mt-24">
      <div class="flex justify-between items-end flex-wrap gap-3 mb-6">
        <h2 class="font-display-lg text-[clamp(28px,4vw,32px)] text-on-background">Rooms at this property</h2>
        <span class="font-label-ledger text-xs tracking-[0.1em] uppercase text-outline"
          >{{ property.room_types?.length }} room types</span
        >
      </div>
      <div class="border-t border-outline/20">
        <NuxtLink
          v-for="r in property.room_types"
          :key="r.id"
          :to="{ path: `/properties/${property.slug}/rooms/${r.id}`, query: searchQuery }"
          class="cursor-pointer border-b border-outline/15 py-5 flex flex-wrap gap-5 items-center hover:bg-surface-container-low transition-colors"
        >
          <img
            :src="r.images[0] || property.cover_image_url"
            :alt="r.name"
            loading="lazy"
            class="w-[168px] h-[118px] object-cover block flex-shrink-0"
          />
          <div class="flex-1 min-w-[200px]">
            <h3 class="font-display-lg text-headline-sm text-on-background mb-1.5">{{ r.name }}</h3>
            <p class="text-[15px] leading-[23px] text-on-surface-variant mb-2 max-w-[46ch]">{{ r.description }}</p>
            <p class="font-label-ledger text-[11px] tracking-[0.1em] uppercase text-outline">
              Sleeps {{ r.max_occupancy }}
            </p>
          </div>
          <div class="flex flex-col items-end gap-2.5 min-w-[150px]">
            <div class="text-right">
              <p class="font-label-ledger text-[11px] tracking-[0.12em] uppercase text-outline mb-0.5">From / night</p>
              <p class="font-price-display text-price-display text-on-background">₹{{ r.base_price.toLocaleString("en-IN") }}</p>
            </div>
            <span class="font-label-ledger text-xs tracking-[0.08em] uppercase text-primary border-b border-primary pb-0.5"
              >View room</span
            >
          </div>
        </NuxtLink>
      </div>
    </section>

    <section v-if="testimonials?.length" class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-12 md:pt-20 pb-24">
      <h2 class="font-display-lg text-[clamp(28px,4vw,32px)] text-on-background mb-7">From the guest ledger</h2>
      <div class="grid gap-6" style="grid-template-columns: repeat(auto-fit, minmax(290px, 1fr))">
        <TestimonialCard v-for="t in testimonials" :key="t.id" :testimonial="t" />
      </div>
    </section>
  </div>
</template>
