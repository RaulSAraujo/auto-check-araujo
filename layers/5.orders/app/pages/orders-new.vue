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

const supabase = useTypedSupabaseClient()
const { createOrder } = useOrderMutations()
const {
  veiculoItems,
  findVehicle,
  pending: vehiclesPending,
  error: vehiclesError,
  refresh: refreshVehicles
} = await useOrderVehicleOptions()

const agendamentoId = computed(() =>
  typeof route.query.agendamento_id === 'string' ? route.query.agendamento_id : ''
)
const initialVeiculoId = (route.query.veiculo_id as string) || ''

const { data: linkedAppointment } = await useAsyncData(
  () => `order-new-appointment-${agendamentoId.value}`,
  async () => {
    if (!agendamentoId.value) return null
    const { data, error } = await supabase
      .from('agendamentos')
      .select('id, veiculo_id, servico, observacoes, ordem_servico_id')
      .eq('id', agendamentoId.value)
      .maybeSingle()
    if (error) throw error
    return data
  }
)

if (linkedAppointment.value?.ordem_servico_id) {
  await navigateTo(ORDER_ROUTES.detail(linkedAppointment.value.ordem_servico_id))
}

const initialState = emptyOrderForm(
  linkedAppointment.value?.veiculo_id || initialVeiculoId
)
if (linkedAppointment.value?.servico) {
  initialState.reclamacao = linkedAppointment.value.servico
}
if (linkedAppointment.value?.observacoes) {
  initialState.observacoes = linkedAppointment.value.observacoes
}

const state = reactive({ ...initialState })
const loading = ref(false)
const allowLeave = ref(false)

const selectedVehicle = computed(() => findVehicle(state.veiculo_id))
const isDirty = computed(() => isOrderFormDirty(state, initialState))

async function onSubmit() {
  loading.value = true
  try {
    const { data } = await createOrder(state, {
      agendamentoId: agendamentoId.value || undefined
    })
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
          :description="agendamentoId
            ? 'OS a partir do agendamento. Confira o veículo e o motivo da visita.'
            : 'Selecione o veículo e registre o motivo da visita.'"
        >
          <template #actions>
            <UButton
              :to="agendamentoId ? APP_ROUTES.scheduling : ORDER_ROUTES.list"
              color="neutral"
              variant="ghost"
              label="Voltar"
              icon="i-lucide-arrow-left"
            />
          </template>
        </BasePageHeader>

        <UAlert
          v-if="agendamentoId"
          color="info"
          variant="subtle"
          title="Vinculada à agenda"
          description="Ao abrir, este horário passa a em atendimento e o card entra no Kanban."
        />

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
