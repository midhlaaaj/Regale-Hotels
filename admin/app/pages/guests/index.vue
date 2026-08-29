<script setup lang="ts">
import type { AdminBooking, Guest } from "~/types/api";

const { request } = useApi();
const { data: bookings, pending: bookingsPending } = useAsyncData<AdminBooking[]>(
  "guests-bookings",
  () => request<AdminBooking[]>("/api/admin/bookings"),
  { lazy: true }
);

const guests = ref<Guest[]>([]);
const loading = ref(true);

watch(
  bookingsPending,
  async (isPending) => {
    if (isPending) return;
    loading.value = true;
    const guestIds = [...new Set((bookings.value ?? []).map((b) => b.guest_id).filter((id): id is number => id != null))];
    const results = await Promise.all(
      guestIds.map((id) => request<Guest>(`/api/admin/guests/${id}`).catch(() => null))
    );
    guests.value = results.filter((g): g is Guest => g !== null);
    loading.value = false;
  },
  { immediate: true }
);

const expanded = ref<number | null>(null);
</script>

<template>
  <div>
    <h1 class="font-display-lg text-headline-md text-on-background mb-1.5">Guests</h1>
    <p class="text-body-md text-on-surface-variant mb-8">Everyone who has booked at your scoped properties.</p>

    <div v-if="loading" class="border border-outline/20 bg-white">
      <div v-for="i in 4" :key="i" class="border-b border-outline/10 last:border-0 px-5 py-4 flex justify-between items-center">
        <div>
          <Skeleton class="h-4 w-36 mb-2" />
          <Skeleton class="h-3 w-48" />
        </div>
        <Skeleton class="h-4 w-20" />
      </div>
    </div>
    <div v-else class="border border-outline/20 bg-white">
      <div v-for="g in guests" :key="g.id" class="border-b border-outline/10 last:border-0">
        <button
          class="w-full text-left flex flex-wrap gap-4 justify-between items-center px-5 py-4 hover:bg-surface-container-low"
          @click="expanded = expanded === g.id ? null : g.id"
        >
          <div>
            <p class="text-on-background font-label-ledger text-sm">{{ g.name }}</p>
            <p class="font-label-ledger text-xs text-outline">{{ g.email }} · {{ g.phone }}</p>
          </div>
          <span class="font-label-ledger text-xs uppercase text-outline">{{ g.bookings?.length ?? 0 }} bookings</span>
        </button>
        <div v-if="expanded === g.id" class="bg-surface-container-low px-5 py-4">
          <div v-for="b in g.bookings" :key="b.id" class="flex justify-between text-sm py-1.5">
            <span class="font-label-ledger text-xs text-outline">#{{ b.id }} · {{ b.check_in }} → {{ b.check_out }}</span>
            <span class="font-price-display">₹{{ Number(b.total_amount).toLocaleString("en-IN") }}</span>
          </div>
        </div>
      </div>
      <div v-if="guests.length === 0" class="px-5 py-10 text-center text-on-surface-variant">No guests yet.</div>
    </div>
  </div>
</template>
