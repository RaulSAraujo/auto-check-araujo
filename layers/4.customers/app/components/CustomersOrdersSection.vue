<script setup lang="ts">
import type { OrdemStatus } from '~~/shared/types/oficina'
import type { CustomerOrderItem } from '../utils/customer-table-columns'
import { CUSTOMER_ORDER_COLUMNS } from '../utils/customer-table-columns'

defineOptions({ name: 'CustomersOrdersSection' })

defineProps<{
  ordens: CustomerOrderItem[]
  loading?: boolean
}>()
</script>

<template>
  <section class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-lg font-semibold text-highlighted">
        Histórico de OS
      </h2>
    </div>

    <UTable
      :data="ordens"
      :columns="CUSTOMER_ORDER_COLUMNS"
      :loading="loading"
      class="w-full"
    >
      <template #numero-cell="{ row }">
        <NuxtLink
          :to="`/ordens/${row.original.id}`"
          class="font-mono font-medium tabular-nums text-primary hover:underline"
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
          :color="ORDEM_STATUS_COLOR[row.original.status as OrdemStatus]"
          variant="subtle"
        >
          {{ ORDEM_STATUS_LABEL[row.original.status as OrdemStatus] }}
        </UBadge>
      </template>

      <template #aberta_em-cell="{ row }">
        <span class="font-mono tabular-nums">
          {{ formatDateTime(row.original.aberta_em) }}
        </span>
      </template>

      <template #actions-cell="{ row }">
        <UButton
          :to="`/ordens/${row.original.id}`"
          icon="i-lucide-chevron-right"
          color="neutral"
          variant="ghost"
          size="sm"
        />
      </template>

      <template #empty>
        <BaseEmptyState icon="i-lucide-clipboard-list">
          Nenhuma OS neste cliente.
        </BaseEmptyState>
      </template>
    </UTable>
  </section>
</template>
