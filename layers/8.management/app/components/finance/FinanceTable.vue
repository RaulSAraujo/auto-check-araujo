<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { FinanceOrderRow } from '../../utils/finance'
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
  <div>
    <div class="space-y-2 md:hidden">
      <template v-if="loading">
        <USkeleton
          v-for="n in 3"
          :key="n"
          class="h-24 w-full rounded-xl"
        />
      </template>
      <template v-else-if="orders.length">
        <NuxtLink
          v-for="order in orders"
          :key="order.id"
          :to="ORDER_ROUTES.detail(order.id)"
          class="block rounded-xl bg-elevated/40 px-3 py-3 ring-1 ring-default/70"
        >
          <div class="flex items-center justify-between gap-3">
            <span class="font-mono font-semibold text-primary">{{ order.numero }}</span>
            <UBadge
              :color="order.pago ? 'success' : 'warning'"
              variant="subtle"
              size="sm"
            >{{ order.pago ? 'Pago' : 'Pendente' }}</UBadge>
          </div>
          <div class="mt-2 flex items-center justify-between gap-3 text-sm text-muted">
            <span class="font-mono">{{ order.veiculos ? formatPlaca(order.veiculos.placa) : EMPTY_VALUE }}</span>
            <span class="font-mono font-semibold text-highlighted">{{ order.valor_total != null ? formatMoney(Number(order.valor_total)) : EMPTY_VALUE }}</span>
          </div>
          <p class="mt-1 truncate font-mono text-xs text-muted">{{ order.concluida_em ? formatDateTime(order.concluida_em) : EMPTY_VALUE }} · {{ paymentLabel(order.forma_pagamento) }}</p>
        </NuxtLink>
      </template>
      <BaseEmptyState
        v-else
        icon="i-lucide-wallet"
      >
        Nenhuma OS concluída com valor neste mês.
      </BaseEmptyState>
    </div>
    <UTable
      :data="orders"
      :columns="columns"
      :loading="loading"
      class="hidden w-full md:block"
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
  </div>
</template>
