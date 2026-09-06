<script setup lang="ts">
import type { Property } from "~/types/api";

interface AboutContent {
  headline?: string;
  intro?: string;
  story?: string;
  values?: { title: string; body: string }[];
}

const DEFAULTS: Required<AboutContent> = {
  headline: "Four houses, one ledger",
  intro:
    "Regale began with a single restoration — a spice merchant's home on Lake Vembanad, saved from demolition and reopened as a nine-room house. What we learned there, about patience with old buildings and about letting a place keep its own character, shaped every property since.",
  story:
    "Each of our four houses is restored rather than built, staffed by people from the town it sits in, and run with the same conviction: a hotel should feel like being let into somewhere real, not checked into somewhere generic.",
  values: [
    {
      title: "Restoration, not construction",
      body: "Every Regale property was a building before it was a hotel. We keep the walls, the floors, and the stories, and add only what a guest genuinely needs.",
    },
    {
      title: "Local, always",
      body: "Every host lives in the town the house sits in. There's no regional manager between you and the person who greets you at the door.",
    },
    {
      title: "Direct, on principle",
      body: "We'd rather answer your questions ourselves — on WhatsApp, at the price we actually charge — than have an aggregator stand between us.",
    },
  ],
};

const { request } = useApi();
const { data: content } = useAsyncData<AboutContent>("about-content", () => request<AboutContent>("/api/content/about"), {
  lazy: true,
});
const { data: properties } = useAsyncData<Property[]>("about-properties", () => request<Property[]>("/api/properties"), {
  lazy: true,
});

const headline = computed(() => content.value?.headline || DEFAULTS.headline);
const intro = computed(() => content.value?.intro || DEFAULTS.intro);
const story = computed(() => content.value?.story || DEFAULTS.story);
const values = computed(() => (content.value?.values?.length ? content.value.values : DEFAULTS.values));

useSeoMeta({
  title: "About — Regale Hotels",
  description: "The story behind Regale Hotels' four restored boutique properties across Kerala.",
});
</script>

<template>
  <div>
    <section class="relative h-[52vh] min-h-[340px] flex items-end">
      <div class="absolute inset-0 overflow-hidden">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCgrtkDFA8wpunJIf_o1drN6FaSlwB2DVTF0W5sFttfRlD_OCF5-SOXvlm1HPRztIPmABl8NfXhdMCQ5XTqXVyqg1cEjEr9bEq2AYvAFJeTc7AQvd8Y0cb2VhOZjbOHwweVMZBAglYydTjOd0slnoZ_0zUgQ0px6cCLlrODK1eRqThWwXzv3oqJ8FjRGMH9QTSWjEOHpZ8xYH_TEmg7qTyfRTmPOJRHiT0H4M6AJWCi2fDq7B1vDtoe"
          alt="Ledger House, Alleppey — the first Regale restoration"
          class="w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-on-background/85 via-on-background/25 to-transparent" />
      </div>
      <div class="relative z-10 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pb-12 w-full">
        <p class="font-label-ledger text-xs tracking-[0.16em] uppercase mb-3" style="color: #c5a059">Our story</p>
        <h1 class="font-display-lg text-[clamp(38px,6.5vw,64px)] leading-tight text-surface-bright max-w-2xl">
          {{ headline }}
        </h1>
      </div>
    </section>

    <div class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-14 pb-24">
      <p class="text-body-lg text-on-surface-variant max-w-[60ch] mb-6">{{ intro }}</p>
      <p class="text-body-md text-on-surface-variant max-w-[60ch] mb-16">{{ story }}</p>

      <div class="border-t border-outline/20 py-14">
        <h2 class="font-display-lg text-headline-md text-on-background mb-10 text-center">Our locations</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <NuxtLink
            v-for="p in properties"
            :key="p.id"
            :to="`/properties/${p.slug}`"
            class="group relative h-56 overflow-hidden block border border-outline/10"
          >
            <img
              :src="p.cover_image_url"
              :alt="p.name"
              loading="lazy"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-on-background/80 via-on-background/10 to-transparent" />
            <div class="absolute bottom-0 left-0 right-0 p-4">
              <p class="font-label-ledger text-[11px] tracking-[0.1em] uppercase mb-1" style="color: #c5a059">{{ p.city }}, {{ p.state }}</p>
              <p class="font-display-lg text-lg text-surface-bright leading-tight">{{ p.name }}</p>
            </div>
          </NuxtLink>
        </div>
      </div>

      <div class="border-t border-outline/20 pt-14 grid gap-10 md:grid-cols-3">
        <div v-for="v in values" :key="v.title">
          <h3 class="font-display-lg text-headline-sm text-on-background mb-2.5">{{ v.title }}</h3>
          <p class="text-body-md text-on-surface-variant">{{ v.body }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
