export default defineNuxtConfig({
  $meta: {
    name: 'customers'
  },

  components: [{ path: 'components', pathPrefix: true, prefix: 'Customers' }]
})
