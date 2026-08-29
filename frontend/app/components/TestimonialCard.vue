<script setup lang="ts">
import type { Testimonial } from "~/types/api";

defineProps<{ testimonial: Testimonial; propertyName?: string }>();
</script>

<template>
  <div class="bg-surface p-8 border border-outline/10 hover:shadow-[4px_4px_0px_rgba(27,48,34,0.05)] transition-shadow">
    <div class="flex text-tertiary mb-6">
      <span
        v-for="n in testimonial.rating"
        :key="n"
        class="material-symbols-outlined text-lg"
        style="font-variation-settings: 'FILL' 1"
        >star</span
      >
    </div>
    <p class="text-body-md text-on-background mb-8 italic">&ldquo;{{ testimonial.quote }}&rdquo;</p>
    <div class="border-t border-outline/20 pt-4">
      <p class="font-label-ledger text-label-ledger text-on-surface-variant">{{ testimonial.guest_name }}</p>
      <p class="font-label-ledger text-label-ledger text-outline text-xs mt-1">
        {{ testimonial.guest_location }}<span v-if="propertyName"> · Stayed at {{ propertyName }}</span>
      </p>
    </div>
  </div>
</template>
