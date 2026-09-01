<script setup lang="ts">
import { AUTH_ROUTES } from '../utils/auth-routes'

defineOptions({ name: 'AuthConfirmPage' })

definePageMeta({
  path: '/confirm',
  layout: false
})

const user = useSupabaseUser()

watch(user, () => {
  if (user.value) {
    navigateTo(AUTH_ROUTES.app)
  }
}, { immediate: true })
</script>

<template>
  <div class="min-h-svh flex items-center justify-center p-4">
    <div class="flex flex-col items-center gap-3 text-muted">
      <UIcon
        name="i-lucide-loader-circle"
        class="size-8 animate-spin"
      />
      <p class="text-sm">
        Confirmando sessão…
      </p>
    </div>
  </div>
</template>
