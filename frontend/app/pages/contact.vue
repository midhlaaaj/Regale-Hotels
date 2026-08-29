<script setup lang="ts">
useSeoMeta({ title: "Locations — Regale Hotels", description: "Contact details for all four Regale properties." });

const { link: whatsappLink } = useWhatsapp();

const locations = [
  { region: "Kerala · Backwaters", name: "The Alleppey Ledger", address: "Ledger House, North Canal Road, Punnamada, Alappuzha 688006, Kerala", phone: "+91 477 224 1180", email: "alleppey@regale.in", hostLine: "Host: Sanjay Varma · 09:00–21:00 IST", coords: "9.4981° N, 76.3388° E" },
  { region: "Kerala · High Range", name: "Munnar Estate", address: "Bungalow 4, Kannan Devan Hills, Pallivasal, Munnar 685612, Kerala", phone: "+91 4865 263 447", email: "munnar@regale.in", hostLine: "Host: Leela Thomas · 08:00–20:00 IST", coords: "10.0889° N, 77.0595° E" },
  { region: "North India · Delhi", name: "Lutyens' Haven", address: "11 Sunder Nagar Lane, Nizamuddin East, New Delhi 110003", phone: "+91 11 4356 9020", email: "delhi@regale.in", hostLine: "Host: Imran Qureshi · 24 hours", coords: "28.5936° N, 77.2495° E" },
  { region: "Goa · North", name: "Assagao Villa", address: "House 218, Bouta Vaddo, Assagao, Bardez, Goa 403507", phone: "+91 832 227 6611", email: "goa@regale.in", hostLine: "Host: Maria Fernandes · 09:00–22:00 IST", coords: "15.6011° N, 73.7900° E" },
];
</script>

<template>
  <div class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-8 md:pt-14 pb-24">
    <p class="font-label-ledger text-xs tracking-[0.16em] uppercase mb-3" style="color: #c5a059">Reservations · 09:00–21:00 IST</p>
    <h1 class="font-display-lg text-[clamp(38px,6.5vw,64px)] leading-tight text-on-background mb-4">Find us</h1>
    <p class="text-body-lg text-on-surface-variant max-w-[56ch] mb-12">
      Each property answers its own phone and its own WhatsApp. There is no central call centre — you speak to the
      house you are staying in.
    </p>

    <div v-for="l in locations" :key="l.name" class="border-t border-outline/20 py-9 grid gap-8 items-start" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))">
      <div>
        <p class="font-label-ledger text-[11px] tracking-[0.14em] uppercase mb-2.5" style="color: #c5a059">{{ l.region }}</p>
        <h2 class="font-display-lg text-headline-md text-on-background mb-3.5">{{ l.name }}</h2>
        <p class="text-body-md text-on-surface-variant mb-5 max-w-[34ch]">{{ l.address }}</p>
        <div class="flex flex-col gap-2.5 border-t border-outline/15 pt-4">
          <a :href="`tel:${l.phone.replace(/[^+\d]/g, '')}`" class="font-label-ledger text-[13px] text-on-background hover:text-primary transition-colors w-fit">{{
            l.phone
          }}</a>
          <a :href="`mailto:${l.email}`" class="font-label-ledger text-[13px] text-on-background hover:text-primary transition-colors w-fit">{{
            l.email
          }}</a>
          <p class="font-label-ledger text-xs text-outline">{{ l.hostLine }}</p>
        </div>
        <div class="flex flex-wrap gap-2.5 mt-5">
          <a
            :href="whatsappLink(`Hi, I have a question about ${l.name}`)"
            target="_blank"
            rel="noopener noreferrer"
            class="bg-brass-tint text-[#1B3022] cursor-pointer px-5 py-3 rounded font-label-ledger text-[11px] tracking-[0.08em] uppercase inline-flex items-center gap-1.5"
            style="border: 1px solid #c5a059"
          >
            <span class="material-symbols-outlined text-[17px]">forum</span>WhatsApp
          </a>
          <a
            :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.address)}`"
            target="_blank"
            rel="noopener noreferrer"
            class="bg-transparent text-[#1B3022] border border-outline/30 cursor-pointer px-5 py-3 rounded font-label-ledger text-[11px] tracking-[0.08em] uppercase"
          >
            Directions
          </a>
        </div>
      </div>
      <div
        class="border border-outline/20 min-h-[240px] flex flex-col items-center justify-center gap-1.5"
        style="background: repeating-linear-gradient(135deg, #f0eee9 0px, #f0eee9 9px, #e8e5dd 9px, #e8e5dd 18px)"
      >
        <span class="material-symbols-outlined text-2xl text-secondary">map</span>
        <p class="font-label-ledger text-xs tracking-[0.1em] uppercase text-on-surface-variant">Map embed</p>
        <p class="font-label-ledger text-[11px] text-outline">{{ l.coords }}</p>
      </div>
    </div>
  </div>
</template>
