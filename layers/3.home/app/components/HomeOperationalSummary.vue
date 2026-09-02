<script setup lang="ts">
import { formatMoney } from '~~/shared/utils/money'

defineOptions({ name: 'HomeOperationalSummary' })

defineProps<{
  pending: boolean
  osAbertas: number
  osAndamento: number
  clientesCount: number
  veiculosCount: number
  showFinance: boolean
  pendingFinance: boolean
  totalFaturado: number
  totalPago: number
  totalPendente: number
}>()
</script>

<template>
  <div class="home-summary mx-auto w-full max-w-5xl space-y-8">
    <section
      class="home-summary__section"
      style="--home-stagger: 0"
      aria-labelledby="home-orders-heading"
    >
      <div class="mb-3 flex items-end justify-between gap-3">
        <h2
          id="home-orders-heading"
          class="text-sm font-semibold uppercase tracking-widest text-muted"
        >
          Ordens de serviço
        </h2>
        <UButton
          :to="APP_ROUTES.orders"
          label="Ver todas"
          variant="link"
          size="sm"
          color="primary"
          trailing-icon="i-lucide-arrow-right"
          class="font-medium"
        />
      </div>

      <ul class="home-summary__panel divide-y divide-default overflow-hidden rounded-[6px] border border-default bg-default shadow-sm dark:border-accented dark:bg-elevated dark:shadow-none">
        <li>
          <NuxtLink
            :to="`${APP_ROUTES.orders}?status=aberta`"
            class="home-summary__row group flex min-h-14 items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-elevated/60"
          >
            <span class="text-base font-medium text-highlighted">
              Abertas
            </span>
            <div class="flex items-center gap-4">
              <span class="home-summary__num text-3xl font-bold tabular-nums tracking-tight text-primary transition-transform group-hover:scale-105">
                <USkeleton
                  v-if="pending"
                  class="inline-block h-9 w-10"
                />
                <template v-else>
                  {{ osAbertas }}
                </template>
              </span>
              <UIcon
                name="i-lucide-chevron-right"
                class="size-5 shrink-0 text-dimmed"
                aria-hidden="true"
              />
            </div>
          </NuxtLink>
        </li>
        <li>
          <NuxtLink
            :to="`${APP_ROUTES.orders}?status=em_andamento`"
            class="home-summary__row group flex min-h-14 items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-elevated/60"
          >
            <span class="text-base font-medium text-highlighted">
              Em andamento
            </span>
            <div class="flex items-center gap-4">
              <span class="home-summary__num text-3xl font-bold tabular-nums tracking-tight text-warning transition-transform group-hover:scale-105">
                <USkeleton
                  v-if="pending"
                  class="inline-block h-9 w-10"
                />
                <template v-else>
                  {{ osAndamento }}
                </template>
              </span>
              <UIcon
                name="i-lucide-chevron-right"
                class="size-5 shrink-0 text-dimmed"
                aria-hidden="true"
              />
            </div>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <section
      class="home-summary__section"
      style="--home-stagger: 1"
      aria-labelledby="home-registry-heading"
    >
      <h2
        id="home-registry-heading"
        class="mb-3 text-sm font-semibold uppercase tracking-widest text-muted"
      >
        Cadastro
      </h2>

      <dl class="home-summary__panel grid overflow-hidden rounded-[6px] border border-default bg-default shadow-sm dark:border-accented dark:bg-elevated dark:shadow-none sm:grid-cols-2 sm:divide-x sm:divide-default">
        <NuxtLink
          :to="APP_ROUTES.customers"
          class="flex flex-col items-center justify-center px-4 py-6 text-center transition-colors hover:bg-elevated/60"
        >
          <dt class="mb-1 text-sm text-muted">
            Clientes
          </dt>
          <dd class="home-summary__num text-4xl font-bold tabular-nums tracking-tight text-highlighted">
            <USkeleton
              v-if="pending"
              class="mx-auto h-10 w-16"
            />
            <template v-else>
              {{ clientesCount }}
            </template>
          </dd>
        </NuxtLink>

        <NuxtLink
          :to="APP_ROUTES.vehicles"
          class="flex flex-col items-center justify-center border-t border-default px-4 py-6 text-center transition-colors hover:bg-elevated/60 sm:border-t-0"
        >
          <dt class="mb-1 text-sm text-muted">
            Veículos
          </dt>
          <dd class="home-summary__num text-4xl font-bold tabular-nums tracking-tight text-highlighted">
            <USkeleton
              v-if="pending"
              class="mx-auto h-10 w-16"
            />
            <template v-else>
              {{ veiculosCount }}
            </template>
          </dd>
        </NuxtLink>
      </dl>
    </section>

    <section
      v-if="showFinance"
      class="home-summary__section"
      style="--home-stagger: 2"
      aria-labelledby="home-finance-heading"
    >
      <div class="mb-3 flex items-end justify-between gap-3">
        <h2
          id="home-finance-heading"
          class="text-sm font-semibold uppercase tracking-widest text-muted"
        >
          Financeiro
        </h2>
        <UButton
          :to="APP_ROUTES.finance"
          label="Detalhes"
          variant="link"
          size="sm"
          color="primary"
          trailing-icon="i-lucide-arrow-right"
          class="font-medium"
        />
      </div>

      <div class="home-summary__panel grid overflow-hidden rounded-[6px] border border-default bg-default shadow-sm dark:border-accented dark:bg-elevated dark:shadow-none sm:grid-cols-3 sm:divide-x sm:divide-default">
        <div class="px-5 py-5 transition-colors hover:bg-elevated/60">
          <p class="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
            Faturamento
          </p>
          <p class="home-summary__num text-xl font-bold tabular-nums text-highlighted">
            <USkeleton
              v-if="pendingFinance"
              class="h-7 w-28"
            />
            <template v-else>
              {{ formatMoney(totalFaturado) }}
            </template>
          </p>
        </div>
        <div class="border-t border-default px-5 py-5 transition-colors hover:bg-elevated/60 sm:border-t-0">
          <p class="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
            Recebido
          </p>
          <p class="home-summary__num text-xl font-bold tabular-nums text-success">
            <USkeleton
              v-if="pendingFinance"
              class="h-7 w-28"
            />
            <template v-else>
              {{ formatMoney(totalPago) }}
            </template>
          </p>
        </div>
        <div class="border-t border-default px-5 py-5 transition-colors hover:bg-elevated/60 sm:border-t-0">
          <p class="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
            Pendente
          </p>
          <p class="home-summary__num text-xl font-bold tabular-nums text-caution-400">
            <USkeleton
              v-if="pendingFinance"
              class="h-7 w-28"
            />
            <template v-else>
              {{ formatMoney(totalPendente) }}
            </template>
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-summary__num {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}

.home-summary__section {
  animation: home-summary-rise 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(var(--home-stagger, 0) * 60ms);
}

.home-summary__row:active {
  transform: scale(0.995);
}

@keyframes home-summary-rise {
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
  .home-summary__section {
    animation: none;
  }

  .home-summary__row:active,
  .home-summary__row:hover .home-summary__num {
    transform: none;
  }
}
</style>
