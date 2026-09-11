<script setup lang="ts">
import { AUTH_ROUTES } from '../utils/auth-routes'

defineOptions({ name: 'AuthLoginPage' })

definePageMeta({
  path: '/login',
  layout: false,
  colorMode: 'light'
})

useSeoMeta({
  title: 'Entrar',
  description: BRAND.tagline
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
  if (loading.value) return
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
  <div class="auth-login light flex min-h-dvh flex-col antialiased text-highlighted md:flex-row">
    <aside
      class="auth-login__brand relative z-10 flex min-h-[19rem] w-full shrink-0 flex-col justify-between overflow-hidden p-8 shadow-[4px_0_24px_rgba(0,0,0,0.1)] md:min-h-dvh md:w-[45%] md:p-16 lg:p-24"
      aria-label="Marca Araujo Auto Center"
    >
      <div
        class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgb(255_255_255_/_0.1),transparent_55%)] opacity-50 mix-blend-overlay"
        aria-hidden="true"
      />
      <div
        class="auth-login__noise pointer-events-none absolute inset-0 opacity-30"
        aria-hidden="true"
      />
      <div
        class="auth-login__streak pointer-events-none absolute inset-y-0"
        aria-hidden="true"
      />

      <div class="relative z-10 mt-auto flex max-w-md flex-col gap-4 md:mt-0">
        <div class="mb-2 flex items-center gap-3">
          <UIcon
            name="i-lucide-car"
            class="size-10 shrink-0 fill-white text-white md:size-11"
            aria-hidden="true"
          />
          <div>
            <p class="text-3xl font-black leading-tight tracking-tight text-white md:text-4xl lg:text-5xl">
              Araujo<br>
              Auto Center
            </p>
            <p class="mt-1 text-sm font-medium uppercase tracking-[0.2em] text-white/60">
              {{ BRAND.location }}
            </p>
          </div>
        </div>

        <div
          class="my-4 hidden h-1 w-12 rounded-full bg-white/20 md:block"
          aria-hidden="true"
        />

        <p class="hidden max-w-sm text-lg font-light leading-relaxed text-white/80 md:block md:text-xl">
          Sistema interno da oficina.
        </p>
      </div>

      <div class="relative z-10 mt-10 hidden items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-white/40 md:mt-0 md:flex">
        <span
          class="auth-login__pulse size-2 shrink-0 rounded-full bg-ok-500"
          aria-hidden="true"
        />
        Sistema Operacional
      </div>
    </aside>

    <main class="relative flex w-full flex-1 items-center justify-center bg-muted p-8 md:w-[55%] md:p-16">
      <div
        class="auth-login__card w-full max-w-[400px] rounded-lg border border-default bg-default p-8 shadow-sm md:p-10"
      >
        <header class="mb-8">
          <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-dimmed">
            Acesso colaboradores
          </p>
          <h1 class="mb-2 text-3xl font-semibold tracking-tight text-highlighted text-balance">
            Entrar
          </h1>
          <p class="text-sm font-medium text-muted text-pretty">
            Use seu usuário e senha da oficina.
          </p>
        </header>

        <AuthLoginForm
          v-model="state"
          :loading="loading"
          @submit="onSubmit"
        />

        <div class="mt-8 border-t border-default pt-6 text-center">
          <p class="text-xs font-medium text-dimmed">
            Esqueceu a senha?
            Peça ao gerente para redefinir em Equipe.
          </p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.auth-login {
  color-scheme: light;
}

.auth-login :deep(input) {
  color: var(--stitch-on-surface);
}

.auth-login :deep(input::placeholder) {
  color: color-mix(in srgb, var(--stitch-outline-variant) 60%, transparent);
  -webkit-text-fill-color: color-mix(in srgb, var(--stitch-outline-variant) 60%, transparent);
  opacity: 1;
}

.auth-login :deep(input:not(:placeholder-shown)) {
  -webkit-text-fill-color: var(--stitch-on-surface);
}

.auth-login :deep(input:-webkit-autofill),
.auth-login :deep(input:-webkit-autofill:hover),
.auth-login :deep(input:-webkit-autofill:focus) {
  -webkit-text-fill-color: var(--stitch-on-surface);
  box-shadow: 0 0 0 1000px var(--stitch-surface-lowest) inset;
  transition: background-color 99999s ease-out;
}

.auth-login__brand {
  background: linear-gradient(
    to bottom right,
    var(--stitch-primary),
    var(--stitch-charcoal-dark)
  );
}

.auth-login__noise {
  background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSJub25lIi8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz4KPC9zdmc+");
}

.auth-login__streak {
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(
    to right,
    rgb(255 255 255 / 0) 0%,
    rgb(255 255 255 / 0.03) 50%,
    rgb(255 255 255 / 0) 100%
  );
  transform: skewX(-45deg);
  animation: auth-login-sweep 8s linear infinite;
}

.auth-login__card {
  animation: auth-login-rise 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.auth-login__pulse {
  animation: auth-login-pulse 2s ease-in-out infinite;
}

@keyframes auth-login-sweep {
  0% {
    left: -100%;
  }

  100% {
    left: 200%;
  }
}

@keyframes auth-login-rise {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes auth-login-pulse {
  0%,
  100% {
    opacity: 0.55;
  }

  50% {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .auth-login__streak,
  .auth-login__card,
  .auth-login__pulse {
    animation: none;
  }
}
</style>
