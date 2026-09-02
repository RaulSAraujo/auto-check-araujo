export default defineNuxtConfig({
  $meta: {
    name: 'finance'
  },

  components: [{ path: 'components', pathPrefix: true, prefix: 'Finance' }]
})
