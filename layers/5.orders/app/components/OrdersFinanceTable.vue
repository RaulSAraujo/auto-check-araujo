<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { FinanceOrderRow } from '../utils/payment'
import type { FormaPagamento } from '~~/shared/types/oficina'
import { FORMA_PAGAMENTO_LABEL } from '~~/shared/types/oficina'
import { formatMoney } from '../utils/budget'
import { ORDER_ROUTES } from '../utils/order-routes'

defineOptions({ name: 'OrdersFinanceTable' })

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
  if (!forma) return '—'
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
        class="font-medium text-primary hover:underline"
      >
        {{ row.original.numero }}
      </NuxtLink>
    </template>

    <template #placa-cell="{ row }">
      <span class="font-mono tracking-wide">
        {{ row.original.veiculos ? formatPlaca(row.original.veiculos.placa) : '—' }}
      </span>
    </template>

    <template #concluida_em-cell="{ row }">
      {{ row.original.concluida_em ? formatDateTime(row.original.concluida_em) : '—' }}
    </template>

    <template #valor_total-cell="{ row }">
      <span class="tabular-nums">
        {{ row.original.valor_total != null ? formatMoney(Number(row.original.valor_total)) : '—' }}
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
      <div class="text-center py-8 text-muted">
        Nenhuma OS concluída com valor neste mês.
      </div>
    </template>
  </UTable>
</template>
