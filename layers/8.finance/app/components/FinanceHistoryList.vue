<script setup lang="ts">
import type { FormaPagamento } from '~~/shared/types/oficina'
import { FORMA_PAGAMENTO_LABEL } from '~~/shared/types/oficina'
import type { FinanceHistoryItem } from '../utils/accounts-payable'
import { formatMoney } from '~~/shared/utils/money'
import { EMPTY_VALUE } from '~~/shared/utils/empty'

defineOptions({ name: 'FinanceHistoryList' })

defineProps<{
  items: FinanceHistoryItem[]
  loading?: boolean
}>()
</script>

<template>
  <section class="space-y-3">
    <h2 class="text-lg font-semibold text-highlighted">
      Histórico do mês
    </h2>

    <div
      v-if="loading"
      class="space-y-2"
    >
      <USkeleton class="h-12 w-full" />
      <USkeleton class="h-12 w-full" />
      <USkeleton class="h-12 w-full" />
    </div>

    <BaseEmptyState
      v-else-if="!items.length"
      icon="i-lucide-history"
    >
      Nenhum movimento pago neste mês.
    </BaseEmptyState>

    <ul
      v-else
      class="divide-y divide-default overflow-hidden rounded-lg border border-default"
    >
      <li
        v-for="item in items"
        :key="item.id"
        class="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="min-w-0 space-y-0.5">
          <div class="flex flex-wrap items-center gap-2">
            <UBadge
              :color="item.tipo === 'entrada' ? 'success' : 'neutral'"
              variant="subtle"
              size="sm"
            >
              {{ item.tipo === 'entrada' ? 'Entrada' : 'Saída' }}
            </UBadge>
            <p class="truncate font-medium text-highlighted">
              {{ item.descricao }}
            </p>
          </div>
          <p class="text-xs text-muted font-mono tabular-nums">
            {{ formatDateTime(item.pago_em) }}
            <span v-if="item.meta"> · {{ item.meta }}</span>
            <span v-if="item.forma_pagamento">
              · {{ FORMA_PAGAMENTO_LABEL[item.forma_pagamento as FormaPagamento] || item.forma_pagamento }}
            </span>
            <span v-else> · {{ EMPTY_VALUE }}</span>
          </p>
        </div>
        <p
          class="shrink-0 font-mono tabular-nums font-semibold"
          :class="item.tipo === 'entrada' ? 'text-success' : 'text-highlighted'"
        >
          {{ item.tipo === 'entrada' ? '+' : '−' }}{{ formatMoney(item.valor) }}
        </p>
      </li>
    </ul>
  </section>
</template>
