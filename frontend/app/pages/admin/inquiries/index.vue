<script setup lang="ts">
definePageMeta({ layout: "admin" });

import type { AdminBooking, Property } from "~/types/admin-api";

const { request } = useAdminApi();
const { data: inquiries, pending, refresh } = useAsyncData<AdminBooking[]>(
  "inquiries",
  () => request<AdminBooking[]>("/api/admin/bookings?status=pending_whatsapp"),
  { lazy: true }
);
const { data: properties } = useAsyncData<Property[]>(
  "inquiries-properties",
  () => request<Property[]>("/api/properties"),
  { lazy: true }
);
const propertyName = (id: number) => properties.value?.find((p) => p.id === id)?.name || `#${id}`;

const busyId = ref<number | null>(null);
async function confirm(id: number) {
  busyId.value = id;
  try {
    await request(`/api/admin/bookings/${id}/confirm`, { method: "PATCH" });
    await refresh();
  } finally {
    busyId.value = null;
  }
}
async function reject(id: number) {
  busyId.value = id;
  try {
    await request(`/api/admin/bookings/${id}/cancel`, { method: "PATCH" });
    await refresh();
  } finally {
    busyId.value = null;
  }
}
</script>

<template>
  <div>
    <h1 class="font-display-lg text-headline-md text-on-background mb-1.5">WhatsApp inquiries</h1>
    <p class="text-body-md text-on-surface-variant mb-6">Rooms held for 12 hours pending manual confirmation.</p>

    <div v-if="pending">
      <div v-for="i in 3" :key="i" class="border border-outline/20 bg-white p-5 mb-3 flex flex-wrap gap-4 justify-between items-center">
        <div class="flex-1">
          <Skeleton class="h-4 w-10 mb-2" />
          <Skeleton class="h-4 w-40 mb-2" />
          <Skeleton class="h-3 w-56" />
        </div>
        <Skeleton class="h-9 w-40" />
      </div>
    </div>

    <div v-else-if="inquiries?.length === 0" class="border border-outline/20 bg-white p-10 text-center text-on-surface-variant">
      Nothing pending — every inquiry has been actioned.
    </div>

    <template v-else>
      <div v-for="b in inquiries" :key="b.id" class="border border-outline/20 bg-white p-5 mb-3 flex flex-wrap gap-4 justify-between items-center">
        <div>
          <p class="font-price-display text-primary mb-1">#{{ b.id }}</p>
          <p class="text-on-background font-label-ledger text-sm mb-0.5">{{ propertyName(b.property_id) }}</p>
          <p class="font-label-ledger text-xs text-outline">{{ b.check_in }} → {{ b.check_out }} · {{ b.guests_count }} guests</p>
        </div>
        <div class="flex items-center gap-3">
          <span class="font-price-display text-lg">₹{{ Number(b.total_amount).toLocaleString("en-IN") }}</span>
          <button
            :disabled="busyId === b.id"
            class="bg-secondary text-white border-none cursor-pointer px-4 py-2.5 rounded-sm font-label-ledger text-xs uppercase disabled:opacity-40"
            @click="confirm(b.id)"
          >
            Confirm
          </button>
          <button
            :disabled="busyId === b.id"
            class="bg-transparent text-error border border-error/40 cursor-pointer px-4 py-2.5 rounded-sm font-label-ledger text-xs uppercase disabled:opacity-40"
            @click="reject(b.id)"
          >
            Reject
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
