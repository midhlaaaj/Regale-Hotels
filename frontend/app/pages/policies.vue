<script setup lang="ts">
useSeoMeta({ title: "Policies — Regale Hotels" });

const sections = [
  {
    title: "Cancellation",
    body: "Refundable rate plans can be cancelled free of charge up to 7 days before arrival; the first night is charged for cancellations inside that window. Non-refundable rate plans are non-refundable once confirmed, in exchange for a lower nightly price.",
  },
  {
    title: "Check-in / Check-out",
    body: "Check-in is from 14:00, check-out by 11:00. Early check-in and late check-out are offered where availability allows — ask your host on WhatsApp.",
  },
  {
    title: "WhatsApp holds",
    body: "A WhatsApp inquiry holds a room for 12 hours while you settle payment details directly with the property. If payment isn't arranged within that window, the hold is released.",
  },
  {
    title: "Privacy",
    body: "We collect only what's needed to run your booking: name, email, phone, and stay details. Payment card data is handled entirely by our payment gateway and never touches Regale's own systems.",
  },
  {
    title: "Terms of service",
    body: "By booking with Regale Hotels you agree to the rate plan's cancellation terms shown at checkout, and to provide accurate guest details for check-in.",
  },
];
</script>

<template>
  <div class="max-w-[820px] mx-auto px-margin-mobile md:px-margin-desktop pt-8 md:pt-14 pb-24">
    <p class="font-label-ledger text-xs tracking-[0.16em] uppercase mb-3" style="color: #c5a059">Reference</p>
    <h1 class="font-display-lg text-[clamp(36px,6vw,52px)] leading-tight text-on-background mb-10">Policies</h1>

    <div v-for="s in sections" :key="s.title" class="border-t border-outline/20 py-8">
      <h2 class="font-display-lg text-headline-sm text-on-background mb-3">{{ s.title }}</h2>
      <p class="text-body-md text-on-surface-variant">{{ s.body }}</p>
    </div>
  </div>
</template>
