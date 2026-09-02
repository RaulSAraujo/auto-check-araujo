<script setup lang="ts">
import type { SalesSummary } from '../utils/sales'
import { formatMoney } from '~~/shared/utils/money'

defineOptions({ name: 'SalesKpiStrip' })

defineProps<{
  summary: SalesSummary
  commissionRate: number
  loading?: boolean
}>()
</script>

<template>
  <div
    class="grid gap-px overflow-hidden rounded-lg border border-default bg-default shadow-sm sm:grid-cols-3"
  >
    <div class="bg-default px-4 py-5">
      <p class="text-xs font-semibold uppercase tracking-wide text-muted">
        Ticket médio
      </p>
      <p class="mt-1 text-xl font-semibold font-mono tabular-nums text-highlighted">
        <USkeleton
          v-if="loading"
          class="h-7 w-28"
        />
        <span v-else>{{ formatMoney(summary.ticketMedio) }}</span>
      </p>
    </div>

    <div class="bg-default px-4 py-5">
      <p class="text-xs font-semibold uppercase tracking-wide text-muted">
        Faturamento
      </p>
      <p class="mt-1 text-xl font-semibold font-mono tabular-nums text-primary">
        <USkeleton
          v-if="loading"
          class="h-7 w-28"
        />
        <span v-else>{{ formatMoney(summary.totalFaturado) }}</span>
      </p>
    </div>

    <div class="bg-default px-4 py-5">
      <p class="text-xs font-semibold uppercase tracking-wide text-muted">
        Comissão
        <span class="font-normal normal-case tracking-normal text-dimmed">
          ({{ Math.round(commissionRate * 100) }}%)
        </span>
      </p>
      <p class="mt-1 text-xl font-semibold font-mono tabular-nums text-highlighted">
        <USkeleton
          v-if="loading"
          class="h-7 w-28"
        />
        <span v-else>{{ formatMoney(summary.comissao) }}</span>
      </p>
    </div>
  </div>
</template>
