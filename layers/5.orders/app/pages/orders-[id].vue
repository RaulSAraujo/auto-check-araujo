<script setup lang="ts">
import { ORDER_ROUTES } from '../utils/order-routes'
import {
  buildBudgetWhatsAppMessage,
  buildWhatsAppUrl
} from '../utils/print'
import { downloadBudgetPdf, printBudgetPdf } from '../utils/pdf'
import { primaryPhone } from '~~/shared/utils/contact'
import { formatTimeShort, schedulingDayPath } from '#layers/scheduling/app/utils/scheduling'
import { applyVoiceFields, voiceBudgetItem } from '#layers/base/app/utils/voice/apply'
import { VOICE_CATALOG } from '#layers/base/app/utils/voice/catalog'

defineOptions({ name: 'OrdersDetailPage' })

definePageMeta({
  path: '/ordens/:id'
})

const route = useRoute()
const router = useRouter()
const id = computed(() => route.params.id as string)
const allowLeave = ref(false)
const { back } = useSmartBack(ORDER_ROUTES.list)

/** Capture entry once so the trail stays stable while editing. */
const breadcrumbOrigin = resolveOrderBreadcrumbOrigin()

const [
  { data: ordem, pending, refresh },
  { data: budgetItems, refresh: refreshBudgetItems }
] = await Promise.all([
  useOrderQuery(id),
  useOrderItemsQuery(id)
])
const { state } = useOrderEditForm(ordem)

const { breadcrumbItems } = useOrderBreadcrumb({
  origin: breadcrumbOrigin,
  numero: () => ordem.value?.numero?.trim() || 'OS',
  vehicle: () => ordem.value?.veiculos
})

const {
  draft,
  selectedCatalogId,
  addModalOpen,
  adding,
  deletingId,
  updatingStatus,
  budgetStatus,
  canEditItems,
  canApproveBudget,
  total,
  catalogItems,
  isSuggestedCatalogPrice,
  onAddItem,
  onDeleteItem,
  onSubmitForApproval,
  onApprove,
  onReject,
  openVoiceItem
} = useOrderBudgetPage(id, ordem, budgetItems, refresh, refreshBudgetItems)

const {
  saving: savingForm,
  canEdit,
  isDirty: isFormDirty,
  discard: discardForm,
  save: saveForm
} = useOrderDetailEditor(id, ordem, state, refresh)

const {
  selectedStatus,
  savingStatus,
  statusItems,
  isDirty: isStatusDirty,
  concludeOpen,
  discard: discardStatus,
  resolveConclude,
  saveStatus
} = useOrderStatusEditor(id, ordem, refresh)

const ORDER_FORM_FIELDS = ['km_entrada', 'reclamacao', 'diagnostico', 'observacoes'] as const

useVoiceForm('order', {
  ops: ['edit'],
  apply: (draft) => {
    const { status, ...rest } = draft.fields
    const hasForm = ORDER_FORM_FIELDS.some(key => key in rest)
    if ((hasForm || status) && !canEdit.value) {
      useToast().add({ title: 'Esta OS não pode ser editada.', color: 'warning' })
      return
    }
    applyVoiceFields(state, rest, VOICE_CATALOG.order, { only: ORDER_FORM_FIELDS })
    if (typeof status === 'string') {
      if (statusItems.value.some(item => item.value === status)) selectedStatus.value = status
      else useToast().add({ title: 'Esse status não está disponível para esta OS.', color: 'warning' })
    }
  },
  onItems: async (items) => {
    await openVoiceItem(voiceBudgetItem(items[0]!))
    if (items.length > 1) useToast().add({ title: 'Só o primeiro item foi preenchido. Dite o próximo em seguida.', color: 'warning' })
  },
  currentId: () => id.value,
  label: () => ordem.value?.numero,
  accept: draft => draft.id === id.value,
  ready: () => !!ordem.value
})

const {
  state: paymentState,
  saving: savingPayment,
  canEditPayment,
  showPaymentSection,
  isDirty: isPaymentDirty,
  suggestedCharge,
  suggestedFee,
  applySuggestedCharge,
  markChargeTouched,
  discard: discardPayment,
  savePayment
} = useOrderPayment(id, ordem, refresh)

const isDirty = computed(() =>
  isFormDirty.value || isStatusDirty.value || isPaymentDirty.value
)

const saving = computed(() =>
  savingForm.value || savingStatus.value || savingPayment.value
)

function discard() {
  discardForm()
  discardStatus()
  discardPayment()
}

