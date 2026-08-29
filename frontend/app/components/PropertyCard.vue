<script setup lang="ts">
import type { Property } from "~/types/api";

const props = defineProps<{
  property: Property;
  tag?: string;
  fromPrice?: number;
  rating?: string;
}>();
</script>

<template>
  <NuxtLink
    :to="`/properties/${props.property.slug}`"
    class="group cursor-pointer border border-outline/10 hover:border-outline/30 transition-colors bg-surface-container-lowest block"
  >
    <div class="relative h-64 overflow-hidden">
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
    <div class="p-6">
      <h3 class="font-headline-sm text-headline-sm text-on-background mb-2">{{ props.property.name }}</h3>
      <p class="text-body-md text-on-surface-variant mb-6 line-clamp-2">{{ props.property.description }}</p>
      <div class="flex justify-between items-end border-t border-outline/10 pt-4">
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
