export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    'dayjs-nuxt'
  ],

  components: [{ path: '~/components', prefix: 'Base' }],

  css: ['#layers/1.base/app/assets/css/main.css'],

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
