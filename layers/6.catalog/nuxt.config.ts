export default defineNuxtConfig({
  $meta: {
    name: 'catalog'
  },

  components: [{ path: 'components', pathPrefix: true, prefix: 'Catalog' }]
})
