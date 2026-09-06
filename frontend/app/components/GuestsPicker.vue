<script setup lang="ts">
const adults = defineModel<number>("adults", { default: 2 });
const children = defineModel<number>("children", { default: 0 });

const MAX_ADULTS = 12;
const MAX_CHILDREN = 6;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
function incAdults(delta: number) {
  adults.value = clamp(adults.value + delta, 1, MAX_ADULTS);
}
function incChildren(delta: number) {
  children.value = clamp(children.value + delta, 0, MAX_CHILDREN);
}

const summary = computed(() => {
  const parts = [`${adults.value} ${adults.value === 1 ? "Adult" : "Adults"}`];
  if (children.value > 0) parts.push(`${children.value} ${children.value === 1 ? "Child" : "Children"}`);
  return parts.join(", ");
});

const open = ref(false);
const root = ref<HTMLElement | null>(null);
function onDocumentClick(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) open.value = false;
}
onMounted(() => document.addEventListener("click", onDocumentClick));
onUnmounted(() => document.removeEventListener("click", onDocumentClick));
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="w-full flex items-center gap-2 text-on-surface text-left"
      @click="open = !open"
    >
      <span class="material-symbols-outlined text-secondary">group</span>
      <span class="text-body-md truncate">{{ summary }}</span>
    </button>

    <div
      v-if="open"
      class="absolute z-30 top-full left-0 right-0 sm:right-auto mt-2 w-auto sm:w-[260px] max-w-[calc(100vw-2.5rem)] bg-white border border-outline/20 shadow-[4px_4px_0px_rgba(27,48,34,0.08)] p-5 rounded-sm"
    >
      <div class="flex items-center justify-between py-2">
        <div>
          <p class="text-body-md text-on-background">Adults</p>
          <p class="text-[12px] text-outline">Ages 13+</p>
        </div>
        <div class="flex items-center gap-3">
          <button
            type="button"
            :disabled="adults <= 1"
            class="w-7 h-7 flex items-center justify-center rounded-full border border-outline-variant text-on-surface-variant hover:border-secondary disabled:opacity-30 disabled:hover:border-outline-variant"
            @click="incAdults(-1)"
          >
            −
          </button>
          <span class="w-4 text-center text-body-md">{{ adults }}</span>
          <button
            type="button"
            :disabled="adults >= MAX_ADULTS"
            class="w-7 h-7 flex items-center justify-center rounded-full border border-outline-variant text-on-surface-variant hover:border-secondary disabled:opacity-30 disabled:hover:border-outline-variant"
            @click="incAdults(1)"
          >
            +
          </button>
        </div>
      </div>

      <div class="flex items-center justify-between py-2 border-t border-outline/10">
        <div>
          <p class="text-body-md text-on-background">Children</p>
          <p class="text-[12px] text-outline">Ages 0–12</p>
        </div>
        <div class="flex items-center gap-3">
          <button
            type="button"
            :disabled="children <= 0"
            class="w-7 h-7 flex items-center justify-center rounded-full border border-outline-variant text-on-surface-variant hover:border-secondary disabled:opacity-30 disabled:hover:border-outline-variant"
            @click="incChildren(-1)"
          >
            −
          </button>
          <span class="w-4 text-center text-body-md">{{ children }}</span>
          <button
            type="button"
            :disabled="children >= MAX_CHILDREN"
            class="w-7 h-7 flex items-center justify-center rounded-full border border-outline-variant text-on-surface-variant hover:border-secondary disabled:opacity-30 disabled:hover:border-outline-variant"
            @click="incChildren(1)"
          >
            +
          </button>
        </div>
      </div>

      <button
        type="button"
        class="w-full mt-3 bg-primary text-on-primary border-none cursor-pointer py-2.5 rounded font-label-ledger text-xs tracking-[0.08em] uppercase"
        @click="open = false"
      >
        Done
      </button>
    </div>
  </div>
</template>
