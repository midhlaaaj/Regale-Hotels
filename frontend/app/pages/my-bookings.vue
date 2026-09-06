<script setup lang="ts">
import type { Booking } from "~/types/api";

useSeoMeta({ title: "My Bookings — Regale Hotels" });

const { request } = useApi();
const guestAuth = useGuestAuthStore();

const myBookings = ref<Booking[]>([]);
const myBookingsLoading = ref(false);
const myBookingsError = ref("");

async function loadMyBookings() {
  myBookingsLoading.value = true;
  myBookingsError.value = "";
  try {
    myBookings.value = await request<Booking[]>("/api/bookings/me");
  } catch {
    myBookingsError.value = "Could not load your bookings. Please try again.";
  } finally {
    myBookingsLoading.value = false;
  }
}

watch(
  () => guestAuth.isLoggedIn,
  (loggedIn) => {
    if (loggedIn) loadMyBookings();
  },
  { immediate: true }
);

const bookingId = ref("");
const email = ref("");
const result = ref<Booking | null>(null);
const error = ref("");
const loading = ref(false);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const cancelling = ref(false);
const cancelError = ref("");

const CANCELLABLE = ["pending_payment", "confirmed", "pending_whatsapp"];
const canCancel = computed(
  () => !!result.value && CANCELLABLE.includes(result.value.status) && new Date(result.value.check_in) > new Date(new Date().toDateString())
);

async function cancelBooking() {
  if (!result.value) return;
  cancelError.value = "";
  cancelling.value = true;
  try {
    result.value = await request<Booking>(`/api/bookings/${result.value.id}/cancel`, {
      method: "PATCH",
      body: { email: email.value.trim() },
    });
  } catch {
    cancelError.value = "Could not cancel this booking. Please try again.";
  } finally {
    cancelling.value = false;
  }
}

async function lookup() {
  error.value = "";
  result.value = null;
  if (!bookingId.value || !/^\d+$/.test(bookingId.value.trim()) || !EMAIL_RE.test(email.value.trim())) {
    error.value = "Enter a valid booking reference and email.";
    return;
  }
  loading.value = true;
  try {
    result.value = await request<Booking>(`/api/bookings/${bookingId.value}?email=${encodeURIComponent(email.value)}`);
  } catch {
    error.value = "We couldn't find a booking with that reference and email.";
  } finally {
    loading.value = false;
  }
}

const statusLabel: Record<string, string> = {
  pending_payment: "Awaiting payment",
  confirmed: "Confirmed",
  pending_whatsapp: "Pending WhatsApp",
  cancelled: "Cancelled",
  refunded: "Refunded",
};
</script>

