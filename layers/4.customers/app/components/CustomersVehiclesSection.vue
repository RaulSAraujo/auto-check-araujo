<script setup lang="ts">
import type { Veiculo } from '~~/shared/types/database'
import { CUSTOMER_VEHICLE_COLUMNS } from '../utils/customer-table-columns'
import { CUSTOMER_ROUTES } from '../utils/customer-routes'

defineOptions({ name: 'CustomersVehiclesSection' })

defineProps<{
  clienteId: string
  veiculos: Veiculo[]
  loading?: boolean
}>()

const { can } = usePermissions()
</script>

<template>
  <section class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-lg font-semibold text-highlighted">
        Veículos
      </h2>
      <UButton
        v-if="can('vehicles.write')"
        :to="CUSTOMER_ROUTES.newVehicle(clienteId)"
        icon="i-lucide-plus"
        label="Adicionar veículo"
        size="sm"
      />
    </div>

    <UTable
      :data="veiculos"
      :columns="CUSTOMER_VEHICLE_COLUMNS"
      :loading="loading"
      class="w-full"
    >
      <template #placa-cell="{ row }">
        <span class="font-mono tracking-wide">
          {{ formatPlaca(row.original.placa) }}
        </span>
      </template>

      <template #actions-cell="{ row }">
        <UButton
          :to="`/veiculos/${row.original.id}`"
          icon="i-lucide-chevron-right"
          color="neutral"
          variant="ghost"
          size="sm"
        />
      </template>

      <template #empty>
        <div class="text-center py-6 text-muted">
          Nenhum Veículo vinculado.
        </div>
      </template>
    </UTable>
  </section>
</template>
