<script setup lang="ts">
definePageMeta({ layout: "admin" });

import type { AdminBooking, BookingStatus, Property, RoomType } from "~/types/admin-api";

const { request } = useAdminApi();
const auth = useAdminAuthStore();

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

function extractErrorMessage(e: any, fallback: string): string {
  const detail = e?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length) return detail.map((d: any) => d.msg).join(" ");
  return fallback;
}

// ---------- Log a walk-in / phone booking ----------
const showManual = ref(false);
const manual = ref({
  property_id: null as number | null,
  room_type_id: null as number | null,
  rate_plan_id: null as number | null,
  check_in: "",
  check_out: "",
  guests_count: 2,
  guest: { name: "", email: "", phone: "" },
});
const manualError = ref("");
const savingManual = ref(false);

const availableProperties = computed(() => {
  if (auth.isSuperAdmin) return properties.value ?? [];
  return (properties.value ?? []).filter((p) => p.id === auth.propertyId);
});

const roomTypesForProperty = ref<RoomType[]>([]);
watch(
  () => manual.value.property_id,
  async (propertyId) => {
    manual.value.room_type_id = null;
    manual.value.rate_plan_id = null;
    roomTypesForProperty.value = [];
    if (!propertyId) return;
    const slug = properties.value?.find((p) => p.id === propertyId)?.slug;
    if (!slug) return;
    const detail = await request<Property & { room_types: RoomType[] }>(`/api/properties/${slug}`);
    roomTypesForProperty.value = detail.room_types;
  }
);

interface RatePlanOption { id: number; name: string; fixed_price: number }
const ratePlanOptions = ref<RatePlanOption[]>([]);
async function loadRatePlans() {
  manual.value.rate_plan_id = null;
  ratePlanOptions.value = [];
  const { room_type_id, check_in, check_out } = manual.value;
  if (!room_type_id || !check_in || !check_out || check_out <= check_in) return;
  try {
    const res = await request<{ rate_plans: RatePlanOption[] }>(
      `/api/room-types/${room_type_id}/availability?checkin=${check_in}&checkout=${check_out}`
    );
    ratePlanOptions.value = res.rate_plans;
  } catch {
    ratePlanOptions.value = [];
  }
}
watch(() => [manual.value.room_type_id, manual.value.check_in, manual.value.check_out], loadRatePlans);

function openManual() {
  showManual.value = true;
  manualError.value = "";
  manual.value = {
    property_id: auth.isSuperAdmin ? null : auth.propertyId,
    room_type_id: null,
    rate_plan_id: null,
    check_in: "",
    check_out: "",
    guests_count: 2,
    guest: { name: "", email: "", phone: "" },
  };
}

async function createManualBooking() {
  manualError.value = "";
  const m = manual.value;
  if (!m.property_id || !m.room_type_id || !m.rate_plan_id) {
    manualError.value = "Choose a property, room type, and rate plan.";
    return;
  }
  if (!m.check_in || !m.check_out) {
    manualError.value = "Choose check-in and check-out dates.";
    return;
  }
  if (!m.guest.name.trim() || !m.guest.email.trim() || !m.guest.phone.trim()) {
    manualError.value = "Guest name, email, and phone are required.";
    return;
  }
  savingManual.value = true;
  try {
    await request("/api/admin/bookings", {
      method: "POST",
      body: {
        property_id: m.property_id,
        room_type_id: m.room_type_id,
        rate_plan_id: m.rate_plan_id,
        check_in: m.check_in,
        check_out: m.check_out,
        guests_count: m.guests_count,
        guest: { name: m.guest.name.trim(), email: m.guest.email.trim(), phone: m.guest.phone.trim() },
      },
    });
    showManual.value = false;
    await refresh();
  } catch (e: any) {
    manualError.value = extractErrorMessage(e, "Could not create this booking.");
  } finally {
    savingManual.value = false;
  }
}

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
      <button
        class="bg-primary text-white border-none cursor-pointer px-5 py-2.5 rounded-sm font-label-ledger text-xs uppercase flex-shrink-0"
        @click="showManual ? (showManual = false) : openManual()"
      >
        {{ showManual ? "Cancel" : "+ Log walk-in booking" }}
      </button>
    </div>

    <div v-if="showManual" class="border border-outline/20 bg-white p-6 mb-8 max-w-[720px]">
      <h2 class="font-label-ledger text-xs tracking-[0.1em] uppercase text-outline mb-4">Log a walk-in / phone booking</h2>
      <p class="text-sm text-on-surface-variant mb-4">
        For reservations taken outside the site (front desk, phone). Payment is handled directly with the guest — this creates
        the booking already confirmed.
      </p>
      <div class="grid gap-4 sm:grid-cols-2 mb-4">
        <select v-model.number="manual.property_id" class="border-b border-secondary bg-transparent py-2" :disabled="!auth.isSuperAdmin">
          <option :value="null" disabled>Property</option>
          <option v-for="p in availableProperties" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
        <select v-model.number="manual.room_type_id" class="border-b border-secondary bg-transparent py-2" :disabled="!manual.property_id">
          <option :value="null" disabled>Room type</option>
          <option v-for="r in roomTypesForProperty" :key="r.id" :value="r.id">{{ r.name }}</option>
        </select>
        <div class="flex flex-col gap-1">
          <label class="text-[11px] uppercase text-outline">Check-in</label>
          <input v-model="manual.check_in" type="date" class="border-b border-secondary bg-transparent py-2" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-[11px] uppercase text-outline">Check-out</label>
          <input v-model="manual.check_out" type="date" class="border-b border-secondary bg-transparent py-2" />
        </div>
        <select v-model.number="manual.rate_plan_id" class="border-b border-secondary bg-transparent py-2" :disabled="ratePlanOptions.length === 0">
          <option :value="null" disabled>Rate plan</option>
          <option v-for="rp in ratePlanOptions" :key="rp.id" :value="rp.id">{{ rp.name }} — ₹{{ rp.fixed_price.toLocaleString("en-IN") }}/night</option>
        </select>
        <div class="flex items-center gap-2">
          <label class="font-label-ledger text-[11px] uppercase text-outline flex-shrink-0">Guests</label>
          <input v-model.number="manual.guests_count" type="number" min="1" max="20" class="border-b border-secondary bg-transparent py-2 w-full" />
        </div>
        <input v-model="manual.guest.name" placeholder="Guest name" maxlength="120" class="border-b border-secondary bg-transparent py-2" />
        <input v-model="manual.guest.email" type="email" placeholder="Guest email" maxlength="254" class="border-b border-secondary bg-transparent py-2" />
        <input v-model="manual.guest.phone" placeholder="Guest phone" maxlength="20" class="border-b border-secondary bg-transparent py-2" />
      </div>
      <button
        :disabled="savingManual"
        class="bg-primary text-white border-none cursor-pointer px-5 py-2.5 rounded-sm font-label-ledger text-xs uppercase disabled:opacity-50"
        @click="createManualBooking"
      >
        {{ savingManual ? "Creating…" : "Create booking" }}
      </button>
      <p v-if="manualError" class="text-error text-sm mt-3">{{ manualError }}</p>
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
            <td class="px-5 py-3 font-price-display">
              #{{ b.id }}
              <span v-if="b.source !== 'online'" class="block font-label-ledger text-[10px] uppercase text-outline">{{ b.source }}</span>
            </td>
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
