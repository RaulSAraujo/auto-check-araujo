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

    <template #status-cell="{ row }">
      <UBadge
        :color="ORDEM_STATUS_COLOR[row.original.status as OrdemStatus] || 'neutral'"
        variant="subtle"
      >
        {{ ORDEM_STATUS_LABEL[row.original.status as OrdemStatus] || row.original.status }}
      </UBadge>
    </template>

    <template #aberta_em-cell="{ row }">
      {{ formatDateTime(row.original.aberta_em) }}
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
        Nenhuma Ordem de Serviço encontrada.
      </div>
    </template>
  </UTable>
</template>
