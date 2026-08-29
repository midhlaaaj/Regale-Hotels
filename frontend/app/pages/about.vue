<script setup lang="ts">
useSeoMeta({
  title: "About — Regale Hotels",
  description: "The story behind Regale Hotels' four restored boutique properties across India.",
});
</script>

<template>
  <div class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-8 md:pt-14 pb-24">
    <p class="font-label-ledger text-xs tracking-[0.16em] uppercase mb-3" style="color: #c5a059">Our story</p>
    <h1 class="font-display-lg text-[clamp(38px,6.5vw,64px)] leading-tight text-on-background mb-6 max-w-2xl">
      Four houses, one ledger
    </h1>
    <p class="text-body-lg text-on-surface-variant max-w-[60ch] mb-6">
      Regale began with a single restoration — a spice merchant's home on Lake Vembanad, saved from demolition and
      reopened as a nine-room house. What we learned there, about patience with old buildings and about letting a
      place keep its own character, shaped every property since.
    </p>
    <p class="text-body-md text-on-surface-variant max-w-[60ch] mb-16">
      Each of our four houses is restored rather than built, staffed by people from the town it sits in, and run
      with the same conviction: a hotel should feel like being let into somewhere real, not checked into somewhere
      generic.
    </p>

    <div class="border-t border-outline/20 py-14">
      <h2 class="font-display-lg text-headline-md text-on-background mb-10 text-center">Our locations</h2>
      <div
        class="border border-outline/20 min-h-[360px] flex flex-col items-center justify-center gap-2"
        style="background: repeating-linear-gradient(135deg, #f0eee9 0px, #f0eee9 9px, #e8e5dd 9px, #e8e5dd 18px)"
      >
        <span class="material-symbols-outlined text-3xl text-secondary">map</span>
        <p class="font-label-ledger text-xs tracking-[0.1em] uppercase text-on-surface-variant">
          Map embed — Alleppey · Munnar · Delhi · Goa
        </p>
      </div>
    </div>

    <div class="border-t border-outline/20 pt-14 grid gap-10 md:grid-cols-3">
      <div>
        <h3 class="font-display-lg text-headline-sm text-on-background mb-2.5">Restoration, not construction</h3>
        <p class="text-body-md text-on-surface-variant">
          Every Regale property was a building before it was a hotel. We keep the walls, the floors, and the
          stories, and add only what a guest genuinely needs.
        </p>
      </div>
      <div>
        <h3 class="font-display-lg text-headline-sm text-on-background mb-2.5">Local, always</h3>
        <p class="text-body-md text-on-surface-variant">
          Every host lives in the town the house sits in. There's no regional manager between you and the person
          who greets you at the door.
        </p>
      </div>
      <div>
        <h3 class="font-display-lg text-headline-sm text-on-background mb-2.5">Direct, on principle</h3>
        <p class="text-body-md text-on-surface-variant">
          We'd rather answer your questions ourselves — on WhatsApp, at the price we actually charge — than have an
          aggregator stand between us.
        </p>
      </div>
    </div>
  </div>
</template>
