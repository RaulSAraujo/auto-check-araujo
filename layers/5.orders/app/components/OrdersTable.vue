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

const mobileDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit'
})

function formatMobileOpenedAt(value: string) {
  return mobileDateFormatter.format(new Date(value)).replace('.', '')
}

function vehicleModel(order: OrderListItem) {
  return [order.veiculos?.marca, order.veiculos?.modelo].filter(Boolean).join(' ')
}
</script>

<template>
  <div class="space-y-2 md:hidden">
    <template v-if="loading">
      <USkeleton
        v-for="n in 3"
        :key="n"
        class="h-24 w-full"
      />
    </template>

    <template v-else-if="ordens.length">
      <NuxtLink
        v-for="ordem in ordens"
        :key="ordem.id"
        :to="ORDER_ROUTES.detail(ordem.id)"
        class="block min-h-24 rounded-lg border border-default bg-default px-3 py-3 active:bg-elevated"
      >
        <span class="flex items-center justify-between gap-3">
          <span class="font-mono font-medium tabular-nums text-primary">{{ ordem.numero }}</span>
          <UBadge
            :color="ORDEM_STATUS_COLOR[ordem.status as OrdemStatus] || 'neutral'"
            variant="subtle"
            size="sm"
          >
            {{ ORDEM_STATUS_LABEL[ordem.status as OrdemStatus] || ordem.status }}
          </UBadge>
        </span>
        <span class="mt-2 flex min-w-0 items-center justify-between gap-3 text-sm">
          <span class="min-w-0 truncate text-highlighted">
            <span class="font-mono font-medium tracking-wide">{{ ordem.veiculos ? formatPlaca(ordem.veiculos.placa) : EMPTY_VALUE }}</span>
            <span
              v-if="ordem.veiculos?.marca || ordem.veiculos?.modelo"
              class="text-muted"
            > · {{ vehicleModel(ordem) }}</span>
          </span>
          <time class="shrink-0 text-xs tabular-nums text-muted">{{ formatMobileOpenedAt(ordem.aberta_em) }}</time>
        </span>
        <span class="mt-1 block truncate text-sm text-muted">
          {{ ordem.veiculos?.clientes?.nome || EMPTY_VALUE }}
        </span>
      </NuxtLink>
    </template>

    <BaseEmptyState
      v-else
      icon="i-lucide-clipboard-list"
    >
      Nenhuma OS encontrada.
    </BaseEmptyState>
  </div>

  <UTable
    :data="ordens"
    :columns="ORDER_LIST_COLUMNS"
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

    <template #cliente-cell="{ row }">
      <span class="truncate">
        {{ row.original.veiculos?.clientes?.nome || EMPTY_VALUE }}
      </span>
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
