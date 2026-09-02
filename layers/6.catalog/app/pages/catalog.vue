<script setup lang="ts">
import {
  emptyCatalogItemDraft,
  emptySupplierDraft,
  type CatalogTipoFilter
} from '../utils/catalog'
import { emptyChecklistItemDraft } from '#layers/orders/app/utils/checklist'

defineOptions({ name: 'CatalogIndexPage' })

definePageMeta({
  path: '/catalogo'
})

useRequirePermission('catalog.manage')

const tab = ref<'budget' | 'suppliers' | 'checklist'>('budget')
const tipoFilter = ref<CatalogTipoFilter>('all')

const tabItems = [
  { label: 'Catálogo', value: 'budget', icon: 'i-lucide-package' },
  { label: 'Fornecedores', value: 'suppliers', icon: 'i-lucide-truck' },
  { label: 'Checklist', value: 'checklist', icon: 'i-lucide-clipboard-check' }
]

const tipoFilterItems = [
  { label: 'Todos', value: 'all' },
  { label: 'Serviços', value: 'servico' },
  { label: 'Kits', value: 'kit' },
  { label: 'Peças', value: 'peca' }
] as const

// --- Orçamento / catálogo ---
const { items: budgetItems, pending: budgetPending, refresh: refreshBudget } = await useCatalogList()
const {
  createCatalogItem,
  updateCatalogItem,
  setCatalogItemAtivo
} = useCatalogMutations()

const budgetDraft = reactive(emptyCatalogItemDraft())
const budgetAdding = ref(false)
const budgetSavingId = ref<string | null>(null)
const budgetTogglingId = ref<string | null>(null)

const filteredBudgetItems = computed(() => {
  const rows = budgetItems.value || []
  if (tipoFilter.value === 'all') return rows
  return rows.filter(item => item.tipo === tipoFilter.value)
})

async function onBudgetAdd() {
  budgetAdding.value = true
  try {
    const { error } = await createCatalogItem({
      ...budgetDraft,
      kit_itens: [...budgetDraft.kit_itens]
    })
    if (!error) {
      Object.assign(budgetDraft, emptyCatalogItemDraft())
      await refreshBudget()
    }
  } finally {
    budgetAdding.value = false
  }
}

async function onBudgetSave(payload: {
  id: string
  draft: ReturnType<typeof emptyCatalogItemDraft>
}) {
  budgetSavingId.value = payload.id
  try {
    const { error } = await updateCatalogItem(payload.id, payload.draft)
    if (!error) await refreshBudget()
  } finally {
    budgetSavingId.value = null
  }
}

async function onBudgetToggleAtivo(payload: { id: string, ativo: boolean }) {
  budgetTogglingId.value = payload.id
  try {
    const { error } = await setCatalogItemAtivo(payload.id, payload.ativo)
    if (!error) await refreshBudget()
  } finally {
    budgetTogglingId.value = null
  }
}

// --- Fornecedores ---
const {
  suppliers,
  pending: suppliersPending,
  refresh: refreshSuppliers
} = await useSuppliersList()
const {
  createSupplier,
  updateSupplier,
  setSupplierAtivo
} = useSupplierMutations()

const supplierDraft = reactive(emptySupplierDraft())
const supplierAdding = ref(false)
const supplierSavingId = ref<string | null>(null)
const supplierTogglingId = ref<string | null>(null)

const activeSuppliers = computed(() => suppliers.value || [])

async function onSupplierAdd() {
  supplierAdding.value = true
  try {
    const { error } = await createSupplier({ ...supplierDraft })
    if (!error) {
      Object.assign(supplierDraft, emptySupplierDraft())
      await refreshSuppliers()
    }
  } finally {
    supplierAdding.value = false
  }
}

async function onSupplierSave(payload: {
  id: string
  draft: ReturnType<typeof emptySupplierDraft>
}) {
  supplierSavingId.value = payload.id
  try {
    const { error } = await updateSupplier(payload.id, payload.draft)
    if (!error) await refreshSuppliers()
  } finally {
    supplierSavingId.value = null
  }
}

async function onSupplierToggleAtivo(payload: { id: string, ativo: boolean }) {
  supplierTogglingId.value = payload.id
  try {
    const { error } = await setSupplierAtivo(payload.id, payload.ativo)
    if (!error) await refreshSuppliers()
  } finally {
    supplierTogglingId.value = null
  }
}

// --- Checklist ---
const { items: checklistItems, pending: checklistPending, refresh: refreshChecklist } = await useChecklistCatalogList()
const {
  createChecklistCatalogItem,
  updateChecklistCatalogItem,
  setChecklistCatalogItemAtivo
} = useChecklistCatalogMutations()

const checklistDraft = reactive(emptyChecklistItemDraft())
const checklistAdding = ref(false)
const checklistSavingId = ref<string | null>(null)
const checklistTogglingId = ref<string | null>(null)

async function onChecklistAdd() {
  checklistAdding.value = true
  try {
    const nextOrdem = checklistItems.value?.length || 0
    const { error } = await createChecklistCatalogItem(checklistDraft, nextOrdem)
    if (!error) {
      Object.assign(checklistDraft, emptyChecklistItemDraft())
      await refreshChecklist()
    }
  } finally {
    checklistAdding.value = false
  }
}

