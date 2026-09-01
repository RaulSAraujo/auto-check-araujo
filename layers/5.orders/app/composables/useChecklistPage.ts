import type { ChecklistItem } from '~~/shared/types/database'
import type { ChecklistResultado } from '~~/shared/types/oficina'
import type { ChecklistWithItems } from '../types/orders'

export function useChecklistPage(
  checklist: Ref<ChecklistWithItems | null | undefined>,
  readOnly: Ref<boolean>,
  refresh: () => Promise<void>
) {
  const { saveChecklistItem, bulkSetResultado, concludeChecklist } = useChecklistMutations()

  const saving = ref(false)
  const concluding = ref(false)
  const bulkSaving = ref(false)

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

  return {
    saving,
    concluding,
    bulkSaving,
    onSaveItem,
    onUpdateResultado,
    onUpdateObservacao,
    onMarkItemsOk,
    onConcludeChecklist
  }
}
