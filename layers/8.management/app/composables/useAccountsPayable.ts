import type { FormaPagamento } from '~~/shared/types/oficina'
import type {
  AccountsFilter,
  FinanceAccountDraft,
  FinanceAccountRow
} from '../utils/accounts-payable'
import {
  addDaysToDateValue,
  applyAccountsStatusFilter,
  isFinanceAccountDraftValid,
  todayDateValue
} from '../utils/accounts-payable'
import { sentenceCaseOrNull, toSentenceCase } from '~~/shared/utils/text-case'

const ACCOUNTS_LIST_KEY = 'finance-accounts-list'
const DUE_LIST_KEY = 'finance-due-list'

const ACCOUNT_SELECT = `
  id,
  descricao,
  categoria_id,
  fornecedor_id,
  valor,
  vencimento,
  status,
  pago_em,
  forma_pagamento,
  observacoes,
  created_at,
  updated_at,
  financeiro_categorias(id, nome),
  fornecedores(id, nome)
`

async function refreshFinanceRelated() {
  await refreshNuxtData([
    ACCOUNTS_LIST_KEY,
    DUE_LIST_KEY
  ])
}

export function useAccountsPayableList(
  filter: Ref<AccountsFilter> = ref('a_pagar'),
  options?: { enabled?: Ref<boolean> }
) {
  const supabase = useTypedSupabaseClient()
  const enabled = options?.enabled ?? ref(true)
  const { page, pageSize, rangeBounds } = useListPagination(
    [filter],
    REPORT_PAGE_SIZE
  )

  const { data, pending, refresh, error } = useAsyncData(
    ACCOUNTS_LIST_KEY,
    async () => {
      if (!enabled.value) return { items: [], total: 0 }
      const { from, to } = rangeBounds()

      let query = supabase
        .from('financeiro_contas')
        .select(ACCOUNT_SELECT, { count: 'exact' })
        .order('vencimento', { ascending: true })
        .order('created_at', { ascending: false })
        .range(from, to)

      query = applyAccountsStatusFilter(query, filter.value)

      const { data: rows, count, error: fetchError } = await query
      if (fetchError) throw fetchError

      return {
        items: (rows || []) as FinanceAccountRow[],
        total: count ?? 0
      }
    },
    { watch: [filter, page, enabled], lazy: true }
  )

  return {
    accounts: computed(() => data.value?.items ?? []),
    page,
    pageSize,
    total: computed(() => data.value?.total ?? 0),
    pending,
    refresh,
    error
  }
}

export function useFinanceDueList(daysAhead = 14, options?: { enabled?: Ref<boolean> }) {
  const supabase = useTypedSupabaseClient()
  const enabled = options?.enabled ?? ref(true)

  const { data, pending, refresh, error } = useAsyncData(
    DUE_LIST_KEY,
    async () => {
      if (!enabled.value) return []
      const today = todayDateValue()
      const until = addDaysToDateValue(today, daysAhead)

      const { data: rows, error: fetchError } = await supabase
        .from('financeiro_contas')
        .select(ACCOUNT_SELECT)
        .eq('status', 'a_pagar')
        .lte('vencimento', until)
        .order('vencimento', { ascending: true })
        .limit(REPORT_SOFT_LIMIT)

      if (fetchError) throw fetchError
      return (rows || []) as FinanceAccountRow[]
    },
    { watch: [enabled], lazy: true }
  )

  return {
    dueAccounts: data,
    pending,
    refresh,
    error
  }
}

export function useAccountsPayableMutations(onChanged?: () => Promise<void> | void) {
  const supabase = useTypedSupabaseClient()
  const toast = useToast()

  async function afterChange() {
    await refreshFinanceRelated()
    await onChanged?.()
  }

  async function createAccount(draft: FinanceAccountDraft) {
    if (!isFinanceAccountDraftValid(draft)) {
      toast.add({ title: 'Preencha descrição, categoria, valor e vencimento', color: 'warning' })
      return { error: new Error('invalid') }
    }

    const { error } = await supabase
      .from('financeiro_contas')
      .insert({
        descricao: toSentenceCase(draft.descricao),
        categoria_id: draft.categoria_id,
        fornecedor_id: draft.fornecedor_id || null,
        valor: Number(draft.valor),
        vencimento: draft.vencimento,
        observacoes: sentenceCaseOrNull(draft.observacoes),
        status: 'a_pagar'
      })

    if (error) {
      toast.add({ title: 'Erro ao adicionar conta', description: error.message, color: 'error' })
      return { error }
    }

    toast.add({ title: 'Conta adicionada', color: 'success' })
    await afterChange()
    return { error: null }
  }

  async function markAccountPaid(id: string, forma_pagamento: FormaPagamento) {
    const { error } = await supabase
      .from('financeiro_contas')
      .update({
        status: 'pago',
        forma_pagamento
      })
      .eq('id', id)

    if (error) {
      toast.add({ title: 'Erro ao marcar como pago', description: error.message, color: 'error' })
      return { error }
    }

    toast.add({ title: 'Conta marcada como paga', color: 'success' })
    await afterChange()
    return { error: null }
  }

  async function cancelAccount(id: string) {
    const { error } = await supabase
      .from('financeiro_contas')
      .update({ status: 'cancelado' })
      .eq('id', id)

    if (error) {
      toast.add({ title: 'Erro ao cancelar conta', description: error.message, color: 'error' })
      return { error }
    }

    toast.add({ title: 'Conta cancelada', color: 'success' })
    await afterChange()
    return { error: null }
  }

  async function reopenAccount(id: string) {
    const { error } = await supabase
      .from('financeiro_contas')
      .update({ status: 'a_pagar', forma_pagamento: null })
      .eq('id', id)

    if (error) {
      toast.add({ title: 'Erro ao reabrir conta', description: error.message, color: 'error' })
      return { error }
    }

    toast.add({ title: 'Conta reaberta', color: 'success' })
    await afterChange()
    return { error: null }
  }

  async function deleteAccount(id: string) {
    const { error } = await supabase
      .from('financeiro_contas')
      .delete()
      .eq('id', id)

    if (error) {
      toast.add({ title: 'Erro ao excluir conta', description: error.message, color: 'error' })
      return { error }
    }

    toast.add({ title: 'Conta excluída', color: 'success' })
    await afterChange()
    return { error: null }
  }

  return {
    createAccount,
    markAccountPaid,
    cancelAccount,
    reopenAccount,
    deleteAccount
  }
}
