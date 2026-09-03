<script setup lang="ts">
import { formatMoney } from '~~/shared/utils/money'

defineOptions({ name: 'HomeFinanceChart' })

defineProps<{
  pending: boolean
  totalFaturado: number
  totalPago: number
  totalPendente: number
}>()
</script>

<template>
  <section
    class="home-block"
    style="--home-stagger: 2"
    aria-labelledby="home-finance-heading"
  >
    <div class="mb-2 flex min-h-9 items-end justify-between gap-3">
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

    <div class="grid overflow-hidden rounded-lg border border-default bg-default shadow-sm dark:border-accented dark:bg-elevated dark:shadow-none sm:grid-cols-3 sm:divide-x sm:divide-default">
      <template v-if="pending">
        <div
          v-for="n in 3"
          :key="n"
          class="px-5 py-5"
        >
          <USkeleton class="mb-2 h-3 w-20" />
          <USkeleton class="h-7 w-28" />
        </div>
      </template>

      <template v-else>
        <div class="px-5 py-5">
          <p class="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
            Faturamento
          </p>
          <p class="home-num text-xl font-bold tabular-nums text-highlighted">
            {{ formatMoney(totalFaturado) }}
          </p>
        </div>
        <div class="border-t border-default px-5 py-5 sm:border-t-0">
          <p class="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
            Recebido
          </p>
          <p class="home-num text-xl font-bold tabular-nums text-success">
            {{ formatMoney(totalPago) }}
          </p>
        </div>
        <div class="border-t border-default px-5 py-5 sm:border-t-0">
          <p class="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
            Pendente
          </p>
          <p class="home-num text-xl font-bold tabular-nums text-caution-400">
            {{ formatMoney(totalPendente) }}
          </p>
        </div>
      </template>
    </div>
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
