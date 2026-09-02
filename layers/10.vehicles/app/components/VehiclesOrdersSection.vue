<script setup lang="ts">
import type { OrdemServico } from '~~/shared/types/database'
import type { OrdemStatus } from '~~/shared/types/oficina'
import { VEHICLE_ORDER_COLUMNS } from '../utils/vehicle-table-columns'
import { VEHICLE_ROUTES } from '../utils/vehicle-routes'

defineOptions({ name: 'VehiclesOrdersSection' })

defineProps<{
  veiculoId: string
  ordens: OrdemServico[]
  loading?: boolean
}>()

const { can } = usePermissions()
</script>

<template>
  <section class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-lg font-semibold text-highlighted">
        Histórico de ordens
      </h2>
      <UButton
        v-if="can('orders.create')"
        :to="VEHICLE_ROUTES.newOrder(veiculoId)"
        icon="i-lucide-plus"
        label="Nova OS"
        size="sm"
      />
    </div>

    <UTable
      :data="ordens"
      :columns="VEHICLE_ORDER_COLUMNS"
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
        <BaseEmptyState>
          Nenhuma OS para este veículo.
          <template
            v-if="can('orders.create')"
            #actions
          >
            <UButton
              :to="VEHICLE_ROUTES.newOrder(veiculoId)"
              icon="i-lucide-plus"
              label="Nova OS"
              size="sm"
            />
          </template>
        </BaseEmptyState>
      </template>
    </UTable>
  </section>
</template>
