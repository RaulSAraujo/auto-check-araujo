<script setup lang="ts">
import type { FormaPagamento } from '~~/shared/types/oficina'
import {
  ACCOUNTS_FILTER_ITEMS,
  emptyFinanceAccountDraft,
  filterAccounts,
  type AccountsFilter,
  type FinanceCategoryDraft
} from '../utils/accounts-payable'

defineOptions({ name: 'FinanceIndexPage' })

definePageMeta({
  path: '/financeiro',
  layout: 'app'
})

useRequirePermission('finance.view')

const tab = ref<'resumo' | 'contas' | 'recebiveis' | 'categorias' | 'historico'>('resumo')
const accountsFilter = ref<AccountsFilter>('a_pagar')

const tabItems = [
  { label: 'Resumo', value: 'resumo', icon: 'i-lucide-layout-dashboard' },
  { label: 'Contas', value: 'contas', icon: 'i-lucide-receipt' },
  { label: 'Recebíveis', value: 'recebiveis', icon: 'i-lucide-wallet' },
  { label: 'Categorias', value: 'categorias', icon: 'i-lucide-tags' },
  { label: 'Histórico', value: 'historico', icon: 'i-lucide-history' }
]

const {
  selectedMonth,
  summary,
  orders,
  pending: pendingReport,
  refresh: refreshReport
} = await useFinanceReport()

const { accounts, pending: pendingAccounts } = await useAccountsPayableList()
const { dueAccounts, pending: pendingDue } = await useFinanceDueList()
const { history, pending: pendingHistory, refresh: refreshHistory } = useFinanceHistory(selectedMonth)
const { categories, pending: pendingCategories } = await useFinanceCategoriesList()
const { suppliers } = await useSuppliersList()

const {
  createCategory,
  updateCategory,
  setCategoryAtivo
} = useFinanceCategoryMutations()

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

const filteredAccounts = computed(() =>
  filterAccounts(accounts.value || [], accountsFilter.value)
)

async function onAddAccount() {
  addingAccount.value = true
  try {
    const { error } = await createAccount({ ...accountDraft })
    if (!error) Object.assign(accountDraft, emptyFinanceAccountDraft())
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
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Financeiro">
        <template #leading>
          <UDashboardSidebarToggle />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-4 sm:p-6 space-y-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <UTabs
            v-model="tab"
            :items="tabItems"
            class="w-full sm:w-auto"
          />

          <UFormField
            v-if="tab === 'resumo' || tab === 'recebiveis' || tab === 'historico'"
            label="Mês"
            name="mes"
            class="sm:w-48"
          >
            <UInput
              v-model="selectedMonth"
              type="month"
              class="w-full"
            />
          </UFormField>
        </div>

        <template v-if="tab === 'resumo'">
          <FinanceSummaryPanel
            :summary="summary"
            :loading="pendingReport"
          />
          <FinanceDueList
            :accounts="dueAccounts || []"
            :loading="pendingDue"
          />
        </template>

        <template v-else-if="tab === 'contas'">
          <div class="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
            <FinanceAccountForm
              v-model:draft="accountDraft"
              :adding="addingAccount"
              :categories="categories || []"
              :suppliers="suppliers || []"
              @add="onAddAccount"
            />

            <div class="space-y-4 min-w-0">
              <UTabs
                v-model="accountsFilter"
                :items="[...ACCOUNTS_FILTER_ITEMS]"
                size="sm"
                class="w-full"
              />

              <FinanceAccountsTable
                :accounts="filteredAccounts"
                :loading="pendingAccounts"
                :acting-id="actingAccountId"
                @mark-paid="onMarkPaid"
                @cancel="onCancelAccount"
                @reopen="onReopenAccount"
                @remove="onRemoveAccount"
              />
            </div>
          </div>
        </template>

        <template v-else-if="tab === 'recebiveis'">
          <section class="space-y-3">
            <h2 class="text-lg font-semibold text-highlighted">
              Ordens do mês
              <span
                v-if="!pendingReport"
                class="text-sm font-normal text-muted"
              >
                ({{ summary.qtd_os }})
              </span>
            </h2>

            <FinanceTable
              :orders="orders"
              :loading="pendingReport"
            />
          </section>
        </template>

        <template v-else-if="tab === 'categorias'">
          <FinanceCategoriesPanel
            :categories="categories || []"
            :loading="pendingCategories"
            :adding="addingCategory"
            :saving-id="savingCategoryId"
            :toggling-id="togglingCategoryId"
            @add="onAddCategory"
            @save="onSaveCategory"
            @toggle-ativo="onToggleCategory"
          />
        </template>

        <template v-else>
          <FinanceHistoryList
            :items="history"
            :loading="pendingHistory"
          />
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>
