import type { FinanceiroCategoria } from '~~/shared/types/database'
import type { FinanceCategoryDraft } from '../utils/accounts-payable'
import { isFinanceCategoryDraftValid } from '../utils/accounts-payable'
import { toTitleCasePt } from '~~/shared/utils/text-case'

const CATEGORIES_LIST_KEY = 'finance-categories-list'

export function useFinanceCategoriesList(options?: { enabled?: Ref<boolean> }) {
  const supabase = useTypedSupabaseClient()
  const enabled = options?.enabled ?? ref(true)

  const { data, pending, refresh, error } = useAsyncData(
    CATEGORIES_LIST_KEY,
    async () => {
      if (!enabled.value) return []
      const { data: rows, error: fetchError } = await supabase
        .from('financeiro_categorias')
        .select('*')
        .order('ativo', { ascending: false })
        .order('nome')

      if (fetchError) throw fetchError
      return rows as FinanceiroCategoria[]
    },
    { watch: [enabled], lazy: true }
  )

  return {
    categories: data,
    pending,
    refresh,
    error
  }
}

export function useFinanceCategoryMutations() {
  const supabase = useTypedSupabaseClient()
  const toast = useToast()

  async function refreshCategories() {
    await refreshNuxtData([
      CATEGORIES_LIST_KEY,
      'finance-accounts-list',
      'finance-due-list'
    ])
  }

  async function createCategory(draft: FinanceCategoryDraft) {
    if (!isFinanceCategoryDraftValid(draft)) {
      toast.add({ title: 'Informe o nome da categoria', color: 'warning' })
      return { error: new Error('invalid') }
    }

    const { error } = await supabase
      .from('financeiro_categorias')
      .insert({ nome: toTitleCasePt(draft.nome) })

    if (error) {
      toast.add({ title: 'Erro ao adicionar categoria', description: error.message, color: 'error' })
      return { error }
    }

    toast.add({ title: 'Categoria adicionada', color: 'success' })
    await refreshCategories()
    return { error: null }
  }

  async function updateCategory(id: string, draft: FinanceCategoryDraft) {
    if (!isFinanceCategoryDraftValid(draft)) {
      toast.add({ title: 'Informe o nome da categoria', color: 'warning' })
      return { error: new Error('invalid') }
    }

    const { error } = await supabase
      .from('financeiro_categorias')
      .update({ nome: toTitleCasePt(draft.nome) })
      .eq('id', id)

    if (error) {
      toast.add({ title: 'Erro ao salvar categoria', description: error.message, color: 'error' })
      return { error }
    }

    toast.add({ title: 'Categoria atualizada', color: 'success' })
    await refreshCategories()
    return { error: null }
  }

  async function setCategoryAtivo(id: string, ativo: boolean) {
    const { error } = await supabase
      .from('financeiro_categorias')
      .update({ ativo })
      .eq('id', id)

    if (error) {
      toast.add({ title: 'Erro ao atualizar status', description: error.message, color: 'error' })
      return { error }
    }

    toast.add({ title: ativo ? 'Categoria ativada' : 'Categoria desativada', color: 'success' })
    await refreshCategories()
    return { error: null }
  }

  return {
    createCategory,
    updateCategory,
    setCategoryAtivo
  }
}
