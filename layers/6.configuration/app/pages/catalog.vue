<script setup lang="ts">
import {
  CATALOG_TIPO_FILTER_ITEMS,
  emptyCatalogItemDraft,
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
  setCatalogItemAtivo
} = useCatalogMutations()

const createOpen = ref(false)
const budgetDraft = reactive(emptyCatalogItemDraft())
const budgetAdding = ref(false)
const budgetSavingId = ref<string | null>(null)
const budgetTogglingId = ref<string | null>(null)

const activeSuppliers = computed(() => suppliers.value || [])

const countLabel = computed(() => {
  const n = budgetTotal.value
  if (budgetPending.value && !n) return null
  return n === 1 ? '1 item' : `${n} itens`
})

const hasActiveFilters = computed(() =>
  Boolean(budgetQ.value.trim()) || tipoFilter.value !== 'all'
)

watch(createOpen, (open) => {
  if (!open) Object.assign(budgetDraft, emptyCatalogItemDraft())
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
      createOpen.value = false
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

function clearFilters() {
  budgetQ.value = ''
  tipoFilter.value = 'all'
}
</script>

<template>
  <UDashboardPanel>
    <template #body>
      <div class="bg-muted p-4 sm:p-5">
        <div class="mx-auto w-full max-w-6xl space-y-5">
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
                @click="createOpen = true"
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
            :suppliers="activeSuppliers"
            :catalog-items="activeCatalogItems || []"
            :saving-id="budgetSavingId"
            :toggling-id="budgetTogglingId"
            @save="onBudgetSave"
            @toggle-ativo="onBudgetToggleAtivo"
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
                @click="createOpen = true"
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
            v-model:open="createOpen"
            title="Novo item"
            description="Entra no catálogo para orçamentos."
            :ui="{ content: 'overscroll-contain' }"
          >
            <template #body>
              <CatalogForm
                v-model:draft="budgetDraft"
                :adding="budgetAdding"
                :suppliers="activeSuppliers"
                :catalog-items="activeCatalogItems || []"
                @add="onBudgetAdd"
              />
            </template>
          </USlideover>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
