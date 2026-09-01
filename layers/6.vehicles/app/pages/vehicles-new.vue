<script setup lang="ts">
defineOptions({ name: 'VehiclesNewPage' })

definePageMeta({
  path: '/veiculos/novo',
  layout: 'app'
})

const route = useRoute()
const router = useRouter()

const clienteId = (route.query.cliente_id as string) || ''
useRequirePermission('vehicles.write')
const { state } = useVehicleForm(undefined, clienteId)
const { clienteItems } = await useCustomerOptions()
const { createVehicle } = useVehicleMutations()

const loading = ref(false)

async function onSubmit() {
  loading.value = true
  try {
    const { data } = await createVehicle(state)
    if (data) {
      await router.push(VEHICLE_ROUTES.detail(data.id))
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Novo veículo">
        <template #leading>
          <UDashboardSidebarToggle />
        </template>
        <template #right>
          <UButton
            :to="VEHICLE_ROUTES.list"
            color="neutral"
            variant="ghost"
            label="Voltar"
            icon="i-lucide-arrow-left"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-4 sm:p-6 max-w-xl">
        <VehiclesForm
          v-model="state"
          :cliente-items="clienteItems"
          compact
          @submit="onSubmit"
        >
          <div class="flex gap-2">
            <UButton
              type="submit"
              label="Salvar"
              :loading="loading"
            />
            <UButton
              :to="VEHICLE_ROUTES.list"
              label="Cancelar"
              color="neutral"
              variant="ghost"
            />
          </div>
        </VehiclesForm>
      </div>
    </template>
  </UDashboardPanel>
</template>
