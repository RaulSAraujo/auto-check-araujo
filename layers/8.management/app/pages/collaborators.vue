<script setup lang="ts">
defineOptions({ name: 'RedirectCollaboratorsPage' })

definePageMeta({
  path: '/colaboradores',
  layout: false
})

useRequirePermission('collaborators.manage')

await navigateTo(
  {
    path: APP_ROUTES.team,
    query: { tab: 'colaboradores' }
  },
  { redirectCode: 301, replace: true }
)
</script>

<template>
  <div />
</template>
