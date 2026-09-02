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
  username: '',
  password: ''
})

const loading = ref(false)

async function onSubmit() {
  loading.value = true
  try {
    const { error } = await signInWithPassword(state.username, state.password)
    if (!error) {
      await navigateTo(AUTH_ROUTES.app)
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-dvh items-center justify-center bg-muted p-4">
    <div class="w-full max-w-md overflow-hidden rounded-md border border-default bg-default shadow-sm">
      <div class="flex flex-col items-center border-b border-default px-6 py-6 text-center">
        <BaseBrandLogo size="lg" />
        <h1 class="mt-4 text-xl font-semibold text-highlighted">
          Sistema Interno
        </h1>
        <p class="mt-1 text-sm text-muted">
          Acesso exclusivo para colaboradores da oficina.
        </p>
      </div>

      <div class="px-6 py-6">
        <AuthLoginForm
          v-model="state"
          :loading="loading"
          @submit="onSubmit"
        />
      </div>

      <p class="border-t border-default px-6 py-3 text-center text-xs text-muted">
        Esqueceu a senha? Contate o administrador.
      </p>
    </div>
  </div>
</template>
