// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      // Nilai default, otomatis di-override oleh NUXT_PUBLIC_API_BASE di file .env
      apiBase: 'http://app.test/api'
    }
  },
  app: {
    head: {
      title: 'Anisa Medika - Toko & Distributor Alat Kesehatan (Alkes) Terpercaya',
      meta: [
        { name: 'description', content: 'Anisa Medika: Toko dan penyedia resmi alat kesehatan (alkes) medis modern berstandar Kemenkes RI. Instrumen diagnostik, monitoring ICU, defibrillator, dan perlengkapan bedah terpercaya.' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap' }
      ]
    }
  }
})

