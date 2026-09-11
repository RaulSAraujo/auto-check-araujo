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
    '/': { prerender: false },
    '/vendas': { redirect: '/gestao/financeiro' },
    '/financeiro': { redirect: '/gestao/financeiro' },
    '/equipe': { redirect: '/gestao/equipe' },
    '/catalogo': { redirect: '/configuracao/catalogo' },
    '/precificacao': { redirect: '/configuracao/precificacao' }
  },

  compatibilityDate: '2026-06-30'
})