async function save() {
  if (isFormDirty.value) {
    const ok = await saveForm()
    if (!ok) return
  }
  if (isPaymentDirty.value) {
    const ok = await savePayment()
    if (!ok) return
  }
  if (isStatusDirty.value) {
    const ok = await saveStatus()
    if (!ok) return
  }
}

const budgetWhatsappUrl = computed(() => {
  if (!ordem.value) return null
  return buildWhatsAppUrl(
    primaryPhone(ordem.value.veiculos?.clientes?.telefones),
    buildBudgetWhatsAppMessage(ordem.value.numero)
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
      diagnostico: ordem.value.diagnostico,
      items: budgetItems.value || []
    })
  } finally {
    downloadingPdf.value = false
  }
}

function onPrintBudgetPdf() {
  if (!ordem.value || !import.meta.client) return
  const veiculo = ordem.value.veiculos
  printBudgetPdf({
    numero: ordem.value.numero,
    abertaEm: formatDateTime(ordem.value.aberta_em),
    budgetStatus: budgetStatus.value,
    clienteNome: veiculo?.clientes?.nome ?? null,
    placa: veiculo?.placa ?? null,
    veiculoLabel: [veiculo?.marca, veiculo?.modelo].filter(Boolean).join(' ') || null,
    kmEntrada: ordem.value.km_entrada,
    reclamacao: ordem.value.reclamacao,
    diagnostico: ordem.value.diagnostico,
    items: budgetItems.value || []
  })
}

const leaveOpen = ref(false)
const leaveTo = ref<string | null>(null)

function confirmLeaveWithoutSaving() {
  const destination = leaveTo.value
  leaveOpen.value = false
  leaveTo.value = null
  if (!destination) return
  allowLeave.value = true
  void router.push(destination)
}

watch(leaveOpen, (open) => {
  if (!open) leaveTo.value = null
})

const linkedAppointment = computed(() => {
  const rel = ordem.value?.agendamentos
  if (!rel) return null
  return Array.isArray(rel) ? rel[0] ?? null : rel
})

const appointmentAgendaHref = computed(() => {
  if (!linkedAppointment.value) return null
  return schedulingDayPath(new Date(linkedAppointment.value.inicio))
})

onBeforeRouteLeave((to, _from, next) => {
  if (allowLeave.value || saving.value || !isDirty.value) {
    next()
    return
  }

  leaveTo.value = to.fullPath
  leaveOpen.value = true
  next(false)
})

