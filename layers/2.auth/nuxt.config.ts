export default defineNuxtConfig({
  $meta: {
    name: 'auth'
  },

  components: [{ path: '~/components', prefix: 'Auth' }],

  modules: ['@nuxtjs/supabase'],

  supabase: {
    redirect: true,
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      include: ['/*'],
      exclude: ['/login', '/confirm'],
      saveRedirectToCookie: true
    },
    types: '~~/shared/types/database'
  }
})
