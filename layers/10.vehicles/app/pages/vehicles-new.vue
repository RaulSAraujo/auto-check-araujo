<script setup lang="ts">
import { emptyVehicleForm, isVehicleFormDirty } from '../utils/vehicle-form'
import { VEHICLE_ROUTES } from '../utils/vehicle-routes'

defineOptions({ name: 'VehiclesNewPage' })

definePageMeta({
  path: '/veiculos/novo'
})

useSeoMeta({
  title: 'Novo veículo',
  description: 'Cadastrar veículo da oficina.'
})

const route = useRoute()
const router = useRouter()

const clienteId = (route.query.cliente_id as string) || ''
useRequirePermission('vehicles.write')
const { state } = useVehicleForm(undefined, clienteId)
const { clienteItems } = await useCustomerOptions()
const { createVehicle } = useVehicleMutations()

const initialState = emptyVehicleForm(clienteId)
const loading = ref(false)
const allowLeave = ref(false)

const isDirty = computed(() => isVehicleFormDirty(state, initialState))

const backFallback = computed(() =>
  clienteId ? `/clientes/${clienteId}` : VEHICLE_ROUTES.list
)
const { back } = useSmartBack(backFallback)

async function onSubmit() {
  loading.value = true
  try {
    const { data } = await createVehicle(state)
    if (data) {
      allowLeave.value = true
      await router.push(VEHICLE_ROUTES.detail(data.id))
    }
  } finally {
    loading.value = false
  }
}

onBeforeRouteLeave((_to, _from, next) => {
  if (allowLeave.value || loading.value || !isDirty.value) {
    next()
    return
  }

  const confirmed = window.confirm(
    'Há alterações não salvas. Sair sem cadastrar o veículo?'
  )
  next(confirmed)
})

onMounted(() => {
  const onBeforeUnload = (event: BeforeUnloadEvent) => {
    if (!isDirty.value || allowLeave.value || loading.value) return
    event.preventDefault()
    event.returnValue = ''
  }

  window.addEventListener('beforeunload', onBeforeUnload)
  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', onBeforeUnload)
  })
})
</script>

<template>
  <UDashboardPanel>
    <template #body>
      <div class="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-6">
        <BasePageHeader
          title="Novo veículo"
          description="Placa e proprietário para ligar ao cliente."
        >
          <template #actions>
            <UButton
              color="neutral"
              variant="ghost"
              label="Voltar"
              icon="i-lucide-arrow-left"
              @click="back"
            />
          </template>
        </BasePageHeader>

        <VehiclesNewForm
          v-model="state"
          :cliente-items="clienteItems"
          :cancel-to="backFallback"
          :loading="loading"
          @submit="onSubmit"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
