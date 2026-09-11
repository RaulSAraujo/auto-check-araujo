<script setup lang="ts">
import { emptySupplierDraft } from '../utils/catalog'

defineOptions({ name: 'CatalogSuppliersPage' })

definePageMeta({
  path: '/configuracao/fornecedores'
})

useSeoMeta({
  title: 'Fornecedores',
  description: 'Fornecedores da oficina usados no catálogo e no financeiro.'
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

const createOpen = ref(false)
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

const countLabel = computed(() => {
  const n = activeSuppliers.value.length
  if (suppliersPending.value && !n) return null
  if (supplierQ.value.trim()) {
    const found = filteredSuppliers.value.length
    return found === 1 ? '1 encontrado' : `${found} encontrados`
  }
  return n === 1 ? '1 fornecedor' : `${n} fornecedores`
})

watch(createOpen, (open) => {
  if (!open) Object.assign(supplierDraft, emptySupplierDraft())
})

async function onSupplierAdd() {
  supplierAdding.value = true
  try {
    const { error } = await createSupplier({ ...supplierDraft })
    if (!error) {
      Object.assign(supplierDraft, emptySupplierDraft())
      createOpen.value = false
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
</script>

<template>
  <UDashboardPanel>
    <template #body>
      <div class="bg-muted p-4 sm:p-5">
        <div class="mx-auto w-full max-w-6xl space-y-5">
          <BasePageHeader
            title="Fornecedores"
            description="Usados no catálogo e no financeiro."
          >
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
                label="Novo fornecedor"
                icon="i-lucide-plus"
                @click="createOpen = true"
              />
            </template>
          </BasePageHeader>

          <UInput
            v-model="supplierQ"
            icon="i-lucide-search"
            placeholder="Buscar por nome, telefone ou e-mail…"
            autocomplete="off"
            aria-label="Buscar fornecedores"
            class="w-full sm:max-w-md"
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
              Nenhum fornecedor encontrado.
            </template>
            <template v-else>
              Nenhum fornecedor cadastrado.
            </template>
            <template #actions>
              <UButton
                v-if="supplierQ.trim()"
                label="Limpar busca"
                color="neutral"
                variant="soft"
                @click="supplierQ = ''"
              />
              <UButton
                v-else
                label="Novo fornecedor"
                icon="i-lucide-plus"
                @click="createOpen = true"
              />
            </template>
          </BaseEmptyState>

          <USlideover
            v-model:open="createOpen"
            title="Novo fornecedor"
            description="Entra no catálogo e no financeiro."
            :ui="{ content: 'overscroll-contain' }"
          >
            <template #body>
              <CatalogSuppliersForm
                v-model:draft="supplierDraft"
                :adding="supplierAdding"
                @add="onSupplierAdd"
              />
            </template>
          </USlideover>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