async function onChecklistSave(payload: { id: string, categoria: string, label: string }) {
  checklistSavingId.value = payload.id
  try {
    const { error } = await updateChecklistCatalogItem(payload.id, payload)
    if (!error) await refreshChecklist()
  } finally {
    checklistSavingId.value = null
  }
}

async function onChecklistToggleAtivo(payload: { id: string, ativo: boolean }) {
  checklistTogglingId.value = payload.id
  try {
    const { error } = await setChecklistCatalogItemAtivo(payload.id, payload.ativo)
    if (!error) await refreshChecklist()
  } finally {
    checklistTogglingId.value = null
  }
}
</script>

<template>
  <UDashboardPanel>
    <template #body>
      <div class="p-4 sm:p-6 space-y-6 max-w-6xl">
        <BasePageHeader
          title="Cadastro de Serviços e Peças"
          description="Base completa para acelerar os orçamentos."
        />

        <UTabs
          v-model="tab"
          :items="tabItems"
          class="w-full"
        />

        <div
          v-if="tab === 'budget'"
          class="space-y-6"
        >
          <div class="flex flex-wrap gap-2">
            <UButton
              v-for="item in tipoFilterItems"
              :key="item.value"
              size="sm"
              :variant="tipoFilter === item.value ? 'solid' : 'soft'"
              :color="tipoFilter === item.value ? 'primary' : 'neutral'"
              :label="item.label"
              @click="tipoFilter = item.value"
            />
          </div>

          <div class="space-y-6 lg:grid lg:grid-cols-3 lg:items-start lg:gap-6 lg:space-y-0">
            <CatalogForm
              v-model:draft="budgetDraft"
              class="lg:col-span-1"
              :adding="budgetAdding"
              :suppliers="activeSuppliers"
              :catalog-items="budgetItems || []"
              @add="onBudgetAdd"
            />

            <section class="space-y-4 lg:col-span-2">
              <h2 class="text-lg font-semibold text-highlighted">
                Itens cadastrados
              </h2>

              <div
                v-if="budgetPending && !budgetItems?.length"
                class="space-y-2"
              >
                <USkeleton class="h-10 w-full" />
                <USkeleton class="h-10 w-full" />
              </div>

              <CatalogTable
                v-else-if="filteredBudgetItems.length"
                :items="filteredBudgetItems"
                :suppliers="activeSuppliers"
                :catalog-items="budgetItems || []"
                :saving-id="budgetSavingId"
                :toggling-id="budgetTogglingId"
                @save="onBudgetSave"
                @toggle-ativo="onBudgetToggleAtivo"
              />

              <BaseEmptyState v-else>
                Nenhum item no catálogo{{ tipoFilter === 'all' ? '' : ' neste filtro' }}. Adicione ao lado.
              </BaseEmptyState>
            </section>
          </div>
        </div>

        <div
          v-else-if="tab === 'suppliers'"
          class="space-y-6 lg:grid lg:grid-cols-3 lg:items-start lg:gap-6 lg:space-y-0"
        >
          <CatalogSuppliersForm
            v-model:draft="supplierDraft"
            class="lg:col-span-1"
            :adding="supplierAdding"
            @add="onSupplierAdd"
          />

          <section class="space-y-4 lg:col-span-2">
            <h2 class="text-lg font-semibold text-highlighted">
              Fornecedores
            </h2>

            <div
              v-if="suppliersPending && !suppliers?.length"
              class="space-y-2"
            >
              <USkeleton class="h-10 w-full" />
              <USkeleton class="h-10 w-full" />
            </div>

            <CatalogSuppliersTable
              v-else-if="suppliers?.length"
              :suppliers="suppliers"
              :saving-id="supplierSavingId"
              :toggling-id="supplierTogglingId"
              @save="onSupplierSave"
              @toggle-ativo="onSupplierToggleAtivo"
            />

            <BaseEmptyState v-else>
              Nenhum fornecedor cadastrado. Adicione ao lado.
            </BaseEmptyState>
          </section>
        </div>

        <div
          v-else
          class="space-y-6 lg:grid lg:grid-cols-3 lg:items-start lg:gap-6 lg:space-y-0"
        >
          <OrdersChecklistCatalogForm
            v-model:draft="checklistDraft"
            class="lg:col-span-1"
            :items="checklistItems || []"
            :adding="checklistAdding"
            @add="onChecklistAdd"
          />

          <section class="space-y-4 lg:col-span-2">
            <h2 class="text-lg font-semibold text-highlighted">
              Itens cadastrados
            </h2>

            <div
              v-if="checklistPending && !checklistItems?.length"
              class="space-y-2"
            >
              <USkeleton class="h-10 w-full" />
              <USkeleton class="h-10 w-full" />
            </div>

            <OrdersChecklistCatalogTable
              v-else-if="checklistItems?.length"
              :items="checklistItems"
              :saving-id="checklistSavingId"
              :toggling-id="checklistTogglingId"
              @save="onChecklistSave"
              @toggle-ativo="onChecklistToggleAtivo"
            />

            <BaseEmptyState v-else>
              Nenhum item no catálogo. Adicione acima.
            </BaseEmptyState>
          </section>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
