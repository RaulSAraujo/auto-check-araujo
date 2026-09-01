<script setup lang="ts">
import { ORDER_ROUTES } from '../utils/order-routes'

defineOptions({ name: 'OrdersDetailPage' })

definePageMeta({
  path: '/ordens/:id',
  layout: 'app'
})

const route = useRoute()
const { startChecklist } = useOrderMutations()

const id = computed(() => route.params.id as string)
const startingChecklist = ref(false)

const { data: ordem, pending, refresh } = await useOrderQuery(id)

const {
  selectedStatus,
  savingStatus,
  statusItems,
  saveStatus
} = useOrderStatusEditor(id, ordem, refresh)

async function onStartChecklist() {
  startingChecklist.value = true
  try {
    await startChecklist(id.value)
  } finally {
    startingChecklist.value = false
  }
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="ordem?.numero || 'Ordem de Serviço'">
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
      <div
        v-if="pending && !ordem"
        class="p-6"
      >
        <USkeleton class="h-48 w-full max-w-2xl" />
      </div>

      <div
        v-else-if="ordem"
        class="p-4 sm:p-6 space-y-8 max-w-2xl"
      >
        <OrdersDetailSummary :ordem="ordem" />

        <OrdersStatusEditor
          :ordem="ordem"
          :selected-status="selectedStatus"
          :status-items="statusItems"
          :saving-status="savingStatus"
          @update:selected-status="selectedStatus = $event"
          @save="saveStatus"
        />

        <OrdersChecklistActions
          :ordem="ordem"
          :ordem-id="id"
          :starting-checklist="startingChecklist"
          @start-checklist="onStartChecklist"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
