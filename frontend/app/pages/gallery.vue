<script setup lang="ts">
useSeoMeta({ title: "Gallery — Regale Hotels", description: "Photographs from all four Regale properties." });

const IMG = {
  boat: "https://lh3.googleusercontent.com/aida-public/AB6AXuAk6EmCOSxbMeL1PfUfK8ynVGKiKuO_CMUxG27XcxklX_HL1IvViLvol9NUNutY5hDxNSOwRCQ0f3jQOROAQJ02PMFFu6aYn8JOjfrSEjzGJEfna5f9SXzYioj5fNX1lCiR49CcMzoD3yMnmrZfuYrawe94GdOuOZH3oEqSjF8LysJYRiK1dCQfNvKibHPtLdkqp1j9baRalvqZQvrEIjQDZFur3ZtyrJJFTSYxf5oXE0mglO4P3ExT",
  canal: "https://lh3.googleusercontent.com/aida-public/AB6AXuCgrtkDFA8wpunJIf_o1drN6FaSlwB2DVTF0W5sFttfRlD_OCF5-SOXvlm1HPRztIPmABl8NfXhdMCQ5XTqXVyqg1cEjEr9bEq2AYvAFJeTc7AQvd8Y0cb2VhOZjbOHwweVMZBAglYydTjOd0slnoZ_0zUgQ0px6cCLlrODK1eRqThWwXzv3oqJ8FjRGMH9QTSWjEOHpZ8xYH_TEmg7qTyfRTmPOJRHiT0H4M6AJWCi2fDq7B1vDtoe",
  tea: "https://lh3.googleusercontent.com/aida-public/AB6AXuC6nxX0NBg11sCWdsNXtjQVrK52khPBXBC_aJawVzuPP6Biw4OiEMuJL3G39OfHUfDxcz3f6okOcYwZ91QfsGMm-TrL6fb3f-yYqGilqrQK190Iy-VtdIKJwkEL9j9AONu6ZW-rneZoh0c_TpTj01agfGEDCSFRcmaE-sGV7FqCBv_FVuYW8G-deN5VWgXuebB43JZdTxnxx7Ez3NhTsXbOcYalgC6dZOdMSEnkhSGGNoi3X6jTJDHd",
  room: "https://lh3.googleusercontent.com/aida-public/AB6AXuBdQDvONBwoPAXkrNXi1vccKDbhp2TqZJMmV1y1Of1Umt_e7FOBPqOskZbUVlacKTqeh8PPvKR6MNU4q7yLy0obFAMwHWF8kueCnox4WOuMWcU52Nh7YQUdXd9ZQXsGRsqhzJu9CYrPZo67pbh-L2aebbTD2ARWC_NgjszUj6zfQ-eonlxvDyZXygZkwW5Jf_H9SRKjsqz4iVqZPmJLuOHWweCsJsJA7tU9jVqg-ZVnC53pWyF-DS7x",
  pool: "https://lh3.googleusercontent.com/aida-public/AB6AXuBvApowZ86A7hdu7XHDVq6tGhlMx9gRL_aHxzCkFR0hIkbGbBOCZG_YVjd_PhvRWqXAsbz_y6GDBVT416OSjqhm52sQ0eap1nhvMdBZBVlac0DYKaHpPMdrYBYI2fsJs70k0uw649kr86wG7nXbd6lIGLOE0vsnEXOccbmPZLWg-Y1FijoheVScC-pG9xjy4gdZkhPZkliFcl9lyUrhg2LuU4kPoMgSr2-UxvqCiNq8_IxsGEHgJeHV",
};

