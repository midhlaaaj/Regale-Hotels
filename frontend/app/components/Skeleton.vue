<script setup lang="ts">
withDefaults(defineProps<{ rounded?: string }>(), { rounded: "rounded" });
</script>

<template>
  <div class="skeleton" :class="rounded" aria-hidden="true" />
</template>
