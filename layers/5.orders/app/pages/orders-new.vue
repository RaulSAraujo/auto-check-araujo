<script setup lang="ts">
import {
  emptyOrderForm,
  isOrderFormDirty
} from '../utils/order-form'
import { ORDER_ROUTES } from '../utils/order-routes'

defineOptions({ name: 'OrdersNewPage' })

definePageMeta({
  path: '/ordens/novo'
})

const route = useRoute()
const router = useRouter()
useRequirePermission('orders.create')

const { createOrder } = useOrderMutations()
const {
  veiculoItems,
  findVehicle,
  pending: vehiclesPending,
  error: vehiclesError,
  refresh: refreshVehicles
} = await useOrderVehicleOptions()

const initialVeiculoId = (route.query.veiculo_id as string) || ''
const initialState = emptyOrderForm(initialVeiculoId)
const state = reactive(emptyOrderForm(initialVeiculoId))
const loading = ref(false)
const allowLeave = ref(false)

const selectedVehicle = computed(() => findVehicle(state.veiculo_id))
const isDirty = computed(() => isOrderFormDirty(state, initialState))

async function onSubmit() {
  loading.value = true
  try {
    const { data } = await createOrder(state)
    if (data) {
      allowLeave.value = true
      await router.push(ORDER_ROUTES.detail(data.id))
    }
  } finally {
    loading.value = false
  }
}

async function retryVehicles() {
  await refreshVehicles()
}

onBeforeRouteLeave((_to, _from, next) => {
  if (allowLeave.value || loading.value || !isDirty.value) {
    next()
    return
  }

  const confirmed = window.confirm(
    'Há alterações não salvas. Sair sem abrir a OS?'
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
          title="Nova OS"
          description="Selecione o veículo e registre o motivo da visita."
        >
          <template #actions>
            <UButton
              :to="ORDER_ROUTES.list"
              color="neutral"
              variant="ghost"
              label="Voltar"
              icon="i-lucide-arrow-left"
            />
          </template>
        </BasePageHeader>

        <OrdersNewForm
          v-model="state"
          :veiculo-items="veiculoItems"
          :selected-vehicle="selectedVehicle"
          :loading="loading"
          :vehicles-pending="vehiclesPending"
          :vehicles-error="Boolean(vehiclesError)"
          @submit="onSubmit"
          @retry-vehicles="retryVehicles"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
