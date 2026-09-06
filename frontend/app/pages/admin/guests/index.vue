<script setup lang="ts">
definePageMeta({ layout: "admin" });

import type { AdminBooking, Guest } from "~/types/admin-api";

const { request } = useAdminApi();
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
const verifyBusy = ref<number | null>(null);
const verifyNote = ref<Record<number, string>>({});

const statusColor: Record<string, string> = {
  unverified: "bg-surface-container-highest text-on-surface-variant",
  pending: "bg-brass-tint text-secondary",
  verified: "bg-secondary-container text-ink-green",
  rejected: "bg-error/10 text-error",
};

async function verifyGuest(g: Guest, status: "verified" | "rejected") {
  verifyBusy.value = g.id;
  try {
    const updated = await request<Guest>(`/api/admin/guests/${g.id}/verify`, {
      method: "PATCH",
      body: { status, note: verifyNote.value[g.id]?.trim() || undefined },
    });
    const idx = guests.value.findIndex((x) => x.id === g.id);
    if (idx !== -1) guests.value[idx] = { ...guests.value[idx], ...updated };
  } finally {
    verifyBusy.value = null;
  }
}
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
          <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 rounded-sm font-label-ledger text-[11px] uppercase" :class="statusColor[g.verification_status]">
              {{ g.verification_status }}
            </span>
            <span class="font-label-ledger text-xs uppercase text-outline">{{ g.bookings?.length ?? 0 }} bookings</span>
          </div>
        </button>
        <div v-if="expanded === g.id" class="bg-surface-container-low px-5 py-4">
          <div v-for="b in g.bookings" :key="b.id" class="flex justify-between text-sm py-1.5">
            <span class="font-label-ledger text-xs text-outline">#{{ b.id }} · {{ b.check_in }} → {{ b.check_out }}</span>
            <span class="font-price-display">₹{{ Number(b.total_amount).toLocaleString("en-IN") }}</span>
          </div>

          <div class="border-t border-outline/10 mt-3 pt-4">
            <p class="font-label-ledger text-[11px] uppercase text-outline mb-2">ID verification</p>
            <a
              v-if="g.id_document_url"
              :href="g.id_document_url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-xs font-label-ledger uppercase text-secondary underline block mb-2"
            >
              View submitted document
            </a>
            <p v-else class="text-xs text-outline mb-2">No document submitted yet.</p>
            <p v-if="g.verification_note" class="text-sm text-on-surface-variant mb-2">Note: {{ g.verification_note }}</p>

            <div v-if="g.verification_status !== 'verified'" class="flex flex-wrap gap-2 items-center mt-2">
              <input
                v-model="verifyNote[g.id]"
                placeholder="Note (optional)"
                maxlength="500"
                class="border-b border-secondary bg-transparent py-1.5 text-sm flex-1 min-w-[160px]"
              />
              <button
                :disabled="verifyBusy === g.id"
                class="text-xs font-label-ledger uppercase text-white bg-secondary border-none rounded-sm px-3 py-1.5 disabled:opacity-40"
                @click="verifyGuest(g, 'verified')"
              >
                Approve
              </button>
              <button
                v-if="g.verification_status !== 'rejected'"
                :disabled="verifyBusy === g.id"
                class="text-xs font-label-ledger uppercase text-error border border-error/40 rounded-sm px-3 py-1.5 disabled:opacity-40"
                @click="verifyGuest(g, 'rejected')"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="guests.length === 0" class="px-5 py-10 text-center text-on-surface-variant">No guests yet.</div>
    </div>
  </div>
</template>
