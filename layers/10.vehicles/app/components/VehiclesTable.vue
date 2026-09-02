<script setup lang="ts">
import type { VeiculoComCliente } from '../utils/vehicle-types'
import { VEHICLE_LIST_COLUMNS } from '../utils/vehicle-table-columns'
import { VEHICLE_ROUTES } from '../utils/vehicle-routes'

defineOptions({ name: 'VehiclesTable' })

defineProps<{
  veiculos: VeiculoComCliente[]
  loading?: boolean
}>()

function formatKm(value: number | null | undefined) {
  if (value == null) return EMPTY_VALUE
  return value.toLocaleString('pt-BR')
}
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

    <template #marca-cell="{ row }">
      {{ row.original.marca || EMPTY_VALUE }}
    </template>

    <template #modelo-cell="{ row }">
      {{ row.original.modelo || EMPTY_VALUE }}
    </template>

    <template #ano-cell="{ row }">
      <span class="font-mono tabular-nums">
        {{ row.original.ano ?? EMPTY_VALUE }}
      </span>
    </template>

    <template #cor-cell="{ row }">
      {{ row.original.cor || EMPTY_VALUE }}
    </template>

    <template #km_atual-cell="{ row }">
      <span class="font-mono tabular-nums">
        {{ formatKm(row.original.km_atual) }}
      </span>
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
      >{{ EMPTY_VALUE }}</span>
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
      <BaseEmptyState icon="i-lucide-car">
        Nenhum veículo encontrado.
        <template #actions>
          <UButton
            :to="VEHICLE_ROUTES.new"
            icon="i-lucide-plus"
            label="Novo veículo"
            size="sm"
          />
        </template>
      </BaseEmptyState>
    </template>
  </UTable>
</template>
