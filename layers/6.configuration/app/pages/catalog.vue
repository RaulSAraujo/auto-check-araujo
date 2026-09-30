<script setup lang="ts">
import {
  CATALOG_TIPO_FILTER_ITEMS,
  catalogDraftFromRow,
  emptyCatalogItemDraft,
  type CatalogItemDraft,
  type CatalogItemRow,
  type CatalogTipoFilter
} from '../utils/catalog'
import { settingsHubBreadcrumb } from '../utils/settings-hub'
import { applyVoiceFields } from '#layers/base/app/utils/voice/apply'
import { VOICE_CATALOG } from '#layers/base/app/utils/voice/catalog'
import type { VoiceRecord } from '#layers/base/app/utils/voice/types'

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
  status: budgetStatus,
  tipoFilter,
  refresh: refreshBudget,
  fetchItem: fetchCatalogItem
} = useCatalogList(initialTipo)
const { data: activeCatalogItems, status: activeCatalogStatus } = useServiceCatalog()
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
const deleteTargetName = ref<string>()
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

const deleteTitle = computed(() =>
  deleteTargetName.value ? `Excluir o item "${deleteTargetName.value}"?` : undefined
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

async function applyCatalogVoice(fields: VoiceRecord) {
  const { tipo, usar_preco_sugerido, valor_padrao, ...rest } = fields
  if (typeof tipo === 'string') budgetDraft.tipo = tipo as CatalogItemDraft['tipo']
  // CatalogForm's tipo watcher resets custo/estoque/horas/preco_manual; let it run before applying spoken values.
  await nextTick()
  applyVoiceFields(budgetDraft as unknown as Record<string, unknown>, rest, VOICE_CATALOG.catalogItem)
  if (typeof valor_padrao === 'number') {
    if (budgetDraft.tipo === 'servico') budgetDraft.preco_manual = true
    budgetDraft.valor_padrao = valor_padrao
  }
  if (typeof usar_preco_sugerido === 'boolean') budgetDraft.preco_manual = !usar_preco_sugerido
}

function applyKitItems(items: VoiceRecord[]) {
  const toast = useToast()
  if (budgetDraft.tipo !== 'kit') {
    toast.add({ title: 'Itens só podem ser incluídos em kits.', color: 'warning' })
    return
  }
  if (!activeCatalogItems.value) {
    toast.add({ title: 'Não foi possível carregar o catálogo para incluir os itens.', color: 'warning' })
    return
  }
  for (const item of items) {
    const id = typeof item.item === 'string' ? item.item : undefined
    if (!id) continue
    if (id === editingId.value) {
      toast.add({ title: 'Um kit não pode conter ele mesmo.', color: 'warning' })
      continue
    }
    if (activeCatalogItems.value.find(row => row.id === id)?.tipo === 'kit') {
      toast.add({ title: 'Kits não podem conter outros kits.', color: 'warning' })
      continue
    }
    const quantidade = typeof item.quantidade === 'number' ? item.quantidade : 1
    const existing = budgetDraft.kit_itens.find(row => row.item_id === id)
    if (existing) existing.quantidade = quantidade
    else budgetDraft.kit_itens.push({ item_id: id, quantidade })
  }
}

function openEditId() {
  return formOpen.value && formMode.value === 'edit' ? editingId.value ?? undefined : undefined
}

useVoiceForm('catalogItem', {
  // Kit items are handled here, not in `onItems`, so they share the open-form guards.
  apply: async (draft) => {
    const editingThis = draft.op === 'edit' && !!draft.id && openEditId() === draft.id
    if (formOpen.value && !editingThis) {
      useToast().add({ title: 'Feche o formulário aberto antes.', color: 'warning' })
      return
    }
    if (draft.op === 'create') {
      openCreate()
    } else if (!editingThis) {
      const loaded = findBudgetItem(draft.id!)
      const { item, error } = loaded ? { item: loaded, error: null } : await fetchCatalogItem(draft.id!)
      if (!item) {
        const title = error ? 'Não foi possível carregar o item do catálogo.' : 'Item não encontrado no catálogo.'
        useToast().add({ title, color: 'warning' })
        return
      }
      openEdit(item)
    }
    await nextTick()
    await applyCatalogVoice(draft.fields)
    if (draft.items?.length) applyKitItems(draft.items)
  },
  actions: {
    desativar: draft => onBudgetToggleAtivo({ id: draft.id!, ativo: false }),
    reativar: draft => onBudgetToggleAtivo({ id: draft.id!, ativo: true }),
    excluir: (draft) => {
      onBudgetRequestDelete({ id: draft.id!, name: draft.label })
    }
  },
  currentId: openEditId,
  label: () => budgetDraft.nome,
  ready: () => [budgetStatus.value, activeCatalogStatus.value].every(status => status === 'success' || status === 'error')
})

function findBudgetItem(id: string) {
  return (budgetItems.value as CatalogItemRow[]).find(row => row.id === id)
}

function openEdit(item: CatalogItemRow) {
  formMode.value = 'edit'
  editingId.value = item.id
  Object.assign(budgetDraft, catalogDraftFromRow(item))
  formOpen.value = true
}

function onBudgetEdit(payload: { id: string }) {
  const item = findBudgetItem(payload.id)
  if (item) openEdit(item)
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

function onBudgetRequestDelete(payload: { id: string, name?: string }) {
  deleteTargetId.value = payload.id
  deleteTargetName.value = payload.name ?? findBudgetItem(payload.id)?.nome
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
            :title="deleteTitle"
            :loading="deleting"
            @confirm="onBudgetConfirmDelete"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
