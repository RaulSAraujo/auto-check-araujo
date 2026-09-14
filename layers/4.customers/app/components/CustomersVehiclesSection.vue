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
      <h2 class="text-sm font-semibold uppercase tracking-widest text-muted">
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

    <div class="space-y-2 md:hidden">
      <template v-if="loading">
        <USkeleton
          v-for="n in 2"
          :key="n"
          class="h-24 w-full rounded-xl"
        />
      </template>

      <template v-else-if="veiculos.length">
        <NuxtLink
          v-for="veiculo in veiculos"
          :key="veiculo.id"
          :to="`/veiculos/${veiculo.id}`"
          class="group block min-h-24 rounded-xl bg-elevated/40 px-3 py-3 ring-1 ring-default/70 transition-colors active:bg-elevated"
        >
          <span class="flex items-center justify-between gap-3">
            <span class="font-mono font-semibold tracking-wide text-highlighted">{{ formatPlaca(veiculo.placa) }}</span>
            <UIcon
              name="i-lucide-chevron-right"
              class="size-5 shrink-0 text-dimmed transition-transform group-active:translate-x-0.5"
            />
          </span>
          <span class="mt-2 block truncate text-sm text-muted">{{ [veiculo.marca, veiculo.modelo].filter(Boolean).join(' ') || EMPTY_VALUE }}</span>
          <span class="mt-1 block text-xs text-muted">{{ veiculo.ano ?? EMPTY_VALUE }}</span>
        </NuxtLink>
      </template>

      <BaseEmptyState
        v-else
        icon="i-lucide-car"
      >
        Nenhum veículo vinculado.
      </BaseEmptyState>
    </div>

    <UTable
      :data="veiculos"
      :columns="CUSTOMER_VEHICLE_COLUMNS"
      :loading="loading"
      class="hidden w-full md:block"
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
        <BaseEmptyState icon="i-lucide-car">
          Nenhum veículo vinculado.
          <template
            v-if="can('vehicles.write')"
            #actions
          >
            <UButton
              :to="CUSTOMER_ROUTES.newVehicle(clienteId)"
              icon="i-lucide-plus"
              label="Adicionar veículo"
              size="sm"
            />
          </template>
        </BaseEmptyState>
      </template>
    </UTable>
  </section>
</template>
