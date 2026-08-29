<script setup lang="ts">
const menuOpen = ref(false);
const navLinks = [
  { label: "Home", to: "/" },
  { label: "Properties", to: "/properties" },
  { label: "Gallery", to: "/gallery" },
  { label: "Offers", to: "/offers" },
  { label: "About", to: "/about" },
  { label: "Locations", to: "/contact" },
];
const route = useRoute();
const { link: whatsappLink } = useWhatsapp();

// Close the mobile menu on route change so it never lingers into the next page.
watch(
  () => route.path,
  () => {
    menuOpen.value = false;
  }
);
</script>

<template>
  <div class="min-h-screen bg-surface flex flex-col">
    <nav
      class="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop py-3.5 h-[70px] bg-surface/90 backdrop-blur-md border-b border-outline/10"
    >
      <NuxtLink
        to="/"
        class="font-display-lg text-display-lg-mobile md:text-[40px] md:leading-[1.1] text-primary tracking-tight"
        >Regale</NuxtLink
      >
      <div class="hidden lg:flex items-center gap-7 font-label-ledger text-label-ledger">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="pb-1"
          :class="
            route.path === link.to
              ? 'text-primary font-bold border-b-2 border-primary'
              : 'text-on-surface-variant hover:text-primary transition-colors'
          "
          >{{ link.label }}</NuxtLink
        >
      </div>
      <div class="flex items-center gap-2.5">
        <NuxtLink
          to="/my-bookings"
          class="hidden lg:flex items-center gap-1.5 border border-outline/30 h-10 px-3 rounded text-label-ledger text-xs text-secondary hover:border-secondary hover:text-on-background transition-colors"
        >
          <span class="material-symbols-outlined text-[18px]">person</span>
          <span>My Account</span>
        </NuxtLink>
        <NuxtLink
          to="/properties"
          class="bg-primary text-on-primary h-10 px-5 rounded font-label-ledger text-xs uppercase tracking-wider hover:bg-primary-container transition-colors hidden sm:flex items-center"
          >Book Now</NuxtLink
        >
        <button
          class="lg:hidden border border-outline/30 w-10 h-10 rounded flex items-center justify-center text-on-background"
          aria-label="Toggle menu"
          :aria-expanded="menuOpen"
          @click="menuOpen = !menuOpen"
        >
          <span class="material-symbols-outlined text-[22px]">{{ menuOpen ? "close" : "menu" }}</span>
        </button>
      </div>
    </nav>

    <div
      v-if="menuOpen"
      class="fixed top-[70px] left-0 right-0 z-40 bg-surface border-b border-outline/15 px-margin-mobile pb-4 flex flex-col lg:hidden max-h-[calc(100vh-70px)] overflow-y-auto"
    >
      <NuxtLink
        v-for="link in navLinks"
        :key="link.to"
        :to="link.to"
        class="border-b border-outline/10 py-4 font-label-ledger text-sm"
        :class="route.path === link.to ? 'text-primary font-bold' : 'text-on-background'"
        @click="menuOpen = false"
        >{{ link.label }}</NuxtLink
      >
      <NuxtLink
        to="/my-bookings"
        class="border-b border-outline/10 py-4 font-label-ledger text-sm text-on-background"
        @click="menuOpen = false"
        >My Bookings</NuxtLink
      >
      <NuxtLink
        to="/properties"
        class="mt-4 bg-primary text-on-primary text-center rounded font-label-ledger text-xs uppercase tracking-wider py-3"
        @click="menuOpen = false"
        >Book Now</NuxtLink
      >
    </div>

    <main class="flex-1 pt-[70px]">
      <slot />
    </main>

    <footer
      class="bg-surface-container-highest px-margin-mobile md:px-margin-desktop py-16 grid grid-cols-1 md:grid-cols-4 gap-gutter"
    >
      <div>
        <p class="font-display-lg text-headline-md text-primary mb-4">Regale</p>
        <p class="text-body-md text-on-surface opacity-80 max-w-[34ch]">
          © 2026 Regale Hotels &amp; Resorts. Inspired by the New Indian Editorial.
        </p>
      </div>
      <div class="flex flex-col gap-3">
        <p class="font-label-ledger text-[11px] tracking-[0.14em] uppercase text-outline mb-1">Explore</p>
        <NuxtLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="font-label-ledger text-sm text-on-surface-variant hover:text-primary transition-colors text-left"
          >{{ link.label }}</NuxtLink
        >
      </div>
      <div class="flex flex-col gap-3">
        <p class="font-label-ledger text-[11px] tracking-[0.14em] uppercase text-outline mb-1">Guests</p>
        <NuxtLink
          to="/my-bookings"
          class="font-label-ledger text-sm text-on-surface-variant hover:text-primary transition-colors"
          >My Bookings</NuxtLink
        >
        <NuxtLink
          to="/policies"
          class="font-label-ledger text-sm text-on-surface-variant hover:text-primary transition-colors"
          >Best Rate Guarantee</NuxtLink
        >
        <NuxtLink
          to="/policies"
          class="font-label-ledger text-sm text-on-surface-variant hover:text-primary transition-colors"
          >Cancellation Policy</NuxtLink
        >
      </div>
      <div class="flex flex-col gap-3">
        <p class="font-label-ledger text-[11px] tracking-[0.14em] uppercase text-outline mb-1">Legal</p>
        <NuxtLink
          to="/policies"
          class="font-label-ledger text-sm text-on-surface-variant hover:text-primary transition-colors"
          >Privacy Policy</NuxtLink
        >
        <NuxtLink
          to="/policies"
          class="font-label-ledger text-sm text-on-surface-variant hover:text-primary transition-colors"
          >Terms of Service</NuxtLink
        >
      </div>
    </footer>

    <a
      :href="whatsappLink()"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      title="WhatsApp concierge"
      class="fixed bottom-6 right-6 z-[60] bg-whatsapp text-white w-14 h-14 rounded-full flex items-center justify-center shadow-[4px_4px_0px_rgba(27,48,34,0.2)] hover:-translate-y-1 transition-transform"
    >
      <span class="material-symbols-outlined text-[28px]" aria-hidden="true">forum</span>
    </a>
  </div>
</template>
