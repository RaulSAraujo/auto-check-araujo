<script setup lang="ts">
defineOptions({ name: 'VehiclesIndexPage' })

definePageMeta({
  path: '/veiculos'
})

const { q, page, pageSize, total, veiculos, pending } = await useVehiclesList()
const { can } = usePermissions()
</script>

<template>
  <UDashboardPanel>
    <template #body>
      <div class="p-4 sm:p-6 space-y-4">
        <BasePageHeader
          title="Gestão de Veículos"
          description="Todo o histórico de cada veículo em poucos segundos."
        >
          <template #actions>
            <UButton
              v-if="can('vehicles.write')"
              :to="VEHICLE_ROUTES.new"
              icon="i-lucide-plus"
              label="Novo veículo"
              class="w-full justify-center sm:w-auto"
            />
          </template>
        </BasePageHeader>

        <UInput
          v-model="q"
          icon="i-lucide-search"
          placeholder="Pesquisar por placa…"
          class="w-full font-mono uppercase sm:max-w-md"
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
