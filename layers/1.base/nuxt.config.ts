export default defineNuxtConfig({

  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    'dayjs-nuxt'
  ],
  $meta: {
    name: 'base'
  },

  components: [{ path: 'components', pathPrefix: true, prefix: 'Base' }],

  imports: {
    dirs: ['utils']
  },

  css: ['~/assets/css/main.css'],

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
