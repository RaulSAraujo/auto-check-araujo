<script setup lang="ts">
import { ORDER_ROUTES } from '../utils/order-routes'
import {
  absolutePrintUrl,
  buildBudgetWhatsAppMessage,
  buildWhatsAppUrl
} from '../utils/print'
import { downloadBudgetPdf } from '../utils/pdf'
import { primaryPhone } from '~~/shared/utils/contact'

defineOptions({ name: 'OrdersDetailPage' })

definePageMeta({
  path: '/ordens/:id'
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

const {
  state: paymentState,
  saving: savingPayment,
  canEditPayment,
  showPaymentSection,
  savePayment
} = useOrderPayment(id, ordem, refresh)

const { ensureToken } = useOrderPublicToken()
const publicToken = ref<string | null>(null)

const canShareBudget = computed(() =>
  budgetStatus.value === 'aguardando_aprovacao' || budgetStatus.value === 'aprovado'
)

watch(
  [ordem, canShareBudget],
  async () => {
    if (!ordem.value || !canShareBudget.value) {
      publicToken.value = null
      return
    }

    const token = await ensureToken(
      id.value,
      ordem.value.orcamento_public_token ?? null
    )

    publicToken.value = token

    if (token && !ordem.value.orcamento_public_token) {
      await refresh()
    }
  },
  { immediate: true }
)

const budgetPublicUrl = computed(() => {
  if (!publicToken.value) return null
  return absolutePrintUrl(ORDER_ROUTES.publicBudget(publicToken.value))
})

async function onStartChecklist() {
  startingChecklist.value = true
  try {
    await startChecklist(id.value)
  } finally {
    startingChecklist.value = false
  }
}

const budgetWhatsappUrl = computed(() => {
  if (!ordem.value || !budgetPublicUrl.value) return null
  return buildWhatsAppUrl(
    primaryPhone(ordem.value.veiculos?.clientes?.telefones),
    buildBudgetWhatsAppMessage(
      ordem.value.numero,
      budgetPublicUrl.value
    )
  )
})

const downloadingPdf = ref(false)

async function onDownloadBudgetPdf() {
  if (!ordem.value || !import.meta.client) return
  downloadingPdf.value = true
  try {
    const veiculo = ordem.value.veiculos
    await downloadBudgetPdf({
      numero: ordem.value.numero,
      abertaEm: formatDateTime(ordem.value.aberta_em),
      budgetStatus: budgetStatus.value,
      clienteNome: veiculo?.clientes?.nome ?? null,
      placa: veiculo?.placa ?? null,
      veiculoLabel: [veiculo?.marca, veiculo?.modelo].filter(Boolean).join(' ') || null,
      kmEntrada: ordem.value.km_entrada,
      reclamacao: ordem.value.reclamacao,
      items: budgetItems.value || []
    })
  } finally {
    downloadingPdf.value = false
  }
}
</script>

<template>
  <UDashboardPanel>
    <template #body>
      <div
        v-if="pending && !ordem"
        class="p-6"
      >
        <BasePageHeader title="Ordem de Serviço" />
        <USkeleton class="mt-4 h-48 w-full max-w-2xl" />
      </div>

      <div
        v-else-if="ordem"
        class="p-4 sm:p-6 space-y-8 max-w-3xl"
      >
        <BasePageHeader :title="ordem.numero || 'Ordem de Serviço'">
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
          class="border-t border-default pt-8"
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
          :print-to="ORDER_ROUTES.print(id)"
          :public-url="budgetPublicUrl"
          :whatsapp-url="budgetWhatsappUrl"
          :pdf-loading="downloadingPdf"
          @update:selected-catalog-id="selectedCatalogId = $event"
          @add="onAddItem"
          @delete="onDeleteItem"
          @submit-for-approval="onSubmitForApproval"
          @approve="onApprove"
          @reject="onReject"
          @reopen="onReopen"
          @download-pdf="onDownloadBudgetPdf"
        />

        <OrdersStatusEditor
          v-if="statusItems.length > 1"
          class="border-t border-default pt-8"
          :ordem="ordem"
          :selected-status="selectedStatus"
          :status-items="statusItems"
          :saving-status="savingStatus"
          @update:selected-status="selectedStatus = $event"
          @save="saveStatus"
        />

        <OrdersChecklistActions
          class="border-t border-default pt-8"
          :ordem="ordem"
          :ordem-id="id"
          :starting-checklist="startingChecklist"
          @start-checklist="onStartChecklist"
        />

        <OrdersPaymentEditor
          v-if="showPaymentSection"
          v-model="paymentState"
          class="border-t border-default pt-8"
          :ordem="ordem"
          :can-edit="canEditPayment"
          :saving="savingPayment"
          @save="savePayment"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
