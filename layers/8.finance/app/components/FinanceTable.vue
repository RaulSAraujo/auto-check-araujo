<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { FinanceOrderRow } from '../utils/finance'
import type { FormaPagamento } from '~~/shared/types/oficina'
import { FORMA_PAGAMENTO_LABEL } from '~~/shared/types/oficina'
import { formatMoney } from '~~/shared/utils/money'
import { ORDER_ROUTES } from '#layers/orders/app/utils/order-routes'
import { EMPTY_VALUE } from '~~/shared/utils/empty'

defineOptions({ name: 'FinanceTable' })

defineProps<{
  orders: FinanceOrderRow[]
  loading?: boolean
}>()

const columns: TableColumn<FinanceOrderRow>[] = [
  { accessorKey: 'numero', header: 'OS' },
  { id: 'placa', header: 'Placa' },
  { accessorKey: 'concluida_em', header: 'Concluída em' },
  { id: 'valor_total', header: 'Valor' },
  { id: 'pagamento', header: 'Pagamento' },
  { id: 'actions', header: '' }
]

function paymentLabel(forma: string | null): string {
  if (!forma) return EMPTY_VALUE
  return FORMA_PAGAMENTO_LABEL[forma as FormaPagamento] || forma
}
</script>

<template>
  <UTable
    :data="orders"
    :columns="columns"
    :loading="loading"
    class="w-full"
  >
    <template #numero-cell="{ row }">
      <NuxtLink
        :to="ORDER_ROUTES.detail(row.original.id)"
        class="font-mono font-medium tabular-nums text-primary hover:underline"
      >
        {{ row.original.numero }}
      </NuxtLink>
    </template>

    <template #placa-cell="{ row }">
      <span class="font-mono tracking-wide">
        {{ row.original.veiculos ? formatPlaca(row.original.veiculos.placa) : EMPTY_VALUE }}
      </span>
    </template>

    <template #concluida_em-cell="{ row }">
      <span class="font-mono tabular-nums">
        {{ row.original.concluida_em ? formatDateTime(row.original.concluida_em) : EMPTY_VALUE }}
      </span>
    </template>

    <template #valor_total-cell="{ row }">
      <span class="font-mono tabular-nums">
        {{ row.original.valor_total != null ? formatMoney(Number(row.original.valor_total)) : EMPTY_VALUE }}
      </span>
    </template>

    <template #pagamento-cell="{ row }">
      <div class="space-y-1">
        <UBadge
          :color="row.original.pago ? 'success' : 'warning'"
          variant="subtle"
          size="sm"
        >
          {{ row.original.pago ? 'Pago' : 'Pendente' }}
        </UBadge>
        <p
          v-if="row.original.pago && row.original.forma_pagamento"
          class="text-xs text-muted"
        >
          {{ paymentLabel(row.original.forma_pagamento) }}
        </p>
      </div>
    </template>

    <template #actions-cell="{ row }">
      <UButton
        :to="ORDER_ROUTES.detail(row.original.id)"
        icon="i-lucide-chevron-right"
        color="neutral"
        variant="ghost"
        size="sm"
        aria-label="Abrir ordem de serviço"
      />
    </template>

    <template #empty>
      <BaseEmptyState icon="i-lucide-wallet">
        Nenhuma OS concluída com valor neste mês.
      </BaseEmptyState>
    </template>
  </UTable>
</template>
