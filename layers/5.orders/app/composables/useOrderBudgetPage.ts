import type { OrderDetail } from '../types/orders'
import type { OrdemItem } from '~~/shared/types/database'
import type { OrcamentoStatus, OrdemStatus } from '~~/shared/types/oficina'
import { isBudgetEditable, ORDEM_ITEM_TIPO_LABEL } from '~~/shared/types/oficina'
import {
  calcItemsTotal,
  emptyOrderItemDraft,
  isOrderItemDraftValid,
  type OrderItemDraft
} from '../utils/budget'
import {
  emptyPricingDraft,
  pricingDraftFromRow,
  resolveCatalogUnitPrice,
  type PricingParamsRow
} from '#layers/configuration/app/utils/pricing'
import type { VoiceBudgetItemDraft } from '#layers/base/app/utils/voice/types'

export function useOrderBudgetPage(
  orderId: MaybeRefOrGetter<string>,
  ordem: Ref<OrderDetail | null | undefined>,
  items: Ref<OrdemItem[] | null | undefined>,
  refreshOrder: () => Promise<void>,
  refreshItems: () => Promise<void>
) {
  const { data: catalog } = useServiceCatalog()
  const { params } = usePricingParams()
  const { can } = usePermissions()
  const {
    addOrderItem,
    deleteOrderItem,
    updateBudgetStatus
  } = useOrderBudgetMutations()

  const draft = reactive<OrderItemDraft>(emptyOrderItemDraft())
  const selectedCatalogId = ref<string | undefined>()
  const addModalOpen = ref(false)
  const adding = ref(false)
  const deletingId = ref<string | null>(null)
  const updatingStatus = ref(false)

  const budgetStatus = computed(() => (ordem.value?.orcamento_status || 'rascunho') as OrcamentoStatus)

  const canEditItems = computed(() => {
    if (!can('budget.edit')) return false
    if (!ordem.value) return false
    return isBudgetEditable(
      ordem.value.status as OrdemStatus,
      budgetStatus.value
    )
  })

  const canApproveBudget = computed(() => can('budget.approve'))

  const total = computed(() => calcItemsTotal(items.value || []))

  const pricingDraft = computed(() => {
    const row = params.value as PricingParamsRow | null
    return row ? pricingDraftFromRow(row) : emptyPricingDraft()
  })

  function catalogUnitPrice(entry: NonNullable<typeof catalog.value>[number]): number {
    return resolveCatalogUnitPrice({
      tipo: entry.tipo,
      valorPadrao: Number(entry.valor_padrao),
      custo: Number(entry.custo) || 0,
      markupPecas: pricingDraft.value.markup_pecas,
      precificacaoAutomatica: pricingDraft.value.precificacao_automatica,
      horasEstimadas: entry.horas_estimadas,
      nivelTecnico: entry.nivel_tecnico as 'rapido' | 'padrao' | 'tecnico' | 'especializado',
      precoManual: entry.preco_manual,
      servicePricing: pricingDraft.value
    })
  }

  const catalogItems = computed(() => {
    return (catalog.value || []).map(item => ({
      label: `${item.nome} · ${ORDEM_ITEM_TIPO_LABEL[item.tipo as keyof typeof ORDEM_ITEM_TIPO_LABEL] || item.tipo} · ${formatMoney(catalogUnitPrice(item))}`,
      value: item.id
    }))
  })

  const isSuggestedCatalogPrice = computed(() => {
    const entry = catalog.value?.find(item => item.id === selectedCatalogId.value)
    return Boolean(
      entry
      && entry.tipo === 'servico'
      && !entry.preco_manual
      && Number(entry.horas_estimadas) > 0
      && Number(draft.valor_unitario) === catalogUnitPrice(entry)
    )
  })

  function applyCatalogEntry(id: string | undefined) {
    if (!id || !catalog.value) return
    const entry = catalog.value.find(item => item.id === id)
    if (!entry) return
    draft.tipo = entry.tipo as OrderItemDraft['tipo']
    draft.descricao = entry.nome
    draft.valor_unitario = catalogUnitPrice(entry)
    if (!draft.quantidade || draft.quantidade < 1) {
      draft.quantidade = 1
    }
  }

  watch(selectedCatalogId, applyCatalogEntry)

  /** Fills the add-item draft from voice (catalog entry first, spoken values on top). */
  async function fillVoiceItem(voice: VoiceBudgetItemDraft): Promise<boolean> {
    if (!canEditItems.value) {
      useToast().add({
        title: 'Orçamento bloqueado',
        description: 'Este orçamento não pode receber itens agora.',
        color: 'warning'
      })
      return false
    }
    Object.assign(draft, emptyOrderItemDraft(), { tipo: voice.tipo })
    if (voice.descricao) draft.descricao = voice.descricao
    selectedCatalogId.value = voice.catalogItemId
    applyCatalogEntry(voice.catalogItemId)
    // Spoken values must land after the selectedCatalogId watcher re-applies the catalog price.
    await nextTick()
    if (voice.quantidade != null) draft.quantidade = voice.quantidade
    if (voice.valor_unitario != null) draft.valor_unitario = voice.valor_unitario
    return true
  }

  async function openVoiceItem(voice: VoiceBudgetItemDraft) {
    if (await fillVoiceItem(voice)) addModalOpen.value = true
  }

  /** Several spoken items: the page confirms the list first, then each one is inserted like the add modal does. */
  async function addVoiceItems(voice: VoiceBudgetItemDraft[]): Promise<{ added: number, skipped: number }> {
    const startOrdem = items.value?.length || 0
    let added = 0
    let skipped = 0
    for (const item of voice) {
      if (!await fillVoiceItem(item)) return { added, skipped }
      if (!isOrderItemDraftValid(draft)) {
        skipped++
        continue
      }
      const { error } = await addOrderItem(toValue(orderId), { ...draft }, startOrdem + added, { silent: true })
      if (error) break
      added++
    }
    Object.assign(draft, emptyOrderItemDraft())
    selectedCatalogId.value = undefined
    await refreshItems()
    return { added, skipped }
  }

  async function refreshAll() {
    await Promise.all([refreshOrder(), refreshItems()])
  }

  async function onAddItem() {
    adding.value = true
    try {
      const nextOrdem = (items.value?.length || 0)
      const { error } = await addOrderItem(toValue(orderId), draft, nextOrdem)
      if (!error) {
        Object.assign(draft, emptyOrderItemDraft())
        selectedCatalogId.value = undefined
        await refreshItems()
      }
    } finally {
      adding.value = false
    }
  }

  async function onDeleteItem(itemId: string) {
    const snapshot = items.value?.find(item => item.id === itemId)
    if (!snapshot) return

    deletingId.value = itemId
    try {
      const { error } = await deleteOrderItem(itemId, { silent: true })
      if (error) return

      await refreshItems()

      const toast = useToast()
      toast.add({
        title: 'Item removido',
        description: snapshot.descricao,
        color: 'neutral',
        actions: [{
          label: 'Desfazer',
          color: 'neutral',
          variant: 'outline',
          onClick: async () => {
            const nextOrdem = items.value?.length || 0
            const { error: undoError } = await addOrderItem(
              toValue(orderId),
              {
                tipo: snapshot.tipo as OrderItemDraft['tipo'],
                descricao: snapshot.descricao,
                quantidade: Number(snapshot.quantidade),
                valor_unitario: Number(snapshot.valor_unitario)
              },
              nextOrdem,
              { silent: true }
            )
            if (!undoError) {
              await refreshItems()
              toast.add({ title: 'Item restaurado', color: 'success' })
            }
          }
        }]
      })
    } finally {
      deletingId.value = null
    }
  }

  async function onSubmitForApproval() {
    if (!items.value?.length) {
      useToast().add({
        title: 'Adicione ao menos um item',
        description: 'O orçamento precisa de itens antes de ser enviado.',
        color: 'warning'
      })
      return
    }

    updatingStatus.value = true
    try {
      const { error } = await updateBudgetStatus(toValue(orderId), 'aguardando_aprovacao')
      if (!error) await refreshAll()
    } finally {
      updatingStatus.value = false
    }
  }

  async function onApprove() {
    updatingStatus.value = true
    try {
      const { error } = await updateBudgetStatus(toValue(orderId), 'aprovado')
      if (!error) await refreshAll()
    } finally {
      updatingStatus.value = false
    }
  }

  async function onReject() {
    updatingStatus.value = true
    try {
      const { error } = await updateBudgetStatus(toValue(orderId), 'rejeitado')
      if (!error) await refreshAll()
    } finally {
      updatingStatus.value = false
    }
  }

  return {
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
    fillVoiceItem,
    openVoiceItem,
    addVoiceItems
  }
}
