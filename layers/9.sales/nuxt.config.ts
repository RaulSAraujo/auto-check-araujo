export default defineNuxtConfig({
  $meta: {
    name: 'sales'
  },

  components: [{ path: 'components', pathPrefix: true, prefix: 'Sales' }]
})
