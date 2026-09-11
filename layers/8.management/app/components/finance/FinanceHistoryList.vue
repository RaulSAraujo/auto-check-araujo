<script setup lang="ts">
import type { FormaPagamento } from '~~/shared/types/oficina'
import { FORMA_PAGAMENTO_LABEL } from '~~/shared/types/oficina'
import type { FinanceHistoryItem } from '../../utils/accounts-payable'
import { formatMoney } from '~~/shared/utils/money'
import { EMPTY_VALUE } from '~~/shared/utils/empty'

defineOptions({ name: 'FinanceHistoryList' })

defineProps<{
  items: FinanceHistoryItem[]
  loading?: boolean
}>()
</script>

<template>
  <section aria-labelledby="finance-history-heading">
    <h2
      id="finance-history-heading"
      class="mb-2 text-sm font-semibold uppercase tracking-widest text-muted"
    >
      Extrato do mês
    </h2>

    <div
      v-if="loading"
      class="space-y-0 overflow-hidden rounded-lg border border-default bg-default shadow-sm dark:border-accented dark:bg-elevated dark:shadow-none"
    >
      <div
        v-for="n in 4"
        :key="n"
        class="border-b border-default px-4 py-3 last:border-b-0"
      >
        <USkeleton class="h-10 w-full" />
      </div>
    </div>

    <div
      v-else-if="!items.length"
      class="rounded-lg border border-default bg-default px-4 py-8 shadow-sm dark:border-accented dark:bg-elevated dark:shadow-none"
    >
      <BaseEmptyState icon="i-lucide-history">
        Nenhum movimento pago neste mês.
      </BaseEmptyState>
    </div>

    <ul
      v-else
      class="divide-y divide-default overflow-hidden rounded-lg border border-default bg-default shadow-sm dark:border-accented dark:bg-elevated dark:shadow-none"
    >
      <li
        v-for="item in items"
        :key="item.id"
        class="flex flex-col gap-1 px-4 py-3 transition-colors duration-200 ease-[var(--ease-out)] hover:bg-elevated/60 sm:flex-row sm:items-center sm:justify-between"
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
          <p class="font-mono text-xs tabular-nums text-muted">
            {{ formatDateTime(item.pago_em) }}
            <span v-if="item.meta"> · {{ item.meta }}</span>
            <span v-if="item.forma_pagamento">
              · {{ FORMA_PAGAMENTO_LABEL[item.forma_pagamento as FormaPagamento] || item.forma_pagamento }}
            </span>
            <span v-else> · {{ EMPTY_VALUE }}</span>
          </p>
        </div>
        <p
          class="shrink-0 font-mono text-base font-semibold tabular-nums"
          :class="item.tipo === 'entrada' ? 'text-success' : 'text-highlighted'"
        >
          {{ item.tipo === 'entrada' ? '+' : '−' }}{{ formatMoney(item.valor) }}
        </p>
      </li>
    </ul>
  </section>
</template>
