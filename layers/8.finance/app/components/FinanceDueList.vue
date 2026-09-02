<script setup lang="ts">
import type { FinanceAccountRow } from '../utils/accounts-payable'
import {
  accountStatusColor,
  accountStatusLabel,
  displayAccountStatus,
  isAccountOverdue
} from '../utils/accounts-payable'
import { formatMoney } from '~~/shared/utils/money'
import { EMPTY_VALUE } from '~~/shared/utils/empty'

defineOptions({ name: 'FinanceDueList' })

defineProps<{
  accounts: FinanceAccountRow[]
  loading?: boolean
}>()

function formatDate(value: string) {
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}
</script>

<template>
  <section class="space-y-3">
    <h2 class="text-lg font-semibold text-highlighted">
      Vencimentos
    </h2>

    <div
      v-if="loading"
      class="space-y-2"
    >
      <USkeleton class="h-12 w-full" />
      <USkeleton class="h-12 w-full" />
    </div>

    <BaseEmptyState
      v-else-if="!accounts.length"
      icon="i-lucide-calendar-check"
    >
      Nenhum vencimento nos próximos 14 dias.
    </BaseEmptyState>

    <ul
      v-else
      class="divide-y divide-default overflow-hidden rounded-lg border border-default"
    >
      <li
        v-for="account in accounts"
        :key="account.id"
        class="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="min-w-0 space-y-0.5">
          <div class="flex flex-wrap items-center gap-2">
            <p class="truncate font-medium text-highlighted">
              {{ account.descricao }}
            </p>
            <UBadge
              :color="accountStatusColor(displayAccountStatus(account))"
              variant="subtle"
              size="sm"
            >
              {{ accountStatusLabel(displayAccountStatus(account)) }}
            </UBadge>
          </div>
          <p class="text-xs text-muted">
            {{ account.financeiro_categorias?.nome || EMPTY_VALUE }}
            · vence {{ formatDate(account.vencimento) }}
            <span
              v-if="isAccountOverdue(account)"
              class="text-error"
            > · atrasado</span>
          </p>
        </div>
        <p class="shrink-0 font-mono tabular-nums font-semibold text-highlighted">
          {{ formatMoney(Number(account.valor)) }}
        </p>
      </li>
    </ul>
  </section>
</template>
