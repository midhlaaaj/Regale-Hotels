<script setup lang="ts">
import type { Booking, BookingCreatePayload } from "~/types/api";

const bookingStore = useBookingStore();
const router = useRouter();
const { request } = useApi();

if (!bookingStore.roomType || !bookingStore.ratePlan) {
  router.replace("/properties");
}

const acct = ref(false);
const submitting = ref(false);
const errorMsg = ref("");

const nights = computed(() => bookingStore.nights);
const total = computed(() => bookingStore.total);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9 \-()]{7,20}$/;

// Mirrors the backend's Pydantic validation (schemas/public.py) so obviously
// bad input is caught before a round trip — the backend remains the real check.
function validateGuest(): string | null {
  const g = bookingStore.guest;
  if (!g.name.trim()) return "Please enter your name.";
  if (!EMAIL_RE.test(g.email.trim())) return "Please enter a valid email address.";
  if (!PHONE_RE.test(g.phone.trim())) return "Please enter a valid phone number.";
  return null;
}

/** Extracts a human-readable message from a FastAPI error response — `detail`
 * is a string for HTTPException but a list of Pydantic validation errors for 422s. */
function extractErrorMessage(e: any, fallback: string): string {
  const detail = e?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length) {
    return detail.map((d: any) => d.msg).join(" ");
  }
  return fallback;
}

