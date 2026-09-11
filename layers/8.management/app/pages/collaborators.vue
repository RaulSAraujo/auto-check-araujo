<script setup lang="ts">
defineOptions({ name: 'RedirectCollaboratorsPage' })

definePageMeta({
  path: '/colaboradores',
  layout: false
})

useRequirePermission('collaborators.manage')

await navigateTo(APP_ROUTES.team, { redirectCode: 301, replace: true })
</script>

<template>
  <div />
</template>
