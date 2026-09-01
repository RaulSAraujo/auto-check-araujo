export default defineNuxtConfig({
  $meta: {
    name: 'home'
  },

  components: [{ path: 'components', pathPrefix: true, prefix: 'Home' }]
})
