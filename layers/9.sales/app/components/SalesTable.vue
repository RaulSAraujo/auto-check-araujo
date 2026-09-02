<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { FormaPagamento } from '~~/shared/types/oficina'
import { FORMA_PAGAMENTO_LABEL } from '~~/shared/types/oficina'
import { EMPTY_VALUE } from '~~/shared/utils/empty'
import type { SalesOrderRow } from '../utils/sales'
import { formatMoney } from '~~/shared/utils/money'
import { ORDER_ROUTES } from '#layers/orders/app/utils/order-routes'

defineOptions({ name: 'SalesTable' })

defineProps<{
  orders: SalesOrderRow[]
  loading?: boolean
}>()

const columns: TableColumn<SalesOrderRow>[] = [
  { id: 'os', header: 'OS / Placa' },
  { id: 'colaborador', header: 'Colaborador' },
  { accessorKey: 'concluida_em', header: 'Conclusão' },
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
    <template #os-cell="{ row }">
      <div class="space-y-0.5">
        <NuxtLink
          :to="ORDER_ROUTES.detail(row.original.id)"
          class="font-mono font-medium tabular-nums text-primary hover:underline"
        >
          {{ row.original.numero }}
        </NuxtLink>
        <p class="font-mono text-xs tracking-wide text-muted">
          {{ row.original.veiculos ? formatPlaca(row.original.veiculos.placa) : EMPTY_VALUE }}
        </p>
      </div>
    </template>

    <template #colaborador-cell="{ row }">
      <span class="text-sm text-highlighted truncate max-w-40 block">
        {{ row.original.profiles?.nome?.trim() || EMPTY_VALUE }}
      </span>
    </template>

    <template #concluida_em-cell="{ row }">
      <span class="font-mono text-sm tabular-nums">
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
      <BaseEmptyState icon="i-lucide-trending-up">
        Nenhuma venda no período.
      </BaseEmptyState>
    </template>
  </UTable>
</template>
