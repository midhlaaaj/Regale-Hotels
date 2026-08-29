<script setup lang="ts">
import type { Booking } from "~/types/api";

const route = useRoute();
const router = useRouter();
const { request } = useApi();
const bookingStore = useBookingStore();
const bookingId = route.params.id as string;

const paying = ref(false);
const error = ref("");
const hasContext = computed(() => !!bookingStore.guest.email);

function extractErrorMessage(e: any, fallback: string): string {
  const detail = e?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length) return detail.map((d: any) => d.msg).join(" ");
  return fallback;
}

async function payNow() {
  paying.value = true;
  error.value = "";
  try {
    await request<Booking>(`/api/bookings/${bookingId}/confirm-stub`, {
      method: "POST",
      body: { email: bookingStore.guest.email },
    });
    router.push(`/booking/confirmation/${bookingId}`);
  } catch (e: any) {
    error.value = extractErrorMessage(e, "Payment could not be confirmed. Please try again.");
  } finally {
    paying.value = false;
  }
}
</script>

<template>
  <div class="max-w-[1080px] mx-auto px-margin-mobile md:px-margin-desktop py-10 md:py-14">
    <div class="flex border-y border-outline/20 mb-10 overflow-x-auto">
      <div v-for="(s, i) in ['Dates & room', 'Details', 'Payment', 'Confirmed']" :key="s" class="flex-1 min-w-[132px] py-3.5 pr-3">
        <p class="font-label-ledger text-[11px] tracking-[0.14em] mb-1" :class="i <= 2 ? 'text-primary' : 'text-outline-variant'">
          {{ String(i + 1).padStart(2, "0") }}
        </p>
        <p class="font-label-ledger text-[13px]" :class="i === 2 ? 'text-on-background border-b-2 border-primary inline-block pb-0.5' : i < 2 ? 'text-secondary' : 'text-outline'">
          {{ i < 2 ? "✓ " : "" }}{{ s }}
        </p>
      </div>
    </div>

    <h1 class="font-display-lg text-[clamp(32px,5vw,44px)] leading-tight text-on-background mb-2.5">Settle the balance</h1>

    <template v-if="hasContext">
      <p class="text-[17px] text-on-surface-variant mb-9 max-w-[54ch]">
        This is a portfolio project — no real payment gateway is wired up yet. Click below to simulate a successful
        payment and confirm booking <span class="font-label-ledger text-on-background">#{{ bookingId }}</span>.
      </p>

      <div class="border border-outline/20 bg-white p-7 max-w-[480px]">
        <p class="font-label-ledger text-[11px] tracking-[0.14em] uppercase text-outline mb-4">Amount due</p>
        <p class="font-price-display text-[32px] text-on-background mb-6">₹{{ bookingStore.total.toLocaleString("en-IN") }}</p>
        <button
          :disabled="paying"
          class="w-full bg-primary text-on-primary border-none cursor-pointer py-4 rounded font-label-ledger text-[13px] tracking-[0.1em] uppercase hover:bg-primary-container transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          @click="payNow"
        >
          <span class="material-symbols-outlined text-[18px]">lock</span>
          {{ paying ? "Processing…" : "Simulate payment (stub)" }}
        </button>
        <p v-if="error" class="text-error text-sm mt-3">{{ error }}</p>
        <p class="text-[13px] text-outline mt-4 text-center">
          No card charged. This stands in for a real Razorpay checkout + webhook.
        </p>
      </div>
    </template>

    <div v-else class="border border-outline/20 bg-white p-7 max-w-[480px]">
      <p class="text-body-md text-on-surface-variant mb-4">
        We've lost track of this session (usually from a page refresh) and can't safely take payment without
        re-confirming who's booking. No charge has been made.
      </p>
      <NuxtLink
        to="/my-bookings"
        class="inline-block bg-primary text-on-primary px-5 py-3 rounded font-label-ledger text-xs uppercase tracking-wider hover:bg-primary-container transition-colors"
      >
        Look up booking #{{ bookingId }}
      </NuxtLink>
    </div>
  </div>
</template>
