<script setup lang="ts">
import type { VeiculoComCliente } from '../utils/vehicle-types'
import { VEHICLE_LIST_COLUMNS } from '../utils/vehicle-table-columns'
import { VEHICLE_ROUTES } from '../utils/vehicle-routes'

defineOptions({ name: 'VehiclesTable' })

defineProps<{
  veiculos: VeiculoComCliente[]
  loading?: boolean
}>()
</script>

<template>
  <UTable
    :data="veiculos"
    :columns="VEHICLE_LIST_COLUMNS"
    :loading="loading"
    class="w-full"
  >
    <template #placa-cell="{ row }">
      <NuxtLink
        :to="VEHICLE_ROUTES.detail(row.original.id)"
        class="font-mono tracking-wide hover:underline"
      >
        {{ formatPlaca(row.original.placa) }}
      </NuxtLink>
    </template>

    <template #cliente-cell="{ row }">
      <NuxtLink
        v-if="row.original.clientes"
        :to="VEHICLE_ROUTES.customerDetail(row.original.clientes.id)"
        class="text-primary hover:underline"
      >
        {{ row.original.clientes.nome }}
      </NuxtLink>
      <span
        v-else
        class="text-muted"
      >—</span>
    </template>

    <template #actions-cell="{ row }">
      <UButton
        :to="VEHICLE_ROUTES.detail(row.original.id)"
        icon="i-lucide-chevron-right"
        color="neutral"
        variant="ghost"
        size="sm"
        aria-label="Abrir veículo"
      />
    </template>

    <template #empty>
      <div class="text-center py-8 text-muted">
        Nenhum Veículo encontrado.
      </div>
    </template>
  </UTable>
</template>
