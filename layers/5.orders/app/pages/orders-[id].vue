<script setup lang="ts">
import { ORDER_ROUTES } from '../utils/order-routes'
import {
  absolutePrintUrl,
  buildBudgetWhatsAppMessage,
  buildWhatsAppUrl
} from '../utils/print'

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
const { data: budgetItems, refresh: refreshBudgetItems } = await useOrderItemsQuery(id)
const { state } = useOrderEditForm(ordem)

const {
  draft,
  selectedCatalogId,
  adding,
  deletingId,
  updatingStatus,
  budgetStatus,
  canEditItems,
  canApproveBudget,
  total,
  catalogItems,
  onAddItem,
  onDeleteItem,
  onSubmitForApproval,
  onApprove,
  onReject,
  onReopen
} = useOrderBudgetPage(id, ordem, budgetItems, refresh, refreshBudgetItems)

const {
  editing,
  saving,
  canEdit,
  cancelEdit,
  save
} = useOrderDetailEditor(id, ordem, state, refresh)

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

const budgetWhatsappUrl = computed(() => {
  if (!ordem.value) return null
  return buildWhatsAppUrl(
    ordem.value.veiculos?.clientes?.telefone,
    buildBudgetWhatsAppMessage(
      ordem.value.numero,
      absolutePrintUrl(ORDER_ROUTES.print(id.value))
    )
  )
})
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
        class="p-4 sm:p-6 space-y-8 max-w-3xl"
      >
        <section class="space-y-4">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-lg font-semibold text-highlighted">
              Dados da OS
            </h2>
            <UButton
              v-if="canEdit && !editing"
              label="Editar"
              icon="i-lucide-pencil"
              color="neutral"
              variant="soft"
              size="sm"
              @click="editing = true"
            />
          </div>

          <OrdersDetailSummary
            :ordem="ordem"
            :hide-fields="editing"
          />

          <OrdersDetailForm
            v-if="editing"
            v-model="state"
            :disabled="false"
            @submit="save"
          >
            <div class="flex gap-2">
              <UButton
                type="submit"
                label="Salvar"
                :loading="saving"
              />
              <UButton
                label="Cancelar"
                color="neutral"
                variant="ghost"
                @click="cancelEdit"
              />
            </div>
          </OrdersDetailForm>
        </section>

        <OrdersBudgetSection
          v-model:draft="draft"
          :items="budgetItems || []"
          :budget-status="budgetStatus"
          :can-edit-items="canEditItems"
          :can-approve="canApproveBudget"
          :total="total"
          :selected-catalog-id="selectedCatalogId"
          :catalog-items="catalogItems"
          :adding="adding"
          :deleting-id="deletingId"
          :updating-status="updatingStatus"
          @update:selected-catalog-id="selectedCatalogId = $event"
          @add="onAddItem"
          @delete="onDeleteItem"
          @submit-for-approval="onSubmitForApproval"
          @approve="onApprove"
          @reject="onReject"
          @reopen="onReopen"
          :print-to="ORDER_ROUTES.print(id)"
          :whatsapp-url="budgetWhatsappUrl"
        />

        <OrdersStatusEditor
          v-if="statusItems.length > 1"
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
