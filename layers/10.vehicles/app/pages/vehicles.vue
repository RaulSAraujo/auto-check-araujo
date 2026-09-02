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
      <UDashboardNavbar title="Gestão de Veículos">
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
        <p class="text-sm text-muted max-w-2xl">
          Todo o histórico de cada veículo em poucos segundos.
        </p>

        <UInput
          v-model="q"
          icon="i-lucide-search"
          placeholder="Pesquisar por placa…"
          class="max-w-md font-mono uppercase"
          autocomplete="off"
          spellcheck="false"
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
