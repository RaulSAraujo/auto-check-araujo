import type { ChecklistItem } from '~~/shared/types/database'
import type { ChecklistResultado } from '~~/shared/types/oficina'
import type { ChecklistWithItems } from '../types/orders'

export function useChecklistPage(
  checklist: Ref<ChecklistWithItems | null | undefined>,
  readOnly: Ref<boolean>,
  refresh: () => Promise<void>
) {
  const { saveChecklistItem, concludeChecklist } = useChecklistMutations()

  const saving = ref(false)
  const concluding = ref(false)

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

  async function onConcludeChecklist() {
    if (!checklist.value) return

    concluding.value = true
    try {
      const { error, incomplete } = await concludeChecklist(checklist.value)
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
    onSaveItem,
    onUpdateResultado,
    onUpdateObservacao,
    onConcludeChecklist
  }
}
