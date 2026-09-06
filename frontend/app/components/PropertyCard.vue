<script setup lang="ts">
import type { Property } from "~/types/api";

const props = defineProps<{
  property: Property;
  tag?: string;
  fromPrice?: number;
  rating?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
}>();

// Carry the guest's search context (dates/guests) forward so the property and
// room pages can prefill instead of resetting to arbitrary defaults.
const to = computed(() => {
  const query: Record<string, string> = {};
  if (props.checkIn) query.check_in = props.checkIn;
  if (props.checkOut) query.check_out = props.checkOut;
  if (props.guests) query.guests = String(props.guests);
  return { path: `/properties/${props.property.slug}`, query };
});
</script>

<template>
  <NuxtLink
    :to="to"
    class="group cursor-pointer border border-outline/10 hover:border-outline/30 transition-colors bg-surface-container-lowest flex flex-col h-full"
  >
    <div class="relative h-64 overflow-hidden flex-shrink-0">
      <img
        :src="props.property.cover_image_url"
        :alt="props.property.name"
        loading="lazy"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
      />
      <div v-if="props.tag" class="absolute top-4 left-4 flex gap-2">
        <span class="bg-brass-tint text-secondary px-2 py-1 text-xs font-label-ledger rounded-sm">{{
          props.tag
        }}</span>
      </div>
    </div>
    <div class="p-6 flex flex-col flex-1">
      <h3 class="font-headline-sm text-headline-sm text-on-background mb-2 line-clamp-2 min-h-[64px]">{{ props.property.name }}</h3>
      <p class="text-body-md text-on-surface-variant mb-6 line-clamp-2 min-h-[48px]">{{ props.property.description }}</p>
      <div class="mt-auto flex justify-between items-end border-t border-outline/10 pt-4">
        <div class="flex flex-col">
          <span class="font-label-ledger text-label-ledger text-on-surface-variant text-xs uppercase mb-1"
            >From</span
          >
          <span class="font-price-display text-price-display text-on-background"
            >₹{{ props.fromPrice?.toLocaleString("en-IN") }}</span
          >
        </div>
        <div v-if="props.rating" class="flex items-center gap-1 text-on-surface-variant">
          <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1">star</span>
          <span class="font-label-ledger text-label-ledger text-sm">{{ props.rating }}</span>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>