onMounted(() => {
  const onBeforeUnload = (event: BeforeUnloadEvent) => {
    if (!isDirty.value || allowLeave.value || saving.value) return
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
      <div
        v-if="pending && !ordem"
        class="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6"
      >
        <div class="space-y-2">
          <USkeleton class="h-4 w-64" />
          <USkeleton class="h-8 w-48" />
        </div>
        <USkeleton class="h-40 w-full rounded-xl" />
        <div class="grid gap-6 lg:grid-cols-2">
          <USkeleton class="h-64 w-full rounded-xl" />
          <USkeleton class="h-64 w-full rounded-xl" />
        </div>
      </div>

      <div
        v-else-if="ordem"
        class="mx-auto w-full max-w-6xl space-y-6 p-4 pb-28 sm:p-6 sm:pb-28"
      >
        <div class="space-y-3">
          <div class="flex items-center justify-between gap-3">
            <UBreadcrumb :items="breadcrumbItems" />
            <UButton
              color="neutral"
              variant="ghost"
              label="Voltar"
              icon="i-lucide-arrow-left"
              class="min-h-11 shrink-0 touch-manipulation active:scale-[0.98]"
              @click="back"
            />
          </div>

          <OrdersDetailHero
            :ordem="ordem"
            :selected-status="selectedStatus"
            :status-items="statusItems"
            :saving-status="savingStatus"
            :can-edit="canEdit"
            @update:selected-status="selectedStatus = $event"
          />
        </div>

        <UAlert
          v-if="linkedAppointment"
          color="info"
          variant="subtle"
          :title="`Agendado ~${formatTimeShort(linkedAppointment.inicio)}`"
          description="Horário vinculado na agenda."
        >
          <template
            v-if="appointmentAgendaHref"
            #actions
          >
            <UButton
              :to="appointmentAgendaHref"
              color="neutral"
              variant="outline"
              size="xs"
              label="Ver na agenda"
            />
          </template>
        </UAlert>

        <div class="grid min-w-0 items-stretch gap-6 lg:grid-cols-2 [&>*]:min-w-0">
          <section class="flex flex-col overflow-hidden rounded-2xl bg-default ring-1 ring-default/60">
            <div class="flex-1 p-5 pb-6 sm:p-6 sm:pb-7">
              <OrdersDetailResumoPanel
                v-model="state"
                :ordem="ordem"
                :can-edit="canEdit"
                @submit="save"
              />
            </div>
          </section>

          <section class="flex min-w-0 flex-col rounded-2xl bg-default p-5 pb-6 sm:p-6 sm:pb-7 ring-1 ring-default/60">
            <OrdersBudgetSection
              v-model:draft="draft"
              v-model:add-open="addModalOpen"
              class="flex flex-col"
              :items="budgetItems || []"
              :budget-status="budgetStatus"
              :can-edit-items="canEditItems"
              :can-approve="canApproveBudget"
              :total="total"
              :selected-catalog-id="selectedCatalogId"
              :catalog-items="catalogItems"
              :is-suggested-catalog-price="isSuggestedCatalogPrice"
              :adding="adding"
              :deleting-id="deletingId"
              :updating-status="updatingStatus"
              :print-to="ORDER_ROUTES.print(id)"
              :whatsapp-url="budgetWhatsappUrl"
              :pdf-loading="downloadingPdf"
              @update:selected-catalog-id="selectedCatalogId = $event"
              @print-pdf="onPrintBudgetPdf"
              @add="onAddItem"
              @delete="onDeleteItem"
              @submit-for-approval="onSubmitForApproval"
              @approve="onApprove"
              @reject="onReject"
              @download-pdf="onDownloadBudgetPdf"
            />
          </section>
        </div>

        <section class="rounded-2xl bg-default p-5 pb-6 sm:p-6 sm:pb-7 ring-1 ring-default/60">
          <OrdersPhotosSection
            :ordem-id="id"
            :can-edit="canEdit"
          />
        </section>

        <section
          v-if="showPaymentSection"
          class="rounded-2xl bg-default p-5 pb-6 sm:p-6 sm:pb-7 ring-1 ring-default/60"
        >
          <OrdersPaymentEditor
            v-model="paymentState"
            :ordem="ordem"
            :can-edit="canEditPayment"
            :suggested-charge="suggestedCharge"
            :suggested-fee="suggestedFee"
            @apply-suggested="applySuggestedCharge"
            @charge-touch="markChargeTouched"
          />
        </section>

        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="translate-y-4 opacity-0"
          enter-to-class="translate-y-0 opacity-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="translate-y-0 opacity-100"
          leave-to-class="translate-y-4 opacity-0"
        >
          <div
            v-if="isDirty"
            class="orders-detail-command fixed inset-x-4 bottom-[calc(3.5rem+env(safe-area-inset-bottom)+1rem)] z-30 mx-auto flex max-w-lg items-center gap-3 rounded-full border border-default/80 bg-default/95 px-4 py-2.5 backdrop-blur-md sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:bottom-4"
            role="status"
            aria-live="polite"
            style="padding-bottom: max(0.625rem, env(safe-area-inset-bottom))"
          >
            <span class="flex min-w-0 flex-1 items-center gap-2 text-sm text-muted">
              <span
                class="size-2 shrink-0 rounded-full bg-warning"
                aria-hidden="true"
              />
              Alterações pendentes
            </span>
            <UButton
              label="Descartar"
              color="neutral"
              variant="ghost"
              size="sm"
              :disabled="saving"
              class="active:scale-[0.98]"
              @click="discard"
            />
            <UButton
              :label="saving ? 'Salvando…' : 'Salvar'"
              color="primary"
              size="sm"
              :loading="saving"
              class="active:scale-[0.98]"
              @click="save"
            />
          </div>
        </Transition>

        <OrdersConfirmDialog
          v-model:open="leaveOpen"
          title="Sair sem salvar?"
          description="Há alterações não salvas nesta OS."
          confirm-label="Sair sem salvar"
          cancel-label="Continuar editando"
          confirm-color="error"
          @confirm="confirmLeaveWithoutSaving"
        />

        <OrdersConfirmDialog
          v-model:open="concludeOpen"
          title="Concluir esta OS?"
          description="Após concluir, não será possível alterar os dados nem o status."
          confirm-label="Concluir"
          confirm-color="primary"
          :loading="savingStatus"
          @confirm="resolveConclude(true)"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  .orders-detail-command {
    transition: none !important;
  }
}
</style>
