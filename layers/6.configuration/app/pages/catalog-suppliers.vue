<script setup lang="ts">
import { emptySupplierDraft } from '../utils/catalog'

defineOptions({ name: 'CatalogSuppliersPage' })

definePageMeta({
  path: '/configuracao/fornecedores'
})

useSeoMeta({
  title: 'Fornecedores',
  description: 'Configuração de fornecedores da oficina.'
})

useRequirePermission('catalog.manage')

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
const supplierQ = ref('')

const activeSuppliers = computed(() => suppliers.value || [])

const filteredSuppliers = computed(() => {
  const term = sanitizeIlikeTerm(supplierQ.value).toLowerCase()
  const list = activeSuppliers.value
  if (!term) return list
  return list.filter(s =>
    s.nome.toLowerCase().includes(term)
    || (s.telefone || '').toLowerCase().includes(term)
    || (s.email || '').toLowerCase().includes(term)
  )
})

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
            title="Fornecedores"
            description="Cadastre e mantenha os fornecedores usados no catálogo e no financeiro."
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
            <CatalogSuppliersForm
              v-model:draft="supplierDraft"
              :adding="supplierAdding"
              @add="onSupplierAdd"
            />

            <section
              class="min-w-0 space-y-3"
              aria-labelledby="catalog-suppliers-heading"
            >
              <div class="flex min-h-9 flex-wrap items-baseline gap-2">
                <h2
                  id="catalog-suppliers-heading"
                  class="text-sm font-semibold uppercase tracking-widest text-muted"
                >
                  Lista
                </h2>
                <span
                  v-if="!suppliersPending || activeSuppliers.length"
                  class="text-xs tabular-nums text-muted"
                >
                  {{ countLabel(filteredSuppliers.length, 'encontrado', 'encontrados') }}
                </span>
              </div>

              <UInput
                v-model="supplierQ"
                icon="i-lucide-search"
                placeholder="Buscar por nome, telefone ou e-mail…"
                autocomplete="off"
                class="w-full"
                :ui="{ base: 'bg-default' }"
              >
                <template
                  v-if="supplierQ"
                  #trailing
                >
                  <UButton
                    icon="i-lucide-x"
                    color="neutral"
                    variant="link"
                    size="sm"
                    aria-label="Limpar busca"
                    @click="supplierQ = ''"
                  />
                </template>
              </UInput>

              <div
                v-if="suppliersPending && !activeSuppliers.length"
                class="space-y-2"
              >
                <USkeleton class="h-10 w-full" />
                <USkeleton class="h-10 w-full" />
                <USkeleton class="h-10 w-full" />
              </div>

              <CatalogSuppliersTable
                v-else-if="filteredSuppliers.length"
                :suppliers="filteredSuppliers"
                :saving-id="supplierSavingId"
                :toggling-id="supplierTogglingId"
                @save="onSupplierSave"
                @toggle-ativo="onSupplierToggleAtivo"
              />

              <BaseEmptyState
                v-else
                icon="i-lucide-truck"
              >
                <template v-if="supplierQ.trim()">
                  Nenhum fornecedor encontrado. Ajuste a busca.
                </template>
                <template v-else>
                  Nenhum fornecedor cadastrado. Use o formulário para adicionar.
                </template>
              </BaseEmptyState>
            </section>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
