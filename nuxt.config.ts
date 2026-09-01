export default defineNuxtConfig({
  modules: [
    '@nuxt/content',
    'nuxt-zod',
    'nuxt-charts'
  ],

  components: [{ path: '~/components', prefix: 'App' }],

  devtools: {
    enabled: true
  },

  runtimeConfig: {
    public: {
      appName: 'Auto Check Araujo'
    }
  },

  routeRules: {
    '/': { prerender: false }
  },

  compatibilityDate: '2026-06-30'
})
