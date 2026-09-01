<script setup lang="ts">
import { AUTH_ROUTES } from '../utils/auth-routes'

defineOptions({ name: 'AuthLoginPage' })

definePageMeta({
  path: '/login',
  layout: false
})

const session = useSupabaseSession()
const { signInWithPassword } = useAuth()

watch(session, (value) => {
  if (value) {
    navigateTo(AUTH_ROUTES.app)
  }
})

const state = reactive({
  email: '',
  password: ''
})

const loading = ref(false)

async function onSubmit() {
  loading.value = true
  try {
    const { error } = await signInWithPassword(state.email, state.password)
    if (!error) {
      await navigateTo(AUTH_ROUTES.app)
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-svh flex items-center justify-center p-4 bg-default">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="flex flex-col gap-1">
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-wrench"
              class="size-5 text-primary"
            />
            <h1 class="text-lg font-semibold text-highlighted">
              Auto Check Araujo
            </h1>
          </div>
          <p class="text-sm text-muted">
            Acesso exclusivo para Colaboradores da oficina.
          </p>
        </div>
      </template>

      <AuthLoginForm
        v-model="state"
        :loading="loading"
        @submit="onSubmit"
      />
    </UCard>
  </div>
</template>
