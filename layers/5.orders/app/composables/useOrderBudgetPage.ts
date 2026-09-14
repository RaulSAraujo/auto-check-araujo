import type { OrderDetail } from '../types/orders'
import type { OrdemItem } from '~~/shared/types/database'
import type { OrcamentoStatus, OrdemStatus } from '~~/shared/types/oficina'
import { isBudgetEditable, ORDEM_ITEM_TIPO_LABEL } from '~~/shared/types/oficina'
import {
  calcItemsTotal,
  emptyOrderItemDraft,
  type OrderItemDraft
} from '../utils/budget'
import { resolveCatalogUnitPrice } from '#layers/configuration/app/utils/pricing'

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

  const catalogItems = computed(() => {
    return (catalog.value || []).map(item => ({
      label: `${item.nome} · ${ORDEM_ITEM_TIPO_LABEL[item.tipo as keyof typeof ORDEM_ITEM_TIPO_LABEL] || item.tipo} · ${formatMoney(Number(item.valor_padrao))}`,
      value: item.id
    }))
  })

  watch(selectedCatalogId, (id) => {
    if (!id || !catalog.value) return
    const entry = catalog.value.find(item => item.id === id)
    if (!entry) return
    draft.tipo = entry.tipo as OrderItemDraft['tipo']
    draft.descricao = entry.nome
    draft.valor_unitario = resolveCatalogUnitPrice({
      tipo: entry.tipo,
      valorPadrao: Number(entry.valor_padrao),
      custo: Number(entry.custo) || 0,
      markupPecas: Number(params.value?.markup_pecas) || 0,
      precificacaoAutomatica: Boolean(params.value?.precificacao_automatica)
    })
    if (!draft.quantidade || draft.quantidade < 1) {
      draft.quantidade = 1
    }
  })

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
    onReject
  }
}
