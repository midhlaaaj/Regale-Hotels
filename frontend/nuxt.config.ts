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
    url: process.env.NUXT_PUBLIC_SITE_URL || "http://localhost:3000",
  },

  // The admin panel stays a pure SPA (matching its former standalone app):
  // its cookie-auth flow assumes a client-only fetch, and admin routes have
  // no SEO reason to be server-rendered anyway. Also keep it out of the
  // sitemap/robots output generated for the public marketing site.
  routeRules: {
    "/admin/**": { ssr: false, robots: false, sitemap: false },
  },

  runtimeConfig: {
    public: {
      // The guest session cookie is SameSite=None, so the API can live on an
      // unrelated domain (e.g. a separate Render/Vercel deployment) — no
      // shared registrable domain with this app is required.
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
