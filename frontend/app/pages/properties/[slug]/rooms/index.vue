<script setup lang="ts">
import type { Property } from "~/types/api";

const route = useRoute();
const slug = route.params.slug as string;
const { request } = useApi();

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

useSeoMeta({
  title: () => `Rooms — ${property.value?.name} — Regale Hotels`,
  description: () => `Browse room types at ${property.value?.name}.`,
});
</script>

<template>
  <div v-if="pending" class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-8">
    <Skeleton class="h-4 w-64 mb-6" />
    <Skeleton v-for="i in 3" :key="i" class="h-32 mb-3" />
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
        <NuxtLink :to="`/properties/${property.slug}`" class="hover:text-primary">{{ property.name }}</NuxtLink>
        / Rooms
      </p>
    </section>

    <section class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pb-24">
      <div class="flex justify-between items-end flex-wrap gap-3 mb-6">
        <h1 class="font-display-lg text-[clamp(28px,4vw,32px)] text-on-background">Rooms at {{ property.name }}</h1>
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
  </div>
</template>
