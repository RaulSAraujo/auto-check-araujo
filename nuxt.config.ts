export default defineNuxtConfig({
  modules: [
    '@nuxt/content',
    'nuxt-charts'
  ],

  components: [{ path: '~/components', prefix: 'App' }],

  devtools: {
    enabled: true
  },

  runtimeConfig: {
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    public: {
      appName: 'Araujo Auto Center'
    }
  },

  routeRules: {
    '/': { prerender: false }
  },

  compatibilityDate: '2026-06-30'
})
