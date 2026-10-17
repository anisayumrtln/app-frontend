// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      // Nilai default, otomatis di-override oleh NUXT_PUBLIC_API_BASE di file .env
      apiBase: 'http://app.test/api'
    }
  },
  app: {
    head: {
      title: 'Nuxt 4 + Laravel Herd API Dashboard',
      meta: [
        { name: 'description', content: 'Decoupled Nuxt.js frontend connected to Laravel Herd API backend.' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap' }
      ]
    }
  }
})

