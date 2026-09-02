import type { ChecklistItem } from '~~/shared/types/database'
import type { ChecklistResultado } from '~~/shared/types/oficina'
import type { ChecklistWithItems } from '../types/orders'
import {
  emptyChecklistItemDraft,
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

  function onUpdateResultado(item: ChecklistItem, value: ChecklistResultado) {
    item.resultado = value
    onSaveItem(item)
  }

  function onUpdateObservacao(item: ChecklistItem, value: string) {
    item.observacao = value
  }

  function scrollToFirstPending() {
    const el = document.querySelector('[data-checklist-pending]')
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  async function onMarkItemsOk(items: ChecklistItem[]) {
    if (readOnly.value) return

    const pendingIds = items
      .filter(item => item.resultado !== 'ok')
      .map(item => item.id)

    if (pendingIds.length === 0) return

    bulkSaving.value = true
    try {
      const { error } = await bulkSetResultado(pendingIds, 'ok')
      if (!error) {
        for (const item of items) {
          if (pendingIds.includes(item.id)) {
            item.resultado = 'ok'
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
