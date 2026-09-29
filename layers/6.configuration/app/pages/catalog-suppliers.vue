<script setup lang="ts">
import type { Fornecedor } from '~~/shared/types/database'
import { emptySupplierDraft } from '../utils/catalog'
import { settingsHubBreadcrumb } from '../utils/settings-hub'

defineOptions({ name: 'CatalogSuppliersPage' })

definePageMeta({
  path: '/configuracao/fornecedores'
})

useSeoMeta({
  title: 'Fornecedores',
  description: 'Fornecedores da oficina usados no catálogo e no financeiro.'
})

useRequirePermission('catalog.manage')

const breadcrumbItems = settingsHubBreadcrumb('Fornecedores')

const {
  suppliers,
  pending: suppliersPending,
  refresh: refreshSuppliers
} = useSuppliersList()
const {
  createSupplier,
  updateSupplier,
  setSupplierAtivo,
  deleteSupplier
} = useSupplierMutations()

const formOpen = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const editingId = ref<string | null>(null)
const supplierDraft = reactive(emptySupplierDraft())
const formSaving = ref(false)
const supplierTogglingId = ref<string | null>(null)
const deleteOpen = ref(false)
const deleteTargetId = ref<string | null>(null)
const deleting = ref(false)
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

const formTitle = computed(() =>
  formMode.value === 'edit' ? 'Editar fornecedor' : 'Novo fornecedor'
)

const formDescription = computed(() =>
  formMode.value === 'edit'
    ? 'Altere os dados e salve.'
    : 'Entra no catálogo e no financeiro.'
)

watch(formOpen, (open) => {
  if (!open) {
    formMode.value = 'create'
    editingId.value = null
    Object.assign(supplierDraft, emptySupplierDraft())
  }
})

function openCreate() {
  formMode.value = 'create'
  editingId.value = null
  Object.assign(supplierDraft, emptySupplierDraft())
  formOpen.value = true
}

const { onVoiceDraft } = useVoiceDraft()
onVoiceDraft('supplier.create', (draft) => {
  openCreate()
  if (draft.nome) supplierDraft.nome = draft.nome
  if (draft.telefone) supplierDraft.telefone = draft.telefone
  if (draft.email) supplierDraft.email = draft.email
  if (draft.observacoes) supplierDraft.observacoes = draft.observacoes
})

function onSupplierEdit(payload: { id: string }) {
  const supplier = activeSuppliers.value.find((row: Fornecedor) => row.id === payload.id)
  if (!supplier) return
  formMode.value = 'edit'
  editingId.value = supplier.id
  supplierDraft.nome = supplier.nome
  supplierDraft.telefone = supplier.telefone || ''
  supplierDraft.email = supplier.email || ''
  supplierDraft.observacoes = supplier.observacoes || ''
  formOpen.value = true
}

async function onFormSubmit() {
  formSaving.value = true
  try {
    if (formMode.value === 'edit' && editingId.value) {
      const { error } = await updateSupplier(editingId.value, { ...supplierDraft })
      if (!error) {
        formOpen.value = false
        await refreshSuppliers()
      }
      return
    }

    const { error } = await createSupplier({ ...supplierDraft })
    if (!error) {
      formOpen.value = false
      await refreshSuppliers()
    }
  } finally {
    formSaving.value = false
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

function onSupplierRequestDelete(payload: { id: string }) {
  deleteTargetId.value = payload.id
  deleteOpen.value = true
}

async function onSupplierConfirmDelete() {
  if (!deleteTargetId.value) return
  deleting.value = true
  try {
    const { error, blocked } = await deleteSupplier(deleteTargetId.value)
    if (!error && !blocked) {
      deleteOpen.value = false
      deleteTargetId.value = null
      await refreshSuppliers()
    } else if (blocked) {
      deleteOpen.value = false
      deleteTargetId.value = null
    }
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <UDashboardPanel>
    <template #body>
      <div class="bg-muted p-4 sm:p-6">
        <div class="w-full space-y-6">
          <BasePageHeader
            title="Fornecedores"
            description="Usados no catálogo e no financeiro."
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
                label="Novo fornecedor"
                icon="i-lucide-plus"
                class="w-full justify-center sm:w-auto"
                @click="openCreate"
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
            :toggling-id="supplierTogglingId"
            @edit="onSupplierEdit"
            @toggle-ativo="onSupplierToggleAtivo"
            @delete="onSupplierRequestDelete"
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
                @click="openCreate"
              />
            </template>
          </BaseEmptyState>

          <USlideover
            v-model:open="formOpen"
            :title="formTitle"
            :description="formDescription"
            :ui="{ content: 'overscroll-contain' }"
          >
            <template #body>
              <CatalogSuppliersForm
                v-model:draft="supplierDraft"
                :mode="formMode"
                :saving="formSaving"
                @submit="onFormSubmit"
              />
            </template>
          </USlideover>

          <CatalogDeleteModal
            v-model:open="deleteOpen"
            title="Excluir fornecedor?"
            description="Esta ação não pode ser desfeita. Só é permitido se não houver itens no catálogo nem contas a pagar vinculadas."
            :loading="deleting"
            @confirm="onSupplierConfirmDelete"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
