export default defineNuxtConfig({
  $meta: {
    name: 'kanban'
  },

  components: [{ path: 'components', pathPrefix: true, prefix: 'Kanban' }]
})
