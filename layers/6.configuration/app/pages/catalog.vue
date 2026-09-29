<script setup lang="ts">
import {
  CATALOG_TIPO_FILTER_ITEMS,
  catalogDraftFromRow,
  emptyCatalogItemDraft,
  type CatalogItemRow,
  type CatalogTipoFilter
} from '../utils/catalog'
import { settingsHubBreadcrumb } from '../utils/settings-hub'

defineOptions({ name: 'CatalogIndexPage' })

definePageMeta({
  path: '/configuracao/catalogo'
})

useSeoMeta({
  title: 'Catálogo',
  description: 'Serviços, peças e kits para orçamentos.'
})

useRequirePermission('catalog.manage')

const breadcrumbItems = settingsHubBreadcrumb('Catálogo')
const route = useRoute()

const initialTipo = (['servico', 'kit', 'peca'].includes(String(route.query.tipo))
  ? route.query.tipo as CatalogTipoFilter
  : 'all')

const {
  q: budgetQ,
  items: budgetItems,
  page: budgetPage,
  pageSize: budgetPageSize,
  total: budgetTotal,
  pending: budgetPending,
  tipoFilter,
  refresh: refreshBudget
} = useCatalogList(initialTipo)
const { data: activeCatalogItems } = useServiceCatalog()
const { suppliers } = useSuppliersList()
const {
  createCatalogItem,
  updateCatalogItem,
  setCatalogItemAtivo,
  deleteCatalogItem
} = useCatalogMutations()

const formOpen = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const editingId = ref<string | null>(null)
const budgetDraft = reactive(emptyCatalogItemDraft())
const formSaving = ref(false)
const budgetTogglingId = ref<string | null>(null)
const deleteOpen = ref(false)
const deleteTargetId = ref<string | null>(null)
const deleting = ref(false)

const activeSuppliers = computed(() => suppliers.value || [])

const countLabel = computed(() => {
  const n = budgetTotal.value
  if (budgetPending.value && !n) return null
  return n === 1 ? '1 item' : `${n} itens`
})

const hasActiveFilters = computed(() =>
  Boolean(budgetQ.value.trim()) || tipoFilter.value !== 'all'
)

const formTitle = computed(() =>
  formMode.value === 'edit' ? 'Editar item' : 'Novo item'
)

const formDescription = computed(() =>
  formMode.value === 'edit'
    ? 'Altere os dados e salve.'
    : 'Entra no catálogo para orçamentos.'
)

watch(formOpen, (open) => {
  if (!open) {
    formMode.value = 'create'
    editingId.value = null
    Object.assign(budgetDraft, emptyCatalogItemDraft())
  }
})

function openCreate() {
  formMode.value = 'create'
  editingId.value = null
  Object.assign(budgetDraft, emptyCatalogItemDraft())
  formOpen.value = true
}

const { onVoiceDraft } = useVoiceDraft()
onVoiceDraft('catalogItem.create', async (draft) => {
  openCreate()
  await nextTick()
  budgetDraft.tipo = draft.tipo
  // CatalogForm's tipo watcher resets custo/estoque/horas/preco_manual; let it run before applying spoken values
  await nextTick()
  if (draft.nome) budgetDraft.nome = draft.nome
  if (draft.custo != null) budgetDraft.custo = draft.custo
  if (draft.estoque != null) budgetDraft.estoque = draft.estoque
  if (draft.horas_estimadas != null) budgetDraft.horas_estimadas = draft.horas_estimadas
  if (draft.valor_padrao != null) {
    if (draft.tipo === 'servico') budgetDraft.preco_manual = true
    budgetDraft.valor_padrao = draft.valor_padrao
  }
})

function onBudgetEdit(payload: { id: string }) {
  const item = (budgetItems.value as CatalogItemRow[]).find(row => row.id === payload.id)
  if (!item) return
  formMode.value = 'edit'
  editingId.value = item.id
  Object.assign(budgetDraft, catalogDraftFromRow(item))
  formOpen.value = true
}

