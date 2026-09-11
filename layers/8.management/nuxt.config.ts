export default defineNuxtConfig({
  $meta: {
    name: 'management'
  },

  components: [
    { path: 'components/finance', pathPrefix: false },
    { path: 'components/team', pathPrefix: false }
  ]
})
