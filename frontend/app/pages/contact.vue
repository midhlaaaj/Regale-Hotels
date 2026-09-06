<script setup lang="ts">
import type { Property } from "~/types/api";

useSeoMeta({ title: "Locations — Regale Hotels", description: "Contact details for all four Regale properties." });

const { link: whatsappLink } = useWhatsapp();
const { request } = useApi();
const { data: properties } = useAsyncData<Property[]>("contact-properties", () => request<Property[]>("/api/properties"), {
  lazy: true,
});

const locations = [
  { slug: "alleppey-ledger", region: "Kerala · Backwaters", name: "The Alleppey Ledger", address: "Ledger House, North Canal Road, Punnamada, Alappuzha 688006, Kerala", phone: "+91 477 224 1180", email: "alleppey@regale.in", hostLine: "Host: Sanjay Varma · 09:00–21:00 IST", coords: "9.4981° N, 76.3388° E" },
  { slug: "munnar-estate", region: "Kerala · High Range", name: "Munnar Estate", address: "Bungalow 4, Kannan Devan Hills, Pallivasal, Munnar 685612, Kerala", phone: "+91 4865 263 447", email: "munnar@regale.in", hostLine: "Host: Leela Thomas · 08:00–20:00 IST", coords: "10.0889° N, 77.0595° E" },
  { slug: "mattancherry-manor", region: "Kerala · Fort Kochi", name: "Mattancherry Manor", address: "12 Bazaar Road, Mattancherry, Kochi 682002, Kerala", phone: "+91 484 221 5590", email: "kochi@regale.in", hostLine: "Host: Ravi Menon · 24 hours", coords: "9.9585° N, 76.2588° E" },
  { slug: "varkala-cliff-villa", region: "Kerala · Cliffside", name: "Varkala Cliff Villa", address: "North Cliff Road, Varkala 695141, Kerala", phone: "+91 470 260 3312", email: "varkala@regale.in", hostLine: "Host: Meera Pillai · 09:00–22:00 IST", coords: "8.7379° N, 76.7163° E" },
];

function propertyFor(slug: string) {
  return properties.value?.find((p) => p.slug === slug);
}
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
          <NuxtLink
            v-if="propertyFor(l.slug)"
            :to="`/properties/${l.slug}`"
            class="bg-primary text-on-primary cursor-pointer px-5 py-3 rounded font-label-ledger text-[11px] tracking-[0.08em] uppercase inline-flex items-center"
          >
            Book Now
          </NuxtLink>
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
      <NuxtLink
        v-if="propertyFor(l.slug)"
        :to="`/properties/${l.slug}`"
        class="group relative min-h-[240px] block overflow-hidden border border-outline/20"
      >
        <img
          :src="propertyFor(l.slug)!.cover_image_url"
          :alt="l.name"
          loading="lazy"
          class="w-full h-full min-h-[240px] object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-on-background/70 via-transparent to-transparent" />
        <p class="absolute bottom-3 left-4 font-label-ledger text-[11px] text-surface-bright">{{ l.coords }}</p>
      </NuxtLink>
      <div
        v-else
        class="border border-outline/20 min-h-[240px] flex flex-col items-center justify-center gap-1.5"
        style="background: repeating-linear-gradient(135deg, #f0eee9 0px, #f0eee9 9px, #e8e5dd 9px, #e8e5dd 18px)"
      >
        <span class="material-symbols-outlined text-2xl text-secondary">map</span>
        <p class="font-label-ledger text-xs tracking-[0.1em] uppercase text-on-surface-variant">Loading…</p>
        <p class="font-label-ledger text-[11px] text-outline">{{ l.coords }}</p>
      </div>
    </div>
  </div>
</template>
