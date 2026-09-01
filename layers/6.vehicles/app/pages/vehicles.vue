<script setup lang="ts">
defineOptions({ name: 'VehiclesIndexPage' })

definePageMeta({
  path: '/veiculos',
  layout: 'app'
})

const { q, page, pageSize, total, veiculos, pending } = await useVehiclesList()
const { can } = usePermissions()
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Veículos">
        <template #leading>
          <UDashboardSidebarToggle />
        </template>
        <template #right>
          <UButton
            v-if="can('vehicles.write')"
            :to="VEHICLE_ROUTES.new"
            icon="i-lucide-plus"
            label="Novo veículo"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-4 sm:p-6 space-y-4">
        <UInput
          v-model="q"
          icon="i-lucide-search"
          placeholder="Buscar por placa, marca ou modelo"
          class="max-w-md"
        />

        <VehiclesTable
          :veiculos="veiculos"
          :loading="pending"
        />

        <div
          v-if="total > pageSize"
          class="flex justify-center pt-2"
        >
          <UPagination
            v-model:page="page"
            :total="total"
            :items-per-page="pageSize"
            show-edges
            :sibling-count="1"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
