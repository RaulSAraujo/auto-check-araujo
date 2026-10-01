<script setup lang="ts">
import type { FormaPagamento } from '~~/shared/types/oficina'
import { ACCOUNTS_FILTER_ITEMS, emptyFinanceAccountDraft } from '../utils/accounts-payable'

defineOptions({ name: 'FinanceIndexPage' })

definePageMeta({
  path: '/gestao/financeiro'
})

useSeoMeta({
  title: 'Financeiro',
  description: 'Gestão de caixa, contas a pagar e recebíveis.'
})

useRequirePermission('finance.view')

const {
  tab,
  tabItems,
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
} = useFinanceWorkspace()

const accountCreateOpen = ref(false)

watch(accountCreateOpen, (open) => {
  if (!open) Object.assign(accountDraft, emptyFinanceAccountDraft())
})

useVoiceForm('account', {
  ops: ['create'],
  state: accountDraft,
  open: () => {
    tab.value = 'contas'
    Object.assign(accountDraft, emptyFinanceAccountDraft())
    accountCreateOpen.value = true
  },
  // Pix is the table's default payment form; set it before the confirmation so the title reads "(Pix)".
  unavailable: (action, draft) => {
    if (action === 'pagar' && !draft.args?.forma) draft.args = { ...draft.args, forma: 'pix' }
    return undefined
  },
  actions: {
    pagar: (draft) => {
      tab.value = 'contas'
      return onMarkPaid({ id: draft.id!, forma_pagamento: draft.args!.forma as FormaPagamento })
    },
    cancelar: (draft) => {
      tab.value = 'contas'
      return onCancelAccount(draft.id!)
    },
    reabrir: (draft) => {
      tab.value = 'contas'
      return onReopenAccount(draft.id!)
    },
    excluir: (draft) => {
      tab.value = 'contas'
      return onRemoveAccount(draft.id!)
    }
  }
})

const { confirmVoice } = useVoiceConfirm()

useVoiceForm('category', {
  apply: async (draft) => {
    const nome = typeof draft.fields.nome === 'string' ? draft.fields.nome : ''
    if (!nome) {
      useToast().add({ title: 'Diga o nome da categoria.', color: 'warning' })
      return
    }
    categoriesOpen.value = true
    const title = draft.op === 'create' ? `Criar a categoria "${nome}"?` : `Renomear a categoria ${draft.label} para "${nome}"?`
    if (!await confirmVoice({ title })) return
    if (draft.op === 'create') await onAddCategory({ nome })
    else if (draft.id) await onSaveCategory({ id: draft.id, draft: { nome } })
  },
  actions: {
    ativar: draft => onToggleCategory({ id: draft.id!, ativo: true }),
    desativar: draft => onToggleCategory({ id: draft.id!, ativo: false })
  }
})

async function handleAddAccount() {
  const ok = await onAddAccount()
  if (ok) accountCreateOpen.value = false
}
</script>

