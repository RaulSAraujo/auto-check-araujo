<script setup lang="ts">
defineOptions({ name: 'HomeRegistryStats' })

defineProps<{
  pending: boolean
  clientesCount: number
  veiculosCount: number
}>()
</script>

<template>
  <section
    class="home-block flex h-full min-h-0 flex-col"
    style="--home-stagger: 1"
    aria-labelledby="home-registry-heading"
  >
    <div class="mb-2 flex min-h-9 items-end">
      <h2
        id="home-registry-heading"
        class="text-sm font-semibold uppercase tracking-widest text-muted"
      >
        Cadastro
      </h2>
    </div>

    <dl class="grid max-h-72 min-h-48 flex-1 grid-rows-2 overflow-hidden rounded-lg border border-default bg-default shadow-sm dark:border-accented dark:bg-elevated dark:shadow-none">
      <NuxtLink
        :to="APP_ROUTES.customers"
        class="flex items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-elevated/60 focus-visible:bg-elevated/60 focus-visible:outline-none"
      >
        <dt class="text-sm text-muted">
          Clientes
        </dt>
        <dd class="home-num text-3xl font-bold tabular-nums tracking-tight text-highlighted sm:text-4xl">
          <USkeleton
            v-if="pending"
            class="h-9 w-14"
          />
          <template v-else>
            {{ clientesCount }}
          </template>
        </dd>
      </NuxtLink>

      <NuxtLink
        :to="APP_ROUTES.vehicles"
        class="flex items-center justify-between gap-3 border-t border-default px-4 py-4 transition-colors hover:bg-elevated/60 focus-visible:bg-elevated/60 focus-visible:outline-none"
      >
        <dt class="text-sm text-muted">
          Veículos
        </dt>
        <dd class="home-num text-3xl font-bold tabular-nums tracking-tight text-highlighted sm:text-4xl">
          <USkeleton
            v-if="pending"
            class="h-9 w-14"
          />
          <template v-else>
            {{ veiculosCount }}
          </template>
        </dd>
      </NuxtLink>
    </dl>
  </section>
</template>

<style scoped>
.home-num {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}

.home-block {
  animation: home-rise 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(var(--home-stagger, 0) * 60ms);
}

@keyframes home-rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-block {
    animation: none;
  }
}
</style>
