import type { ChecklistItem } from '~~/shared/types/database'
import type { ChecklistResultado } from '~~/shared/types/oficina'
import type { ChecklistWithItems } from '../types/orders'
import {
  emptyChecklistItemDraft,
  hasChecklistItemEvidence,
  isChecklistItemDraftValid,
  type ChecklistItemDraft
} from '../utils/checklist'

export function useChecklistPage(
  checklist: Ref<ChecklistWithItems | null | undefined>,
  readOnly: Ref<boolean>,
  refresh: () => Promise<void>
) {
  const { saveChecklistItem, bulkSetResultado, addChecklistItem, deleteChecklistItem, concludeChecklist } = useChecklistMutations()

  const saving = ref(false)
  const concluding = ref(false)
  const bulkSaving = ref(false)
  const adding = ref(false)
  const deletingId = ref<string | null>(null)
  const importing = ref(false)
  const itemDraft = reactive<ChecklistItemDraft>(emptyChecklistItemDraft())
  const { importChecklistFromCatalog } = useChecklistCatalogMutations()

  async function onSaveItem(item: ChecklistItem) {
    saving.value = true
    try {
      await saveChecklistItem(item, readOnly.value)
    } finally {
      saving.value = false
    }
  }

  function onUpdateObservacao(item: ChecklistItem, value: string) {
    if (!checklist.value) return
    const normalized = value.trim() || null
    const itens = checklist.value.checklist_itens
    const index = itens.findIndex(i => i.id === item.id)
    if (index === -1) return

    // Substituição imutável — useAsyncData/shallowRef não reage a mutação aninhada
    const nextItens = itens.slice()
    nextItens[index] = { ...itens[index]!, observacao: normalized }
    checklist.value = {
      ...checklist.value,
      checklist_itens: nextItens
    }
  }

  function onUpdateResultado(
    item: ChecklistItem,
    value: ChecklistResultado,
    clearDetails = false
  ) {
    if (!checklist.value) return
    const itens = checklist.value.checklist_itens
    const index = itens.findIndex(i => i.id === item.id)
    if (index === -1) return

    const current = itens[index]!
    const nextItem: ChecklistItem = {
      ...current,
      resultado: value,
      observacao: clearDetails ? null : current.observacao
    }
    const nextItens = itens.slice()
    nextItens[index] = nextItem
    checklist.value = {
      ...checklist.value,
      checklist_itens: nextItens
    }
    void onSaveItem(nextItem)
  }

  function scrollToFirstPending() {
    const el = document.querySelector('[data-checklist-pending]')
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  async function onMarkItemsOk(
    items: ChecklistItem[],
    options?: {
      getPhotoCount?: (itemId: string) => number
      clearPhotos?: (itemId: string) => Promise<{ error: Error | null }>
    }
  ) {
    if (readOnly.value) return

    const pendingItems = items.filter(item => item.resultado !== 'ok')
    if (pendingItems.length === 0) return

    const withEvidence = pendingItems.filter(item =>
      hasChecklistItemEvidence(item.observacao, options?.getPhotoCount?.(item.id) ?? 0)
    )

    if (withEvidence.length > 0) {
      const photoTotal = withEvidence.reduce(
        (sum, item) => sum + (options?.getPhotoCount?.(item.id) ?? 0),
        0
      )
      const message = photoTotal > 0
        ? `Isso marcará ${pendingItems.length} item(ns) como OK e apagará observação/fotos de ${withEvidence.length} item(ns). Continuar?`
        : `Isso marcará ${pendingItems.length} item(ns) como OK e apagará a observação de ${withEvidence.length} item(ns). Continuar?`
      if (!window.confirm(message)) return
    }

    const pendingIds = pendingItems.map(item => item.id)

    bulkSaving.value = true
    try {
      const { error } = await bulkSetResultado(pendingIds, 'ok', { clearObservacao: true })
      if (!error && checklist.value) {
        const pendingSet = new Set(pendingIds)
        checklist.value = {
          ...checklist.value,
          checklist_itens: checklist.value.checklist_itens.map(item =>
            pendingSet.has(item.id)
              ? { ...item, resultado: 'ok', observacao: null }
              : item
          )
        }
        for (const id of pendingIds) {
          if (options?.clearPhotos) {
            await options.clearPhotos(id)
          }
        }
      }
    } finally {
      bulkSaving.value = false
    }
  }

  async function onConcludeChecklist() {
    if (!checklist.value) return

    concluding.value = true
    try {
      const { error, incomplete } = await concludeChecklist(checklist.value)
      if (incomplete) {
        scrollToFirstPending()
      }
      if (!error && !incomplete) {
        await refresh()
      }
    } finally {
      concluding.value = false
    }
  }

  async function onAddItem() {
    if (!checklist.value || readOnly.value) return
    if (!isChecklistItemDraftValid(itemDraft)) return

    adding.value = true
    try {
      const nextOrdem = checklist.value.checklist_itens.length
      const { error } = await addChecklistItem(checklist.value.id, itemDraft, nextOrdem)
      if (!error) {
        Object.assign(itemDraft, emptyChecklistItemDraft())
        await refresh()
      }
    } finally {
      adding.value = false
    }
  }

  async function onDeleteItem(itemId: string) {
    if (readOnly.value) return

    deletingId.value = itemId
    try {
      const { error } = await deleteChecklistItem(itemId)
      if (!error) {
        await refresh()
      }
    } finally {
      deletingId.value = null
    }
  }

  async function onImportFromCatalog() {
    if (!checklist.value || readOnly.value) return

    importing.value = true
    try {
      const { error } = await importChecklistFromCatalog(checklist.value.id)
      if (!error) {
        await refresh()
      }
    } finally {
      importing.value = false
    }
  }

  return {
    saving,
    concluding,
    bulkSaving,
    adding,
    deletingId,
    importing,
    itemDraft,
    onSaveItem,
    onUpdateResultado,
    onUpdateObservacao,
    onMarkItemsOk,
    onConcludeChecklist,
    onAddItem,
    onDeleteItem,
    onImportFromCatalog
  }
}