<template>
  <UDashboardPanel>
    <template #body>
      <div class="bg-muted p-4 sm:p-6">
        <div class="w-full space-y-6">
          <BasePageHeader
            title="Financeiro"
            description="Caixa, contas a pagar e recebíveis da oficina."
          >
            <template #title-trailing>
              <UBadge
                color="neutral"
                variant="subtle"
                size="sm"
              >
                Gestão
              </UBadge>
            </template>
            <template
              v-if="showMonthPicker"
              #actions
            >
              <UFormField
                label="Mês"
                name="mes"
                class="w-full sm:w-44"
              >
                <UInput
                  v-model="selectedMonth"
                  type="month"
                  class="w-full"
                />
              </UFormField>
            </template>
          </BasePageHeader>

          <UTabs
            v-model="tab"
            :items="tabItems"
            class="w-full"
          />

          <div
            :key="tab"
            class="finance-pane space-y-6"
          >
            <template v-if="tab === 'resumo'">
              <FinanceSummaryPanel
                :summary="summary"
                :loading="pendingReport"
              />
              <LazyFinanceCashFlowChart
                :data="cashFlowData || []"
                :loading="pendingCashFlow"
              />
              <FinanceDueList
                :accounts="dueAccounts || []"
                :loading="pendingDue"
                :acting-id="actingAccountId"
                @mark-paid="onMarkPaid"
              />

              <FinanceHistoryList
                :items="history"
                :loading="pendingHistory"
              />
              <div
                v-if="historyTotal > historyPageSize"
                class="flex justify-center pt-1"
              >
                <UPagination
                  v-model:page="historyPage"
                  :total="historyTotal"
                  :items-per-page="historyPageSize"
                  show-edges
                  :sibling-count="1"
                />
              </div>
            </template>

            <template v-else-if="tab === 'contas'">
              <section
                class="min-w-0 space-y-3"
                aria-labelledby="finance-accounts-heading"
              >
                <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div class="flex min-h-9 flex-wrap items-end gap-1">
                    <h2
                      id="finance-accounts-heading"
                      class="mr-2 text-sm font-semibold uppercase tracking-widest text-muted"
                    >
                      Contas
                    </h2>
                    <UButton
                      label="Categorias"
                      icon="i-lucide-tags"
                      size="xs"
                      color="neutral"
                      variant="ghost"
                      class="mb-0.5"
                      @click="categoriesOpen = true"
                    />
                    <UButton
                      label="Fornecedores"
                      icon="i-lucide-truck"
                      size="xs"
                      color="neutral"
                      variant="ghost"
                      class="mb-0.5"
                      @click="suppliersOpen = true"
                    />
                  </div>
                  <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <UTabs
                      v-model="accountsFilter"
                      :items="[...ACCOUNTS_FILTER_ITEMS]"
                      size="sm"
                      class="w-full sm:w-auto"
                    />
                    <UButton
                      label="Nova conta"
                      icon="i-lucide-plus"
                      class="shrink-0"
                      @click="accountCreateOpen = true"
                    />
                  </div>
                </div>

                <FinanceAccountsTable
                  :accounts="accounts"
                  :loading="pendingAccounts"
                  :acting-id="actingAccountId"
                  @mark-paid="onMarkPaid"
                  @cancel="onCancelAccount"
                  @reopen="onReopenAccount"
                  @remove="onRemoveAccount"
                  @create="accountCreateOpen = true"
                />

                <div
                  v-if="accountsTotal > accountsPageSize"
                  class="flex justify-center pt-1"
                >
                  <UPagination
                    v-model:page="accountsPage"
                    :total="accountsTotal"
                    :items-per-page="accountsPageSize"
                    show-edges
                    :sibling-count="1"
                  />
                </div>
              </section>
            </template>

            <template v-else>
              <section
                class="space-y-3"
                aria-labelledby="finance-receivables-heading"
              >
                <div class="flex min-h-9 items-end justify-between gap-3">
                  <h2
                    id="finance-receivables-heading"
                    class="text-sm font-semibold uppercase tracking-widest text-muted"
                  >
                    Ordens do mês
                  </h2>
                  <p
                    v-if="!pendingReport"
                    class="font-mono text-xs tabular-nums text-muted"
                  >
                    {{ summary.qtd_os }}
                  </p>
                </div>

                <FinanceTable
                  :orders="orders"
                  :loading="pendingReport"
                />

                <div
                  v-if="ordersTotal > ordersPageSize"
                  class="flex justify-center pt-1"
                >
                  <UPagination
                    v-model:page="ordersPage"
                    :total="ordersTotal"
                    :items-per-page="ordersPageSize"
                    show-edges
                    :sibling-count="1"
                  />
                </div>
              </section>
            </template>
          </div>

          <!-- Outside .finance-pane: transform animation breaks fixed overlay hit-testing -->
          <USlideover
            v-model:open="accountCreateOpen"
            title="Nova conta"
            description="Lança uma conta a pagar."
            :ui="{ content: 'overscroll-contain' }"
          >
            <template #body>
              <FinanceAccountForm
                v-model:draft="accountDraft"
                :adding="addingAccount"
                :categories="categories || []"
                :suppliers="suppliers || []"
                :categories-pending="pendingCategories"
                :suppliers-pending="pendingSuppliers"
                @add="handleAddAccount"
                @open-categories="categoriesOpen = true"
                @open-suppliers="suppliersOpen = true"
              />
            </template>
          </USlideover>

          <USlideover
            v-model:open="categoriesOpen"
            title="Categorias"
            description="Usadas ao lançar contas."
            :ui="{ content: 'overscroll-contain' }"
          >
            <template #body>
              <LazyFinanceCategoriesPanel
                v-if="categoriesOpen"
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
          </USlideover>

          <USlideover
            v-model:open="suppliersOpen"
            title="Fornecedores"
            description="Quem emite a conta."
            :ui="{ content: 'overscroll-contain' }"
          >
            <template #body>
              <LazyFinanceSuppliersPanel
                v-if="suppliersOpen"
                :suppliers="suppliers || []"
                :loading="pendingSuppliers"
                :adding="addingSupplier"
                :saving-id="savingSupplierId"
                :toggling-id="togglingSupplierId"
                @add="onAddSupplier"
                @save="onSaveSupplier"
                @toggle-ativo="onToggleSupplier"
              />
            </template>
          </USlideover>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<style scoped>
.finance-pane {
  animation: finance-rise 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes finance-rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .finance-pane {
    animation: none;
  }
}
</style>
