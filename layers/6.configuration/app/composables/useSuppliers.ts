import type { Fornecedor } from '~~/shared/types/database'
import type { SupplierDraft } from '../utils/catalog'
import { isSupplierDraftValid } from '../utils/catalog'

const SUPPLIERS_LIST_KEY = 'fornecedores-list'

function trimOrNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed || null
}

export function useSuppliersList(options?: { enabled?: Ref<boolean> }) {
  const supabase = useTypedSupabaseClient()
  const enabled = options?.enabled ?? ref(true)

  const { data, pending, refresh, error } = useAsyncData(
    SUPPLIERS_LIST_KEY,
    async () => {
      if (!enabled.value) return []
      const { data: rows, error: fetchError } = await supabase
        .from('fornecedores')
        .select('id, nome, telefone, email, observacoes, ativo, created_at')
        .order('ativo', { ascending: false })
        .order('nome')
        .limit(REPORT_SOFT_LIMIT)

      if (fetchError) throw fetchError
      return rows as Fornecedor[]
    },
    { watch: [enabled], lazy: true }
  )

  return {
    suppliers: data,
    pending,
    refresh,
    error
  }
}

export function useSupplierMutations() {
  const supabase = useTypedSupabaseClient()
  const toast = useToast()

  async function refreshSuppliers() {
    await refreshNuxtData([SUPPLIERS_LIST_KEY, 'catalog-list'])
  }

  async function createSupplier(draft: SupplierDraft) {
    if (!isSupplierDraftValid(draft)) {
      toast.add({ title: 'Informe o nome do fornecedor', color: 'warning' })
      return { error: new Error('invalid'), id: null as string | null }
    }

    const { data, error } = await supabase
      .from('fornecedores')
      .insert({
        nome: draft.nome.trim(),
        telefone: trimOrNull(draft.telefone),
        email: trimOrNull(draft.email),
        observacoes: trimOrNull(draft.observacoes)
      })
      .select('id')
      .single()

    if (error) {
      toast.add({ title: 'Erro ao adicionar fornecedor', description: error.message, color: 'error' })
      return { error, id: null as string | null }
    }

    toast.add({ title: 'Fornecedor adicionado', color: 'success' })
    await refreshSuppliers()
    return { error: null, id: data.id as string }
  }

  async function updateSupplier(id: string, draft: SupplierDraft) {
    if (!isSupplierDraftValid(draft)) {
      toast.add({ title: 'Informe o nome do fornecedor', color: 'warning' })
      return { error: new Error('invalid') }
    }

    const { error } = await supabase
      .from('fornecedores')
      .update({
        nome: draft.nome.trim(),
        telefone: trimOrNull(draft.telefone),
        email: trimOrNull(draft.email),
        observacoes: trimOrNull(draft.observacoes)
      })
      .eq('id', id)

    if (error) {
      toast.add({ title: 'Erro ao salvar fornecedor', description: error.message, color: 'error' })
      return { error }
    }

    toast.add({ title: 'Fornecedor atualizado', color: 'success' })
    await refreshSuppliers()
    return { error: null }
  }

  async function setSupplierAtivo(id: string, ativo: boolean) {
    const { error } = await supabase
      .from('fornecedores')
      .update({ ativo })
      .eq('id', id)

    if (error) {
      toast.add({
        title: ativo ? 'Erro ao reativar fornecedor' : 'Erro ao desativar fornecedor',
        description: error.message,
        color: 'error'
      })
      return { error }
    }

    toast.add({
      title: ativo ? 'Fornecedor reativado' : 'Fornecedor desativado',
      color: 'success'
    })
    await refreshSuppliers()
    return { error: null }
  }

  return {
    createSupplier,
    updateSupplier,
    setSupplierAtivo
  }
}
