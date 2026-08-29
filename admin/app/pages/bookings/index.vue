<script setup lang="ts">
import type { AdminBooking, BookingStatus, Property } from "~/types/api";

const { request } = useApi();

const statusFilter = ref<BookingStatus | "all">("all");
const { data: bookings, pending, refresh } = useAsyncData<AdminBooking[]>(
  "bookings-list",
  () =>
    request<AdminBooking[]>(
      `/api/admin/bookings${statusFilter.value !== "all" ? `?status=${statusFilter.value}` : ""}`
    ),
  { lazy: true, watch: [statusFilter] }
);
const { data: properties } = useAsyncData<Property[]>(
  "bookings-properties",
  () => request<Property[]>("/api/properties"),
  { lazy: true }
);
const propertyName = (id: number) => properties.value?.find((p) => p.id === id)?.name || `#${id}`;

const statuses: (BookingStatus | "all")[] = ["all", "pending_payment", "confirmed", "pending_whatsapp", "cancelled", "refunded"];
const busyId = ref<number | null>(null);

async function confirmBooking(id: number) {
  busyId.value = id;
  try {
    await request(`/api/admin/bookings/${id}/confirm`, { method: "PATCH" });
    await refresh();
  } finally {
    busyId.value = null;
  }
}
async function cancelBooking(id: number) {
  busyId.value = id;
  try {
    await request(`/api/admin/bookings/${id}/cancel`, { method: "PATCH" });
    await refresh();
  } finally {
    busyId.value = null;
  }
}
async function refundBooking(id: number) {
  busyId.value = id;
  try {
    await request(`/api/admin/bookings/${id}/refund`, { method: "POST" });
    await refresh();
  } finally {
    busyId.value = null;
  }
}

const statusColor: Record<string, string> = {
  confirmed: "bg-secondary-container text-ink-green",
  pending_payment: "bg-brass-tint text-secondary",
  pending_whatsapp: "bg-brass-tint text-secondary",
  cancelled: "bg-surface-container-highest text-on-surface-variant",
  refunded: "bg-surface-container-highest text-on-surface-variant",
};
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6 flex-wrap gap-3">
      <h1 class="font-display-lg text-headline-md text-on-background">Bookings</h1>
    </div>

    <div class="flex gap-2 overflow-x-auto mb-5">
      <button
        v-for="s in statuses"
        :key="s"
        class="px-3.5 py-1.5 rounded-full font-label-ledger text-xs uppercase whitespace-nowrap border"
        :class="statusFilter === s ? 'bg-brass-tint text-secondary border-[#C5A059]' : 'bg-white text-on-surface-variant border-outline/20'"
        @click="statusFilter = s"
      >
        {{ s.replace("_", " ") }}
      </button>
    </div>

    <div class="border border-outline/20 bg-white overflow-x-auto">
      <table class="w-full text-sm min-w-[720px]">
        <thead>
          <tr class="border-b border-outline/20 font-label-ledger text-[11px] uppercase text-outline">
            <th class="px-5 py-3 text-left">Ref</th>
            <th class="px-5 py-3 text-left">Property</th>
            <th class="px-5 py-3 text-left">Dates</th>
            <th class="px-5 py-3 text-left">Guests</th>
            <th class="px-5 py-3 text-right">Total</th>
            <th class="px-5 py-3 text-right">Status</th>
            <th class="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody v-if="pending">
          <tr v-for="i in 6" :key="i" class="border-b border-outline/10 last:border-0">
            <td class="px-5 py-3"><Skeleton class="h-4 w-10" /></td>
            <td class="px-5 py-3"><Skeleton class="h-4 w-32" /></td>
            <td class="px-5 py-3"><Skeleton class="h-4 w-28" /></td>
            <td class="px-5 py-3"><Skeleton class="h-4 w-6" /></td>
            <td class="px-5 py-3 text-right"><Skeleton class="h-4 w-16 ml-auto" /></td>
            <td class="px-5 py-3 text-right"><Skeleton class="h-5 w-20 ml-auto" /></td>
            <td class="px-5 py-3 text-right"><Skeleton class="h-6 w-16 ml-auto" /></td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr v-for="b in bookings" :key="b.id" class="border-b border-outline/10 last:border-0">
            <td class="px-5 py-3 font-price-display">#{{ b.id }}</td>
            <td class="px-5 py-3">{{ propertyName(b.property_id) }}</td>
            <td class="px-5 py-3 font-label-ledger text-xs text-outline">{{ b.check_in }} → {{ b.check_out }}</td>
            <td class="px-5 py-3">{{ b.guests_count }}</td>
            <td class="px-5 py-3 text-right font-price-display">₹{{ Number(b.total_amount).toLocaleString("en-IN") }}</td>
            <td class="px-5 py-3 text-right">
              <span class="px-2.5 py-1 rounded-sm font-label-ledger text-[11px] uppercase" :class="statusColor[b.status]">{{
                b.status.replace("_", " ")
              }}</span>
            </td>
            <td class="px-5 py-3 text-right whitespace-nowrap">
              <button
                v-if="b.status === 'pending_whatsapp'"
                :disabled="busyId === b.id"
                class="text-xs font-label-ledger uppercase text-secondary border border-outline/25 rounded-sm px-2.5 py-1.5 mr-1.5 hover:border-secondary disabled:opacity-40"
                @click="confirmBooking(b.id)"
              >
                Confirm
              </button>
              <button
                v-if="b.status === 'confirmed'"
                :disabled="busyId === b.id"
                class="text-xs font-label-ledger uppercase text-secondary border border-outline/25 rounded-sm px-2.5 py-1.5 mr-1.5 hover:border-secondary disabled:opacity-40"
                @click="refundBooking(b.id)"
              >
                Refund
              </button>
              <button
                v-if="['confirmed', 'pending_payment', 'pending_whatsapp'].includes(b.status)"
                :disabled="busyId === b.id"
                class="text-xs font-label-ledger uppercase text-error border border-error/40 rounded-sm px-2.5 py-1.5 disabled:opacity-40"
                @click="cancelBooking(b.id)"
              >
                Cancel
              </button>
            </td>
          </tr>
          <tr v-if="bookings?.length === 0">
            <td colspan="7" class="px-5 py-10 text-center text-on-surface-variant">No bookings match this filter.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
