<script setup lang="ts">
import {
  CATALOG_TIPO_FILTER_ITEMS,
  emptyCatalogItemDraft,
  type CatalogTipoFilter
} from '../utils/catalog'

defineOptions({ name: 'CatalogIndexPage' })

definePageMeta({
  path: '/configuracao/catalogo'
})

useSeoMeta({
  title: 'Catálogo',
  description: 'Configuração de serviços, peças e kits para orçamentos.'
})

useRequirePermission('catalog.manage')

const tipoFilter = ref<CatalogTipoFilter>('all')

const {
  q: budgetQ,
  items: budgetItems,
  page: budgetPage,
  pageSize: budgetPageSize,
  total: budgetTotal,
  pending: budgetPending,
  refresh: refreshBudget
} = await useCatalogList(tipoFilter)
const { data: activeCatalogItems } = useServiceCatalog()
const { suppliers } = await useSuppliersList()
const {
  createCatalogItem,
  updateCatalogItem,
  setCatalogItemAtivo
} = useCatalogMutations()

const budgetDraft = reactive(emptyCatalogItemDraft())
const budgetAdding = ref(false)
const budgetSavingId = ref<string | null>(null)
const budgetTogglingId = ref<string | null>(null)

const activeSuppliers = computed(() => suppliers.value || [])

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

function countLabel(n: number, singular: string, plural: string) {
  return `${n} ${n === 1 ? singular : plural}`
}
</script>

<template>
  <UDashboardPanel>
    <template #body>
      <div class="bg-muted p-4 sm:p-5">
        <div class="mx-auto w-full max-w-6xl space-y-5">
          <BasePageHeader
            title="Catálogo"
            description="Configure serviços, peças e kits usados nos orçamentos."
          >
            <template #title-trailing>
              <UBadge
                color="neutral"
                variant="subtle"
                size="sm"
              >
                Configuração
              </UBadge>
            </template>
          </BasePageHeader>

          <div class="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
            <CatalogForm
              v-model:draft="budgetDraft"
              :adding="budgetAdding"
              :suppliers="activeSuppliers"
              :catalog-items="activeCatalogItems || []"
              @add="onBudgetAdd"
            />

            <section
              class="min-w-0 space-y-3"
              aria-labelledby="catalog-items-heading"
            >
              <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div class="flex min-h-9 flex-wrap items-baseline gap-2">
                  <h2
                    id="catalog-items-heading"
                    class="text-sm font-semibold uppercase tracking-widest text-muted"
                  >
                    Itens
                  </h2>
                  <span
                    v-if="!budgetPending || budgetTotal > 0"
                    class="text-xs tabular-nums text-muted"
                  >
                    {{ countLabel(budgetTotal, 'cadastrado', 'cadastrados') }}
                  </span>
                </div>
                <UTabs
                  v-model="tipoFilter"
                  :items="[...CATALOG_TIPO_FILTER_ITEMS]"
                  size="sm"
                  class="w-full sm:w-auto"
                />
              </div>

              <UInput
                v-model="budgetQ"
                icon="i-lucide-search"
                placeholder="Buscar por nome…"
                autocomplete="off"
                class="w-full"
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
                <template v-if="budgetQ.trim() || tipoFilter !== 'all'">
                  Nenhum item encontrado. Ajuste a busca ou o filtro.
                </template>
                <template v-else>
                  Nenhum item cadastrado. Use o formulário para adicionar.
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
            </section>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
