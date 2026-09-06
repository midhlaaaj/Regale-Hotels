export default defineNuxtConfig({
  compatibilityDate: "2025-01-01",
  devtools: { enabled: true },

  modules: [
    "@nuxtjs/tailwindcss",
    "@pinia/nuxt",
    "@nuxtjs/sitemap",
    "@nuxtjs/robots",
    "@nuxt/image",
  ],

  site: {
    url: "http://localhost:3000",
  },

  runtimeConfig: {
    public: {
      // Must share a registrable domain with the dev server's own origin
      // (both "localhost") — the guest session cookie is SameSite=Lax, which
      // browsers only attach to same-site fetches. 127.0.0.1 and localhost
      // count as different sites even though they resolve to the same host.
      apiBase: process.env.NUXT_PUBLIC_API_BASE || "http://localhost:8000",
      // Placeholder — not a real registered WhatsApp Business number. Replace via
      // NUXT_PUBLIC_WHATSAPP_NUMBER before this goes anywhere near production.
      whatsappNumber: process.env.NUXT_PUBLIC_WHATSAPP_NUMBER || "919999999999",
    },
  },

  app: {
    head: {
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "anonymous" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Hanken+Grotesk:ital,wght@0,100..900&family=Space+Mono:ital,wght@0,400;0,700&display=swap",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap",
        },
      ],
    },
  },

  css: ["~/assets/css/main.css"],
});
