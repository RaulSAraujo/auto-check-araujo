export default defineNuxtConfig({
  $meta: {
    name: 'vehicles'
  },

  components: [{ path: 'components', pathPrefix: true, prefix: 'Vehicles' }]
})
