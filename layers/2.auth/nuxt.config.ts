export default defineNuxtConfig({

  modules: ['@nuxtjs/supabase'],
  $meta: {
    name: 'auth'
  },

  components: [{ path: 'components', pathPrefix: true, prefix: 'Auth' }],

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
