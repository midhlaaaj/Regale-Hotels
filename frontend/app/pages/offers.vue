<script setup lang="ts">
useSeoMeta({ title: "Offers — Regale Hotels", description: "Current packages and seasonal offers across Regale's properties." });

const offers = [
  {
    title: "Monsoon in the Backwaters",
    property: "The Alleppey Ledger",
    tag: "Jun – Aug",
    desc: "Three nights with a daily Ayurvedic massage and a private houseboat afternoon, at 20% off the Refundable rate.",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCgrtkDFA8wpunJIf_o1drN6FaSlwB2DVTF0W5sFttfRlD_OCF5-SOXvlm1HPRztIPmABl8NfXhdMCQ5XTqXVyqg1cEjEr9bEq2AYvAFJeTc7AQvd8Y0cb2VhOZjbOHwweVMZBAglYydTjOd0slnoZ_0zUgQ0px6cCLlrODK1eRqThWwXzv3oqJ8FjRGMH9QTSWjEOHpZ8xYH_TEmg7qTyfRTmPOJRHiT0H4M6AJWCi2fDq7B1vDtoe",
  },
  {
    title: "Tea Estate Escape",
    property: "Munnar Estate",
    tag: "Year-round",
    desc: "Book two nights, get the third free — includes a guided walk through the working tea gardens at first light.",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuC6nxX0NBg11sCWdsNXtjQVrK52khPBXBC_aJawVzuPP6Biw4OiEMuJL3G39OfHUfDxcz3f6okOcYwZ91QfsGMm-TrL6fb3f-yYqGilqrQK190Iy-VtdIKJwkEL9j9AONu6ZW-rneZoh0c_TpTj01agfGEDCSFRcmaE-sGV7FqCBv_FVuYW8G-deN5VWgXuebB43JZdTxnxx7Ez3NhTsXbOcYalgC6dZOdMSEnkhSGGNoi3X6jTJDHd",
  },
  {
    title: "Long Weekend in Lutyens'",
    property: "Lutyens' Haven",
    tag: "Fri – Mon",
    desc: "A complimentary late checkout and a private heritage-walk of the enclave, included on any Non-refundable booking.",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBdQDvONBwoPAXkrNXi1vccKDbhp2TqZJMmV1y1Of1Umt_e7FOBPqOskZbUVlacKTqeh8PPvKR6MNU4q7yLy0obFAMwHWF8kueCnox4WOuMWcU52Nh7YQUdXd9ZQXsGRsqhzJu9CYrPZo67pbh-L2aebbTD2ARWC_NgjszUj6zfQ-eonlxvDyZXygZkwW5Jf_H9SRKjsqz4iVqZPmJLuOHWweCsJsJA7tU9jVqg-ZVnC53pWyF-DS7x",
  },
  {
    title: "Off-Season Goa",
    property: "Assagao Villa",
    tag: "Apr – Sep",
    desc: "30% off the Flexible rate, with a bottle of house feni and late checkout on request.",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBvApowZ86A7hdu7XHDVq6tGhlMx9gRL_aHxzCkFR0hIkbGbBOCZG_YVjd_PhvRWqXAsbz_y6GDBVT416OSjqhm52sQ0eap1nhvMdBZBVlac0DYKaHpPMdrYBYI2fsJs70k0uw649kr86wG7nXbd6lIGLOE0vsnEXOccbmPZLWg-Y1FijoheVScC-pG9xjy4gdZkhPZkliFcl9lyUrhg2LuU4kPoMgSr2-UxvqCiNq8_IxsGEHgJeHV",
  },
];
</script>

<template>
  <div class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-8 md:pt-14 pb-24">
    <p class="font-label-ledger text-xs tracking-[0.16em] uppercase mb-3" style="color: #c5a059">Current packages</p>
    <h1 class="font-display-lg text-[clamp(38px,6.5vw,64px)] leading-tight text-on-background mb-6">Offers</h1>
    <p class="text-body-lg text-on-surface-variant max-w-[56ch] mb-14">
      Seasonal packages and standing offers across our four houses — all bookable direct, at the rate shown.
    </p>

    <div class="grid gap-8 md:grid-cols-2">
      <div v-for="o in offers" :key="o.title" class="border border-outline/10 bg-surface-container-lowest">
        <div class="relative h-56 overflow-hidden">
          <img :src="o.img" :alt="o.title" class="w-full h-full object-cover" />
          <span class="absolute top-4 left-4 bg-brass-tint text-secondary px-2.5 py-1 text-xs font-label-ledger rounded-sm">{{
            o.tag
          }}</span>
        </div>
        <div class="p-6">
          <p class="font-label-ledger text-[11px] tracking-[0.12em] uppercase text-outline mb-2">{{ o.property }}</p>
          <h3 class="font-display-lg text-headline-sm text-on-background mb-2.5">{{ o.title }}</h3>
          <p class="text-body-md text-on-surface-variant mb-5">{{ o.desc }}</p>
          <NuxtLink
            to="/properties"
            class="font-label-ledger text-xs tracking-[0.08em] uppercase text-primary border-b border-primary pb-0.5"
            >View property</NuxtLink
          >
        </div>
      </div>
    </div>
  </div>
</template>
