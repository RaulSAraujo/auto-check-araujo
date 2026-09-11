export default defineNuxtConfig({
  $meta: {
    name: 'configuration'
  },

  components: [
    { path: 'components/catalog', pathPrefix: false },
    { path: 'components/pricing', pathPrefix: false }
  ]
})
