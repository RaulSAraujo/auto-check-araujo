import type { FormaPagamento } from '~~/shared/types/oficina'
import {
  ACCOUNTS_FILTER_ITEMS,
  emptyFinanceAccountDraft,
  type AccountsFilter,
  type FinanceCategoryDraft
} from '../utils/accounts-payable'
import { currentMonthValue, isMonthValue } from '../utils/finance'
import type { SupplierDraft } from '#layers/configuration/app/utils/catalog'
import {
  useSupplierMutations,
  useSuppliersList
} from '#layers/configuration/app/composables/useSuppliers'

export type FinanceTab = 'resumo' | 'contas' | 'recebiveis'

export const FINANCE_TAB_ITEMS = [
  { label: 'Resumo', value: 'resumo' as const, icon: 'i-lucide-layout-dashboard' },
  { label: 'Contas', value: 'contas' as const, icon: 'i-lucide-receipt' },
  { label: 'Recebíveis', value: 'recebiveis' as const, icon: 'i-lucide-wallet' }
]

export function useFinanceWorkspace() {
  const tab = useRouteQueryState<FinanceTab>('aba', 'resumo', FINANCE_TAB_ITEMS.map(item => item.value))
  const accountsFilter = useRouteQueryState<AccountsFilter>('contas', 'a_pagar', ACCOUNTS_FILTER_ITEMS.map(item => item.value))
  const month = useRouteQueryState('mes', currentMonthValue(), isMonthValue)
  const categoriesOpen = ref(false)
  const suppliersOpen = ref(false)

  watch(tab, (value) => {
    if (value !== 'contas') {
      categoriesOpen.value = false
      suppliersOpen.value = false
    }
  })

  const showMonthPicker = computed(() =>
    tab.value === 'resumo' || tab.value === 'recebiveis'
  )

  const {
    selectedMonth,
    summary,
    orders,
    page: ordersPage,
    pageSize: ordersPageSize,
    total: ordersTotal,
    pending: pendingReport,
    refresh: refreshReport
  } = useFinanceReport(month, {
    enabled: computed(() => tab.value === 'resumo' || tab.value === 'recebiveis')
  })

  const {
    accounts,
    page: accountsPage,
    pageSize: accountsPageSize,
    total: accountsTotal,
    pending: pendingAccounts
  } = useAccountsPayableList(accountsFilter, {
    enabled: computed(() => tab.value === 'contas')
  })

  const { dueAccounts, pending: pendingDue } = useFinanceDueList(14, {
    enabled: computed(() => tab.value === 'resumo')
  })

  const {
    history,
    page: historyPage,
    pageSize: historyPageSize,
    total: historyTotal,
    pending: pendingHistory,
    refresh: refreshHistory
  } = useFinanceHistory(selectedMonth, {
    enabled: computed(() => tab.value === 'resumo')
  })

  const { categories, pending: pendingCategories } = useFinanceCategoriesList({
    enabled: computed(() => tab.value === 'contas')
  })

  const { suppliers, pending: pendingSuppliers } = useSuppliersList({
    enabled: computed(() => tab.value === 'contas')
  })

  const { data: cashFlowData, pending: pendingCashFlow } = useFinanceCashFlow({
    enabled: computed(() => tab.value === 'resumo')
  })

  const {
    createCategory,
    updateCategory,
    setCategoryAtivo
  } = useFinanceCategoryMutations()

  const {
    createSupplier,
    updateSupplier,
    setSupplierAtivo
  } = useSupplierMutations()

  async function refreshAll() {
    await Promise.all([
      refreshReport(),
      refreshHistory()
    ])
  }

  const {
    createAccount,
    markAccountPaid,
    cancelAccount,
    reopenAccount,
    deleteAccount
  } = useAccountsPayableMutations(refreshAll)

  const accountDraft = reactive(emptyFinanceAccountDraft())
  const addingAccount = ref(false)
  const actingAccountId = ref<string | null>(null)

  const addingCategory = ref(false)
  const savingCategoryId = ref<string | null>(null)
  const togglingCategoryId = ref<string | null>(null)

  const addingSupplier = ref(false)
  const savingSupplierId = ref<string | null>(null)
  const togglingSupplierId = ref<string | null>(null)

  async function onAddAccount() {
    addingAccount.value = true
    try {
      const { error } = await createAccount({ ...accountDraft })
      if (!error) {
        Object.assign(accountDraft, emptyFinanceAccountDraft())
        return true
      }
      return false
    } finally {
      addingAccount.value = false
    }
  }

  async function onMarkPaid(payload: { id: string, forma_pagamento: FormaPagamento }) {
    actingAccountId.value = payload.id
    try {
      await markAccountPaid(payload.id, payload.forma_pagamento)
    } finally {
      actingAccountId.value = null
    }
  }

  async function onCancelAccount(id: string) {
    actingAccountId.value = id
    try {
      await cancelAccount(id)
    } finally {
      actingAccountId.value = null
    }
  }

  async function onReopenAccount(id: string) {
    actingAccountId.value = id
    try {
      await reopenAccount(id)
    } finally {
      actingAccountId.value = null
    }
  }

  async function onRemoveAccount(id: string) {
    actingAccountId.value = id
    try {
      await deleteAccount(id)
    } finally {
      actingAccountId.value = null
    }
  }

  async function onAddCategory(draft: FinanceCategoryDraft) {
    addingCategory.value = true
    try {
      await createCategory(draft)
    } finally {
      addingCategory.value = false
    }
  }

  async function onSaveCategory(payload: { id: string, draft: FinanceCategoryDraft }) {
    savingCategoryId.value = payload.id
    try {
      await updateCategory(payload.id, payload.draft)
    } finally {
      savingCategoryId.value = null
    }
  }

  async function onToggleCategory(payload: { id: string, ativo: boolean }) {
    togglingCategoryId.value = payload.id
    try {
      await setCategoryAtivo(payload.id, payload.ativo)
    } finally {
      togglingCategoryId.value = null
    }
  }

  async function onAddSupplier(draft: SupplierDraft) {
    addingSupplier.value = true
    try {
      const { error, id } = await createSupplier(draft)
      if (!error && id) accountDraft.fornecedor_id = id
    } finally {
      addingSupplier.value = false
    }
  }

  async function onSaveSupplier(payload: { id: string, draft: SupplierDraft }) {
    savingSupplierId.value = payload.id
    try {
      await updateSupplier(payload.id, payload.draft)
    } finally {
      savingSupplierId.value = null
    }
  }

  async function onToggleSupplier(payload: { id: string, ativo: boolean }) {
    togglingSupplierId.value = payload.id
    try {
      await setSupplierAtivo(payload.id, payload.ativo)
    } finally {
      togglingSupplierId.value = null
    }
  }

  return {
    tab,
    tabItems: FINANCE_TAB_ITEMS,
    accountsFilter,
    categoriesOpen,
    suppliersOpen,
    showMonthPicker,
    selectedMonth,
    summary,
    orders,
    ordersPage,
    ordersPageSize,
    ordersTotal,
    pendingReport,
    accounts,
    accountsPage,
    accountsPageSize,
    accountsTotal,
    pendingAccounts,
    dueAccounts,
    pendingDue,
    history,
    historyPage,
    historyPageSize,
    historyTotal,
    pendingHistory,
    categories,
    pendingCategories,
    suppliers,
    pendingSuppliers,
    cashFlowData,
    pendingCashFlow,
    accountDraft,
    addingAccount,
    actingAccountId,
    addingCategory,
    savingCategoryId,
    togglingCategoryId,
    addingSupplier,
    savingSupplierId,
    togglingSupplierId,
    onAddAccount,
    onMarkPaid,
    onCancelAccount,
    onReopenAccount,
    onRemoveAccount,
    onAddCategory,
    onSaveCategory,
    onToggleCategory,
    onAddSupplier,
    onSaveSupplier,
    onToggleSupplier
  }
}