<template>
  <div class="max-w-[1080px] mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-16">
    <p class="font-label-ledger text-xs tracking-[0.16em] uppercase mb-3" style="color: #c5a059">Guests</p>
    <h1 class="font-display-lg text-[clamp(36px,6vw,56px)] leading-tight text-on-background mb-8">My bookings</h1>

    <div v-if="guestAuth.isLoggedIn" class="mb-14">
      <div v-if="myBookingsLoading" class="border border-outline/20 bg-white max-w-[720px] p-6">
        <Skeleton class="h-6 w-24 mb-6" />
        <Skeleton class="h-4 w-full mb-3" />
        <Skeleton class="h-4 w-2/3" />
      </div>
      <p v-else-if="myBookingsError" class="text-error text-sm">{{ myBookingsError }}</p>
      <p v-else-if="!myBookings.length" class="text-body-md text-on-surface-variant">You don't have any bookings yet.</p>
      <div v-else class="grid gap-4 max-w-[720px]">
        <div v-for="b in myBookings" :key="b.id" class="border border-outline/20 bg-white p-5 flex justify-between items-center">
          <div>
            <p class="font-price-display text-lg text-primary mb-1">#{{ b.id }}</p>
            <p class="text-sm text-on-surface-variant">{{ b.check_in }} → {{ b.check_out }} · {{ b.guests_count }} guests</p>
          </div>
          <div class="text-right">
            <span class="px-3 py-1.5 rounded-sm font-label-ledger text-xs uppercase bg-brass-tint text-secondary block mb-1.5">{{
              statusLabel[b.status]
            }}</span>
            <p class="font-label-ledger text-sm text-on-background">₹{{ b.total_amount.toLocaleString("en-IN") }}</p>
          </div>
        </div>
      </div>
    </div>

    <p class="text-body-md text-on-surface-variant max-w-[54ch] mb-10">
      Booked without an account? Look up that booking with its reference number and the email you booked with.
    </p>

    <div class="border border-outline/20 bg-white p-6 md:p-8 max-w-[560px] mb-10">
      <div class="grid gap-6 sm:grid-cols-2">
        <div class="flex flex-col gap-1.5">
          <label class="font-label-ledger text-[11px] tracking-[0.14em] uppercase text-secondary">Booking reference</label>
          <input
            v-model="bookingId"
            type="number"
            min="1"
            inputmode="numeric"
            placeholder="e.g. 4"
            class="ledger-line bg-transparent py-2 text-body-md"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="font-label-ledger text-[11px] tracking-[0.14em] uppercase text-secondary">Email</label>
          <input v-model="email" type="email" placeholder="you@example.com" class="ledger-line bg-transparent py-2 text-body-md" />
        </div>
      </div>
      <button
        :disabled="loading"
        class="mt-6 bg-primary text-on-primary border-none cursor-pointer px-7 py-3 rounded font-label-ledger text-xs tracking-[0.1em] uppercase hover:bg-primary-container transition-colors disabled:opacity-50"
        @click="lookup"
      >
        {{ loading ? "Looking up…" : "Find my booking" }}
      </button>
      <p v-if="error" class="text-error text-sm mt-4">{{ error }}</p>
    </div>

    <div v-if="loading" class="border border-outline/20 bg-white max-w-[560px] p-6">
      <Skeleton class="h-6 w-24 mb-6" />
      <Skeleton class="h-4 w-full mb-3" />
      <Skeleton class="h-4 w-2/3 mb-3" />
      <Skeleton class="h-6 w-1/3 mt-4" />
    </div>
    <div v-else-if="result" class="border border-outline/20 bg-white max-w-[560px]">
      <div class="border-b border-outline/20 px-6 py-5 flex justify-between items-center bg-surface-container-low">
        <span class="font-price-display text-xl text-primary">#{{ result.id }}</span>
        <span class="px-3 py-1.5 rounded-sm font-label-ledger text-xs uppercase bg-brass-tint text-secondary">{{
          statusLabel[result.status]
        }}</span>
      </div>
      <div class="p-6">
        <div class="flex justify-between py-2.5 border-b border-outline/10 text-sm">
          <span class="text-outline font-label-ledger text-xs uppercase">Dates</span>
          <span class="text-on-background">{{ result.check_in }} → {{ result.check_out }}</span>
        </div>
        <div class="flex justify-between py-2.5 border-b border-outline/10 text-sm">
          <span class="text-outline font-label-ledger text-xs uppercase">Guests</span>
          <span class="text-on-background">{{ result.guests_count }}</span>
        </div>
        <div class="flex justify-between pt-4 font-label-ledger text-lg font-bold text-on-background">
          <span>TOTAL</span><span>₹{{ result.total_amount.toLocaleString("en-IN") }}</span>
        </div>
        <button
          v-if="canCancel"
          :disabled="cancelling"
          class="w-full mt-6 bg-transparent text-error border border-error/40 cursor-pointer py-3 rounded font-label-ledger text-xs tracking-[0.1em] uppercase disabled:opacity-50"
          @click="cancelBooking"
        >
          {{ cancelling ? "Cancelling…" : "Cancel this booking" }}
        </button>
        <p v-if="cancelError" class="text-error text-sm mt-3">{{ cancelError }}</p>
      </div>
    </div>
  </div>
</template>