async function onFormSubmit() {
  formSaving.value = true
  try {
    if (formMode.value === 'edit' && editingId.value) {
      const { error } = await updateCatalogItem(editingId.value, {
        ...budgetDraft,
        kit_itens: [...budgetDraft.kit_itens]
      })
      if (!error) {
        formOpen.value = false
        await refreshBudget()
      }
      return
    }

    const { error } = await createCatalogItem({
      ...budgetDraft,
      kit_itens: [...budgetDraft.kit_itens]
    })
    if (!error) {
      formOpen.value = false
      await refreshBudget()
    }
  } finally {
    formSaving.value = false
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

function onBudgetRequestDelete(payload: { id: string }) {
  deleteTargetId.value = payload.id
  deleteOpen.value = true
}

async function onBudgetConfirmDelete() {
  if (!deleteTargetId.value) return
  deleting.value = true
  try {
    const { error, blocked } = await deleteCatalogItem(deleteTargetId.value)
    if (!error && !blocked) {
      deleteOpen.value = false
      deleteTargetId.value = null
      await refreshBudget()
    } else if (blocked) {
      deleteOpen.value = false
      deleteTargetId.value = null
    }
  } finally {
    deleting.value = false
  }
}

function clearFilters() {
  budgetQ.value = ''
  tipoFilter.value = 'all'
}
</script>

<template>
  <UDashboardPanel>
    <template #body>
      <div class="bg-muted p-4 sm:p-6">
        <div class="w-full space-y-6">
          <BasePageHeader
            title="Catálogo"
            description="Serviços, peças e kits usados nos orçamentos."
          >
            <template #breadcrumb>
              <UBreadcrumb :items="breadcrumbItems" />
            </template>

            <template
              v-if="countLabel"
              #below
            >
              <p class="text-xs tabular-nums text-muted">
                {{ countLabel }}
              </p>
            </template>

            <template #actions>
              <UButton
                label="Novo item"
                icon="i-lucide-plus"
                class="w-full justify-center sm:w-auto"
                @click="openCreate"
              />
            </template>
          </BasePageHeader>

          <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
            <UInput
              v-model="budgetQ"
              icon="i-lucide-search"
              placeholder="Buscar por nome…"
              autocomplete="off"
              aria-label="Buscar itens do catálogo"
              class="w-full sm:max-w-md"
              :ui="{ base: 'bg-default' }"
            >
              <template
                v-if="budgetQ"
                #trailing
              >
                <UButton
                  icon="i-lucide-x"
                  color="neutral"
                  variant="link"
                  size="sm"
                  aria-label="Limpar busca"
                  @click="budgetQ = ''"
                />
              </template>
            </UInput>

            <UTabs
              v-model="tipoFilter"
              :items="[...CATALOG_TIPO_FILTER_ITEMS]"
              size="sm"
              class="w-full sm:w-auto"
            />
          </div>

          <div
            v-if="budgetPending && !budgetItems.length"
            class="space-y-2"
          >
            <USkeleton class="h-10 w-full" />
            <USkeleton class="h-10 w-full" />
            <USkeleton class="h-10 w-full" />
          </div>

          <CatalogTable
            v-else-if="budgetItems.length"
            :items="budgetItems"
            :toggling-id="budgetTogglingId"
            @edit="onBudgetEdit"
            @toggle-ativo="onBudgetToggleAtivo"
            @delete="onBudgetRequestDelete"
          />

          <BaseEmptyState
            v-else
            icon="i-lucide-package"
          >
            <template v-if="hasActiveFilters">
              Nenhum item encontrado.
            </template>
            <template v-else>
              Nenhum item cadastrado.
            </template>
            <template #actions>
              <UButton
                v-if="hasActiveFilters"
                label="Limpar filtros"
                color="neutral"
                variant="soft"
                @click="clearFilters"
              />
              <UButton
                v-else
                label="Novo item"
                icon="i-lucide-plus"
                @click="openCreate"
              />
            </template>
          </BaseEmptyState>

          <div
            v-if="budgetTotal > budgetPageSize"
            class="flex justify-center pt-1"
          >
            <UPagination
              v-model:page="budgetPage"
              :total="budgetTotal"
              :items-per-page="budgetPageSize"
              show-edges
              :sibling-count="1"
            />
          </div>

          <USlideover
            v-model:open="formOpen"
            :title="formTitle"
            :description="formDescription"
            :ui="{ content: 'overscroll-contain' }"
          >
            <template #body>
              <CatalogForm
                v-model:draft="budgetDraft"
                :mode="formMode"
                :saving="formSaving"
                :exclude-item-id="editingId"
                :suppliers="activeSuppliers"
                :catalog-items="activeCatalogItems || []"
                @submit="onFormSubmit"
              />
            </template>
          </USlideover>

          <CatalogDeleteModal
            v-model:open="deleteOpen"
            :loading="deleting"
            @confirm="onBudgetConfirmDelete"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
