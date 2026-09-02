<script setup lang="ts">
import type { FinanceSummary } from '../utils/finance'
import { formatMoney } from '~~/shared/utils/money'

defineOptions({ name: 'FinanceSummaryPanel' })

defineProps<{
  summary: FinanceSummary
  loading?: boolean
}>()
</script>

<template>
  <div class="space-y-4">
    <div class="grid gap-px overflow-hidden rounded-md border border-default bg-default shadow-sm sm:grid-cols-3">
      <div class="bg-default px-4 py-5">
        <p class="text-xs font-semibold uppercase tracking-wide text-muted">
          Faturamento
        </p>
        <p class="mt-1 text-xl font-semibold font-mono tabular-nums text-highlighted">
          <USkeleton
            v-if="loading"
            class="h-7 w-28"
          />
          <span v-else>{{ formatMoney(summary.total_faturado) }}</span>
        </p>
      </div>
      <div class="bg-default px-4 py-5">
        <p class="text-xs font-semibold uppercase tracking-wide text-muted">
          Recebido (OS)
        </p>
        <p class="mt-1 text-xl font-semibold font-mono tabular-nums text-success">
          <USkeleton
            v-if="loading"
            class="h-7 w-28"
          />
          <span v-else>{{ formatMoney(summary.total_pago) }}</span>
        </p>
      </div>
      <div class="bg-default px-4 py-5">
        <p class="text-xs font-semibold uppercase tracking-wide text-muted">
          Pendente (OS)
        </p>
        <p class="mt-1 text-xl font-semibold font-mono tabular-nums text-warning">
          <USkeleton
            v-if="loading"
            class="h-7 w-28"
          />
          <span v-else>{{ formatMoney(summary.total_pendente) }}</span>
        </p>
      </div>
    </div>

    <div class="grid gap-px overflow-hidden rounded-md border border-default bg-default shadow-sm sm:grid-cols-3">
      <div class="bg-default px-4 py-5">
        <p class="text-xs font-semibold uppercase tracking-wide text-muted">
          A pagar
        </p>
        <p class="mt-1 text-xl font-semibold font-mono tabular-nums text-warning">
          <USkeleton
            v-if="loading"
            class="h-7 w-28"
          />
          <span v-else>{{ formatMoney(summary.total_a_pagar) }}</span>
        </p>
      </div>
      <div class="bg-default px-4 py-5">
        <p class="text-xs font-semibold uppercase tracking-wide text-muted">
          Despesas pagas
        </p>
        <p class="mt-1 text-xl font-semibold font-mono tabular-nums text-highlighted">
          <USkeleton
            v-if="loading"
            class="h-7 w-28"
          />
          <span v-else>{{ formatMoney(summary.total_pago_despesas) }}</span>
        </p>
      </div>
      <div class="bg-default px-4 py-5">
        <p class="text-xs font-semibold uppercase tracking-wide text-muted">
          Vencido
        </p>
        <p class="mt-1 text-xl font-semibold font-mono tabular-nums text-error">
          <USkeleton
            v-if="loading"
            class="h-7 w-28"
          />
          <span v-else>{{ formatMoney(summary.total_vencido) }}</span>
        </p>
      </div>
    </div>

    <div class="grid gap-px overflow-hidden rounded-md border border-default bg-default shadow-sm sm:grid-cols-3">
      <div class="bg-default px-4 py-5">
        <p class="text-xs font-semibold uppercase tracking-wide text-muted">
          Entradas (caixa)
        </p>
        <p class="mt-1 text-xl font-semibold font-mono tabular-nums text-success">
          <USkeleton
            v-if="loading"
            class="h-7 w-28"
          />
          <span v-else>{{ formatMoney(summary.entradas) }}</span>
        </p>
      </div>
      <div class="bg-default px-4 py-5">
        <p class="text-xs font-semibold uppercase tracking-wide text-muted">
          Saídas (caixa)
        </p>
        <p class="mt-1 text-xl font-semibold font-mono tabular-nums text-highlighted">
          <USkeleton
            v-if="loading"
            class="h-7 w-28"
          />
          <span v-else>{{ formatMoney(summary.saidas) }}</span>
        </p>
      </div>
      <div class="bg-default px-4 py-5">
        <p class="text-xs font-semibold uppercase tracking-wide text-muted">
          Saldo do mês
        </p>
        <p
          class="mt-1 text-xl font-semibold font-mono tabular-nums"
          :class="summary.saldo >= 0 ? 'text-success' : 'text-error'"
        >
          <USkeleton
            v-if="loading"
            class="h-7 w-28"
          />
          <span v-else>{{ formatMoney(summary.saldo) }}</span>
        </p>
      </div>
    </div>
  </div>
</template>
