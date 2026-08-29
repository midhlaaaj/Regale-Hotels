<script setup lang="ts">
const route = useRoute();
const bookingStore = useBookingStore();
const bookingId = route.params.id as string;
const { link: whatsappLink } = useWhatsapp();

// The booking flow's Pinia state only survives within the flow itself — a
// refresh, bookmark, or shared link lands here with an empty store. Degrade
// gracefully instead of showing blank/undefined fields in that case.
const hasContext = computed(() => !!bookingStore.roomType);
const isWhatsapp = computed(() => bookingStore.paymentMethod === "whatsapp");

const whatsappMessage = computed(() => {
  if (!hasContext.value) return "";
  return `Hi! I'd like to hold ${bookingStore.roomType!.name} at ${bookingStore.propertyName} for ${bookingStore.checkIn} to ${bookingStore.checkOut}. Booking ref: ${bookingId}.`;
});
</script>

<template>
  <div class="max-w-[820px] mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-20">
    <div class="text-center mb-11">
      <span class="material-symbols-outlined text-4xl text-secondary">verified</span>
      <h1 class="font-display-lg text-[clamp(34px,5.5vw,52px)] leading-tight text-on-background mt-3.5 mb-3">
        <template v-if="!hasContext">Booking recorded</template>
        <template v-else-if="isWhatsapp">We've received your inquiry</template>
        <template v-else>Your stay is confirmed</template>
      </h1>
      <p class="text-[17px] leading-[27px] text-on-surface-variant max-w-[46ch] mx-auto">
        <template v-if="!hasContext">
          Booking reference #{{ bookingId }} has been recorded. Look it up any time from My Bookings with the
          email you booked with.
        </template>
        <template v-else-if="isWhatsapp">
          Send us the pre-filled WhatsApp message below and our on-site team will confirm within 12 hours.
        </template>
        <template v-else>A confirmation has been recorded. Your host will be in touch before you arrive.</template>
      </p>
    </div>

    <div class="border border-outline/25 bg-white shadow-[4px_4px_0px_rgba(27,48,34,0.05)]">
      <div class="border-b border-outline/25 px-6 md:px-8 py-6 flex flex-wrap gap-4 justify-between items-center bg-surface-container-low">
        <div>
          <p class="font-label-ledger text-[11px] tracking-[0.14em] uppercase text-outline mb-1.5">Booking reference</p>
          <p class="font-price-display text-[clamp(22px,4vw,28px)] font-bold tracking-[0.08em] text-primary">#{{ bookingId }}</p>
        </div>
        <div v-if="hasContext" class="text-right">
          <p class="font-label-ledger text-[11px] tracking-[0.14em] uppercase text-outline mb-1.5">Status</p>
          <span
            class="inline-block px-3 py-1.5 rounded-sm font-label-ledger text-xs tracking-[0.06em] uppercase"
            :class="isWhatsapp ? 'bg-[#F2E8D5] text-[#1B3022]' : 'bg-secondary-container text-[#1B3022]'"
          >
            {{ isWhatsapp ? "Pending WhatsApp" : "Confirmed" }}
          </span>
        </div>
      </div>
      <div class="p-6 md:p-8" v-if="hasContext">
        <div class="flex justify-between gap-5 py-3.5 border-b border-outline/10">
          <span class="font-label-ledger text-xs tracking-[0.1em] uppercase text-outline">Property</span>
          <span class="text-sm text-on-background text-right">{{ bookingStore.propertyName }}</span>
        </div>
        <div class="flex justify-between gap-5 py-3.5 border-b border-outline/10">
          <span class="font-label-ledger text-xs tracking-[0.1em] uppercase text-outline">Room</span>
          <span class="text-sm text-on-background text-right">{{ bookingStore.roomType!.name }}</span>
        </div>
        <div class="flex justify-between gap-5 py-3.5 border-b border-outline/10">
          <span class="font-label-ledger text-xs tracking-[0.1em] uppercase text-outline">Dates</span>
          <span class="text-sm text-on-background text-right">{{ bookingStore.checkIn }} → {{ bookingStore.checkOut }}</span>
        </div>
        <div class="flex justify-between gap-5 py-3.5 border-b border-outline/10">
          <span class="font-label-ledger text-xs tracking-[0.1em] uppercase text-outline">Guests</span>
          <span class="text-sm text-on-background text-right">{{ bookingStore.guestsCount }}</span>
        </div>
        <div class="flex justify-between gap-5 pt-5">
          <span class="font-label-ledger text-sm tracking-[0.1em] uppercase text-on-background font-bold">{{
            isWhatsapp ? "Estimated total" : "Paid"
          }}</span>
          <span class="font-price-display text-xl font-bold text-on-background">₹{{ bookingStore.total.toLocaleString("en-IN") }}</span>
        </div>
      </div>
      <div v-else class="p-6 md:p-8 text-center text-on-surface-variant text-sm">
        Full details aren't shown here after a page refresh — use My Bookings below to look this booking up again.
      </div>
    </div>

    <a
      v-if="hasContext && isWhatsapp"
      :href="whatsappLink(whatsappMessage)"
      target="_blank"
      rel="noopener noreferrer"
      class="mt-6 w-full flex items-center justify-center gap-2 bg-whatsapp text-white border-none cursor-pointer py-3.5 rounded font-label-ledger text-xs tracking-[0.08em] uppercase hover:opacity-90 transition-opacity"
    >
      <span class="material-symbols-outlined text-[18px]" aria-hidden="true">forum</span>Send WhatsApp message
    </a>

    <div class="grid gap-3 mt-3" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr))">
      <NuxtLink
        to="/my-bookings"
        class="bg-primary border-none text-white text-center cursor-pointer py-3.5 rounded font-label-ledger text-xs tracking-[0.08em] uppercase hover:bg-primary-container transition-colors"
      >
        View my bookings
      </NuxtLink>
      <NuxtLink
        to="/"
        class="bg-transparent border text-[#1B3022] text-center cursor-pointer py-3.5 rounded font-label-ledger text-xs tracking-[0.08em] uppercase hover:bg-brass-tint transition-colors"
        style="border-color: #c5a059"
      >
        Back to home
      </NuxtLink>
    </div>
  </div>
</template>
