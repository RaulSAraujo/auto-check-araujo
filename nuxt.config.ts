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
    groqApiKey: '',
    geminiApiKey: '',
    groqModel: 'openai/gpt-oss-120b',
    geminiModel: 'gemini-3.8-flash',
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
    '/precificacao': { redirect: '/configuracao/precificacao' },
    '/ajustes': { redirect: '/configuracao' }
  },

  compatibilityDate: '2026-06-30'
})