async function submit() {
  if (!bookingStore.propertyId || !bookingStore.roomType || !bookingStore.ratePlan || !bookingStore.paymentMethod) return;
  bookingStore.guest.name = bookingStore.guest.name.trim();
  bookingStore.guest.email = bookingStore.guest.email.trim();
  bookingStore.guest.phone = bookingStore.guest.phone.trim();
  const validationError = validateGuest();
  if (validationError) {
    errorMsg.value = validationError;
    return;
  }
  submitting.value = true;
  errorMsg.value = "";
  try {
    const payload: BookingCreatePayload = {
      property_id: bookingStore.propertyId,
      room_type_id: bookingStore.roomType.id,
      rate_plan_id: bookingStore.ratePlan.id,
      check_in: bookingStore.checkIn!,
      check_out: bookingStore.checkOut!,
      guests_count: bookingStore.guestsCount,
      payment_method: bookingStore.paymentMethod,
      guest: bookingStore.guest,
    };
    const booking = await request<Booking>("/api/bookings", { method: "POST", body: payload });
    bookingStore.result = booking;
    if (bookingStore.paymentMethod === "online") {
      router.push(`/booking/payment/${booking.id}`);
    } else {
      // The WhatsApp handoff happens as a real click on the confirmation page —
      // opening it here would be silently blocked by popup blockers, since this
      // runs after an `await` and is no longer inside the click's user-gesture context.
      router.push(`/booking/confirmation/${booking.id}`);
    }
  } catch (e: any) {
    errorMsg.value = extractErrorMessage(e, "Something went wrong creating the booking. Please try again.");
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div v-if="bookingStore.roomType && bookingStore.ratePlan" class="max-w-[1080px] mx-auto px-margin-mobile md:px-margin-desktop py-10 md:py-14">
    <div class="flex border-y border-outline/20 mb-10 overflow-x-auto">
      <div v-for="(s, i) in ['Dates & room', 'Details', 'Payment', 'Confirmed']" :key="s" class="flex-1 min-w-[132px] py-3.5 pr-3">
        <p
          class="font-label-ledger text-[11px] tracking-[0.14em] mb-1"
          :class="i <= 1 ? 'text-primary' : 'text-outline-variant'"
        >
          {{ String(i + 1).padStart(2, "0") }}
        </p>
        <p
          class="font-label-ledger text-[13px]"
          :class="i === 1 ? 'text-on-background border-b-2 border-primary inline-block pb-0.5' : i < 1 ? 'text-secondary' : 'text-outline'"
        >
          {{ i < 1 ? "✓ " : "" }}{{ s }}
        </p>
      </div>
    </div>

    <h1 class="font-display-lg text-[clamp(32px,5vw,44px)] leading-tight text-on-background mb-2.5">Who is staying?</h1>
    <p class="text-[17px] text-on-surface-variant mb-9 max-w-[54ch]">
      No account needed. We use these details for your arrival and your invoice only.
    </p>

    <div class="grid gap-8 md:gap-12 items-start" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))">
      <div class="border border-outline/20 bg-white p-6 md:p-8">
        <div class="grid gap-7" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))">
          <div class="flex flex-col gap-1.5">
            <label class="font-label-ledger text-[11px] tracking-[0.14em] uppercase text-secondary">Full name</label>
            <input v-model="bookingStore.guest.name" placeholder="As on your ID" maxlength="120" class="ledger-line bg-transparent py-2 text-body-md" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="font-label-ledger text-[11px] tracking-[0.14em] uppercase text-secondary">Email</label>
            <input v-model="bookingStore.guest.email" type="email" placeholder="you@example.com" class="ledger-line bg-transparent py-2 text-body-md" />
            <span class="text-[13px] text-outline">Your confirmation goes here.</span>
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="font-label-ledger text-[11px] tracking-[0.14em] uppercase text-secondary">Phone</label>
            <input
              v-model="bookingStore.guest.phone"
              type="tel"
              placeholder="+91 98765 43210"
              maxlength="20"
              class="ledger-line bg-transparent py-2 text-body-md"
            />
            <span class="text-[13px] text-outline">For arrival coordination on WhatsApp.</span>
          </div>
        </div>

        <div class="border-t border-outline/20 mt-8 pt-5 flex gap-3 items-start">
          <button
            class="w-5 h-5 flex-shrink-0 mt-0.5 cursor-pointer rounded-sm p-0 flex items-center justify-center bg-transparent border border-outline"
            @click="acct = !acct"
          >
            <span v-if="acct" class="block w-5 h-5 -m-px bg-primary text-white text-[13px] leading-5 text-center rounded-sm">✓</span>
          </button>
          <div>
            <p class="text-[15px] text-on-background mb-0.5">Create an account to see this booking later</p>
            <p class="text-[13px] text-outline">We'll email a set-password link after your stay is confirmed. Optional.</p>
          </div>
        </div>
        <p v-if="errorMsg" class="text-error text-sm mt-5">{{ errorMsg }}</p>
      </div>

      <div class="border border-outline/20 bg-surface-container-low p-6 sticky top-[130px]">
        <p class="font-label-ledger text-[11px] tracking-[0.14em] uppercase text-outline mb-4">Price ledger</p>
        <div class="flex flex-col gap-2.5 border-b border-outline/25 pb-4">
          <div class="flex justify-between gap-2.5 font-label-ledger text-[13px] text-on-surface-variant">
            <span>{{ bookingStore.roomType.name }}</span><span class="text-on-background">{{ bookingStore.propertyName }}</span>
          </div>
          <div class="flex justify-between gap-2.5 font-label-ledger text-[13px] text-on-surface-variant">
            <span>{{ nights }} nights</span><span class="text-on-background">₹{{ bookingStore.ratePlan.fixed_price.toLocaleString("en-IN") }} / night</span>
          </div>
          <div class="flex justify-between gap-2.5 font-label-ledger text-[13px] text-on-surface-variant">
            <span>Rate plan</span><span class="text-on-background">{{ bookingStore.ratePlan.name }}</span>
          </div>
        </div>
        <div class="flex justify-between pt-4 font-label-ledger text-lg font-bold text-on-background">
          <span>TOTAL</span><span>₹{{ total.toLocaleString("en-IN") }}</span>
        </div>
        <button
          :disabled="submitting"
          class="w-full mt-6 bg-primary text-on-primary border-none cursor-pointer py-4 rounded font-label-ledger text-[13px] tracking-[0.1em] uppercase hover:bg-primary-container transition-colors disabled:opacity-50"
          @click="submit"
        >
          {{ submitting ? "Confirming…" : bookingStore.paymentMethod === "online" ? "Continue to payment" : "Continue to WhatsApp" }}
        </button>
        <button class="w-full mt-2.5 bg-transparent text-secondary border-none cursor-pointer py-2 font-label-ledger text-xs tracking-[0.08em] uppercase" @click="router.back()">
          ← Back
        </button>
      </div>
    </div>
  </div>
</template>
