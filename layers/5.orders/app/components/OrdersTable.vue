<script setup lang="ts">
import type { OrdemStatus } from '~~/shared/types/oficina'
import type { OrderListItem } from '../types/orders'
import { ORDER_LIST_COLUMNS } from '../utils/order-table-columns'
import { ORDER_ROUTES } from '../utils/order-routes'

defineOptions({ name: 'OrdersTable' })

defineProps<{
  ordens: OrderListItem[]
  loading?: boolean
}>()
</script>

<template>
  <UTable
    :data="ordens"
    :columns="ORDER_LIST_COLUMNS"
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

    <template #status-cell="{ row }">
      <UBadge
        :color="ORDEM_STATUS_COLOR[row.original.status as OrdemStatus] || 'neutral'"
        variant="subtle"
      >
        {{ ORDEM_STATUS_LABEL[row.original.status as OrdemStatus] || row.original.status }}
      </UBadge>
    </template>

    <template #pagamento-cell="{ row }">
      <UBadge
        v-if="row.original.status === 'concluida' && row.original.valor_total != null"
        :color="row.original.pago ? 'success' : 'warning'"
        variant="subtle"
        size="sm"
      >
        {{ row.original.pago ? 'Pago' : 'Pendente' }}
      </UBadge>
      <span
        v-else
        class="text-muted"
      >{{ EMPTY_VALUE }}</span>
    </template>

    <template #aberta_em-cell="{ row }">
      <span class="font-mono tabular-nums">
        {{ formatDateTime(row.original.aberta_em) }}
      </span>
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
      <BaseEmptyState icon="i-lucide-clipboard-list">
        Nenhuma OS encontrada.
        <template #actions>
          <UButton
            :to="ORDER_ROUTES.new"
            icon="i-lucide-plus"
            label="Nova OS"
            size="sm"
          />
        </template>
      </BaseEmptyState>
    </template>
  </UTable>
</template>
