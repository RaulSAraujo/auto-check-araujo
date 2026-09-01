export default defineNuxtConfig({
  $meta: {
    name: 'orders'
  },

  components: [{ path: 'components', pathPrefix: true, prefix: 'Orders' }]
})
