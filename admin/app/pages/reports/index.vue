<script setup lang="ts">
definePageMeta({ superAdminOnly: true });

import type { Property, ReportRow } from "~/types/api";

const { request } = useApi();
const reportType = ref<"revenue" | "source" | "status">("revenue");
const { data: rows, pending } = useAsyncData<ReportRow[]>(
  "reports",
  () => request<ReportRow[]>(`/api/admin/reports?type=${reportType.value}`),
  { lazy: true, watch: [reportType] }
);
const { data: properties } = useAsyncData<Property[]>(
  "reports-properties",
  () => request<Property[]>("/api/properties"),
  { lazy: true }
);

const label = (key: string) => {
  if (reportType.value === "revenue") return properties.value?.find((p) => String(p.id) === key)?.name || key;
  return key.replace("_", " ");
};
const maxValue = computed(() => Math.max(1, ...(rows.value?.map((r) => r.value) ?? [1])));
</script>

<template>
  <div>
    <h1 class="font-display-lg text-headline-md text-on-background mb-6">Reports</h1>

    <div class="flex gap-2 mb-8">
      <button
        v-for="t in ['revenue', 'source', 'status'] as const"
        :key="t"
        class="px-4 py-2 rounded-sm font-label-ledger text-xs uppercase border"
        :class="reportType === t ? 'bg-brass-tint text-secondary border-[#C5A059]' : 'bg-white text-on-surface-variant border-outline/20'"
        @click="reportType = t"
      >
        {{ t === "revenue" ? "Revenue by property" : t === "source" ? "Bookings by source" : "Bookings by status" }}
      </button>
    </div>

    <div class="border border-outline/20 bg-white p-6">
      <div v-if="pending">
        <div v-for="i in 4" :key="i" class="mb-5 last:mb-0">
          <div class="flex justify-between mb-1.5">
            <Skeleton class="h-3 w-32" />
            <Skeleton class="h-3 w-16" />
          </div>
          <Skeleton class="h-2.5 w-full" rounded="rounded-full" />
        </div>
      </div>
      <template v-else>
        <div v-for="r in rows" :key="r.key" class="mb-5 last:mb-0">
          <div class="flex justify-between font-label-ledger text-xs uppercase text-on-surface-variant mb-1.5">
            <span>{{ label(r.key) }}</span>
            <span class="text-on-background">{{ reportType === "revenue" ? `₹${r.value.toLocaleString("en-IN")}` : r.value }}</span>
          </div>
          <div class="h-2.5 bg-surface-container-high rounded-full overflow-hidden">
            <div class="h-full bg-primary rounded-full" :style="{ width: `${(r.value / maxValue) * 100}%` }" />
          </div>
        </div>
        <p v-if="rows?.length === 0" class="text-on-surface-variant text-center py-6">No data yet.</p>
      </template>
    </div>
  </div>
</template>
