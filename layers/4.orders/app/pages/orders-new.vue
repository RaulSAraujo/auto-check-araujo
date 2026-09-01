<script setup lang="ts">
import { emptyOrderForm } from '../utils/order-form'
import { ORDER_ROUTES } from '../utils/order-routes'

defineOptions({ name: 'OrdersNewPage' })

definePageMeta({
  path: '/ordens/novo',
  layout: 'app'
})

const route = useRoute()
const router = useRouter()
const { createOrder } = useOrderMutations()
const { veiculoItems } = await useOrderVehicleOptions()

const state = reactive(emptyOrderForm((route.query.veiculo_id as string) || ''))
const loading = ref(false)

async function onSubmit() {
  loading.value = true
  try {
    const { data } = await createOrder(state)
    if (data) {
      await router.push(ORDER_ROUTES.detail(data.id))
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Nova Ordem de Serviço">
        <template #leading>
          <UDashboardSidebarToggle />
        </template>
        <template #right>
          <UButton
            :to="ORDER_ROUTES.list"
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
        <OrdersNewForm
          :state="state"
          :veiculo-items="veiculoItems"
          :loading="loading"
          @submit="onSubmit"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