const items = [
  { src: IMG.canal, caption: "Alleppey · The approach canal", loc: "Kerala" },
  { src: IMG.tea, caption: "Munnar · Tea slopes at dawn", loc: "Kerala" },
  { src: IMG.room, caption: "Delhi · The corner suite", loc: "North India" },
  { src: IMG.pool, caption: "Goa · Banyan courtyard", loc: "Goa" },
  { src: IMG.boat, caption: "Alleppey · Houseboat at first light", loc: "Kerala" },
  { src: IMG.pool, caption: "Goa · Late afternoon, west wall", loc: "Goa" },
  { src: IMG.room, caption: "Delhi · Teak and lime plaster", loc: "North India" },
  { src: IMG.tea, caption: "Munnar · The mist line", loc: "Kerala" },
  { src: IMG.canal, caption: "Alleppey · Verandah view", loc: "Kerala" },
  { src: IMG.boat, caption: "Alleppey · Evening crossing", loc: "Kerala" },
  { src: IMG.pool, caption: "Goa · Pool at 6pm", loc: "Goa" },
  { src: IMG.room, caption: "Delhi · Study, first floor", loc: "North India" },
];

const filters = ["All", "Kerala", "North India", "Goa"];
const active = ref("All");
const filtered = computed(() => (active.value === "All" ? items : items.filter((i) => i.loc === active.value)));

const lightbox = ref<{ src: string; caption: string } | null>(null);

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") lightbox.value = null;
}
onMounted(() => window.addEventListener("keydown", onKeydown));
onUnmounted(() => window.removeEventListener("keydown", onKeydown));
</script>

<template>
  <div>
    <section class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-8 md:pt-14">
      <p class="font-label-ledger text-xs tracking-[0.16em] uppercase mb-3" style="color: #c5a059">
        {{ items.length }} photographs · 4 properties
      </p>
      <h1 class="font-display-lg text-[clamp(38px,6.5vw,64px)] leading-tight text-on-background mb-7">The gallery</h1>
      <div class="flex flex-wrap gap-2 border-y border-outline/20 py-4">
        <button
          v-for="f in filters"
          :key="f"
          class="cursor-pointer px-3.5 py-1.5 rounded-full font-label-ledger text-[13px] whitespace-nowrap border"
          :class="active === f ? 'bg-brass-tint text-secondary border-[#C5A059]' : 'bg-transparent text-on-surface-variant border-outline-variant'"
          @click="active = f"
        >
          {{ f }}
        </button>
      </div>
    </section>
    <section class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-6 pb-24">
      <div style="columns: 300px; column-gap: 16px">
        <button
          v-for="(g, i) in filtered"
          :key="i"
          class="block w-full mb-4 p-0 border-none bg-transparent cursor-zoom-in relative"
          style="break-inside: avoid"
          @click="lightbox = g"
        >
          <img :src="g.src" :alt="g.caption" loading="lazy" class="w-full h-auto block border border-outline/10" />
          <span
            class="absolute bottom-0 left-0 right-0 px-3 py-2.5 text-left text-surface-bright font-label-ledger text-[11px] tracking-[0.08em] uppercase"
            style="background: linear-gradient(to top, rgba(27, 48, 34, 0.72), rgba(27, 48, 34, 0))"
            >{{ g.caption }}</span
          >
        </button>
      </div>
    </section>

    <div
      v-if="lightbox"
      role="dialog"
      aria-modal="true"
      :aria-label="lightbox.caption"
      class="fixed inset-0 z-[100] bg-[#1B3022]/95 flex flex-col items-center justify-center p-6 cursor-zoom-out"
      @click="lightbox = null"
    >
      <button
        class="absolute top-5 right-5 text-surface-bright bg-transparent border border-surface/30 rounded-full w-10 h-10 flex items-center justify-center cursor-pointer"
        aria-label="Close"
        @click.stop="lightbox = null"
      >
        <span class="material-symbols-outlined" aria-hidden="true">close</span>
      </button>
      <img :src="lightbox.src" :alt="lightbox.caption" class="max-w-full max-h-[78vh] object-contain block" />
      <p class="font-label-ledger text-xs tracking-[0.1em] uppercase mt-5" style="color: #c5a059">{{ lightbox.caption }}</p>
      <p class="font-label-ledger text-[11px] text-surface-variant mt-2">Tap anywhere or press Esc to close</p>
    </div>
  </div>
</template>
