<script setup lang="ts">
import type { FinanceSummary } from '../../utils/finance'
import { formatMoney } from '~~/shared/utils/money'

defineOptions({ name: 'FinanceSummaryPanel' })

defineProps<{
  summary: FinanceSummary
  loading?: boolean
}>()
</script>

<template>
  <div class="space-y-5">
    <!-- Hero: caixa do mês -->
    <section aria-labelledby="finance-cash-heading">
      <h2
        id="finance-cash-heading"
        class="mb-2 text-sm font-semibold uppercase tracking-widest text-muted"
      >
        Caixa do mês
      </h2>

      <div class="overflow-hidden rounded-lg border border-default bg-default shadow-sm dark:border-accented dark:bg-elevated dark:shadow-none sm:grid sm:grid-cols-[1.4fr_1fr_1fr] sm:divide-x sm:divide-default">
        <div class="px-5 py-5">
          <p class="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
            Saldo
          </p>
          <p
            class="finance-num text-3xl font-bold tabular-nums tracking-tight"
            :class="loading ? 'text-muted' : summary.saldo >= 0 ? 'text-success' : 'text-error'"
          >
            <USkeleton
              v-if="loading"
              class="h-9 w-36"
            />
            <span v-else>{{ formatMoney(summary.saldo) }}</span>
          </p>
        </div>
        <div class="border-t border-default px-5 py-5 sm:border-t-0">
          <p class="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
            Entradas
          </p>
          <p class="finance-num text-xl font-bold tabular-nums text-success">
            <USkeleton
              v-if="loading"
              class="h-7 w-28"
            />
            <span v-else>{{ formatMoney(summary.entradas) }}</span>
          </p>
        </div>
        <div class="border-t border-default px-5 py-5 sm:border-t-0">
          <p class="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
            Saídas
          </p>
          <p class="finance-num text-xl font-bold tabular-nums text-highlighted">
            <USkeleton
              v-if="loading"
              class="h-7 w-28"
            />
            <span v-else>{{ formatMoney(summary.saidas) }}</span>
          </p>
        </div>
      </div>
    </section>

    <div class="grid gap-5 lg:grid-cols-2">
      <!-- Ordens -->
      <section aria-labelledby="finance-os-heading">
        <h2
          id="finance-os-heading"
          class="mb-2 text-sm font-semibold uppercase tracking-widest text-muted"
        >
          Ordens de serviço
        </h2>
        <div class="overflow-hidden rounded-lg border border-default bg-default shadow-sm dark:border-accented dark:bg-elevated dark:shadow-none sm:grid sm:grid-cols-3 sm:divide-x sm:divide-default">
          <div class="px-4 py-4">
            <p class="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">
              Faturamento
            </p>
            <p class="finance-num text-lg font-bold tabular-nums text-highlighted">
              <USkeleton
                v-if="loading"
                class="h-6 w-24"
              />
              <span v-else>{{ formatMoney(summary.total_faturado) }}</span>
            </p>
          </div>
          <div class="border-t border-default px-4 py-4 sm:border-t-0">
            <p class="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">
              Recebido
            </p>
            <p class="finance-num text-lg font-bold tabular-nums text-success">
              <USkeleton
                v-if="loading"
                class="h-6 w-24"
              />
              <span v-else>{{ formatMoney(summary.total_pago) }}</span>
            </p>
          </div>
          <div class="border-t border-default px-4 py-4 sm:border-t-0">
            <p class="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">
              Pendente
            </p>
            <p class="finance-num text-lg font-bold tabular-nums text-caution-400">
              <USkeleton
                v-if="loading"
                class="h-6 w-24"
              />
              <span v-else>{{ formatMoney(summary.total_pendente) }}</span>
            </p>
          </div>
        </div>
      </section>

      <!-- Contas -->
      <section aria-labelledby="finance-ap-heading">
        <h2
          id="finance-ap-heading"
          class="mb-2 text-sm font-semibold uppercase tracking-widest text-muted"
        >
          Contas a pagar
        </h2>
        <div class="overflow-hidden rounded-lg border border-default bg-default shadow-sm dark:border-accented dark:bg-elevated dark:shadow-none sm:grid sm:grid-cols-3 sm:divide-x sm:divide-default">
          <div class="px-4 py-4">
            <p class="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">
              A pagar
            </p>
            <p class="finance-num text-lg font-bold tabular-nums text-caution-400">
              <USkeleton
                v-if="loading"
                class="h-6 w-24"
              />
              <span v-else>{{ formatMoney(summary.total_a_pagar) }}</span>
            </p>
          </div>
          <div class="border-t border-default px-4 py-4 sm:border-t-0">
            <p class="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">
              Pagas
            </p>
            <p class="finance-num text-lg font-bold tabular-nums text-highlighted">
              <USkeleton
                v-if="loading"
                class="h-6 w-24"
              />
              <span v-else>{{ formatMoney(summary.total_pago_despesas) }}</span>
            </p>
          </div>
          <div class="border-t border-default px-4 py-4 sm:border-t-0">
            <p class="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">
              Vencido
            </p>
            <p class="finance-num text-lg font-bold tabular-nums text-error">
              <USkeleton
                v-if="loading"
                class="h-6 w-24"
              />
              <span v-else>{{ formatMoney(summary.total_vencido) }}</span>
            </p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.finance-num {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}
</style>
