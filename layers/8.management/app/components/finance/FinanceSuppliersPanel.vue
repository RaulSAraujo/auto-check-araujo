<script setup lang="ts">
import type { Fornecedor } from '~~/shared/types/database'
import {
  emptySupplierDraft,
  isSupplierDraftValid,
  type SupplierDraft
} from '#layers/configuration/app/utils/catalog'
import { EMPTY_VALUE } from '~~/shared/utils/empty'
import { toSentenceCase, toTitleCasePt } from '~~/shared/utils/text-case'

defineOptions({ name: 'FinanceSuppliersPanel' })

const props = defineProps<{
  suppliers: Fornecedor[]
  loading?: boolean
  adding: boolean
  savingId: string | null
  togglingId: string | null
}>()

const emit = defineEmits<{
  add: [draft: SupplierDraft]
  save: [payload: { id: string, draft: SupplierDraft }]
  toggleAtivo: [payload: { id: string, ativo: boolean }]
}>()

const draft = reactive(emptySupplierDraft())
const editingId = ref<string | null>(null)
const editDraft = reactive(emptySupplierDraft())

function onAdd() {
  if (!isSupplierDraftValid(draft)) return
  emit('add', { ...draft })
}

watch(() => props.adding, (adding) => {
  if (!adding) Object.assign(draft, emptySupplierDraft())
})

function startEdit(supplier: Fornecedor) {
  editingId.value = supplier.id
  editDraft.nome = supplier.nome
  editDraft.telefone = supplier.telefone || ''
  editDraft.email = supplier.email || ''
  editDraft.observacoes = supplier.observacoes || ''
}

function cancelEdit() {
  editingId.value = null
}

function saveEdit(id: string) {
  if (!isSupplierDraftValid(editDraft)) return
  emit('save', { id, draft: { ...editDraft } })
}

watch(() => props.savingId, (id) => {
  if (!id) editingId.value = null
})
</script>

<template>
  <div class="space-y-5">
    <div class="space-y-3">
      <UFormField
        label="Nome"
        name="fornecedor_nome"
        required
      >
        <UInput
          v-model="draft.nome"
          name="fornecedor_nome"
          autocomplete="organization"
          class="w-full"
          placeholder="Auto Peças Central…"
          @blur="draft.nome = toTitleCasePt(draft.nome)"
        />
      </UFormField>

      <UFormField
        label="Telefone"
        name="fornecedor_telefone"
      >
        <UInput
          v-model="draft.telefone"
          name="fornecedor_telefone"
          type="tel"
          inputmode="tel"
          autocomplete="tel"
          class="w-full"
          placeholder="(16) 99999-9999"
        />
      </UFormField>

      <UFormField
        label="E-mail"
        name="fornecedor_email"
      >
        <UInput
          v-model="draft.email"
          name="fornecedor_email"
          type="email"
          autocomplete="email"
          spellcheck="false"
          class="w-full"
          placeholder="contato@fornecedor.com"
        />
      </UFormField>

      <UFormField
        label="Observações"
        name="fornecedor_observacoes"
      >
        <UTextarea
          v-model="draft.observacoes"
          name="fornecedor_observacoes"
          class="w-full"
          :rows="2"
          placeholder="Prazo de entrega, contato…"
          @blur="draft.observacoes = toSentenceCase(draft.observacoes)"
        />
      </UFormField>

      <UButton
        label="Adicionar fornecedor"
        icon="i-lucide-plus"
        block
        class="active:scale-[0.98]"
        :loading="adding"
        :disabled="!isSupplierDraftValid(draft)"
        @click="onAdd"
      />
    </div>

    <ul class="divide-y divide-default overflow-hidden rounded-lg border border-default bg-default shadow-sm dark:border-accented dark:bg-elevated dark:shadow-none">
      <template v-if="loading">
        <li
          v-for="n in 3"
          :key="n"
          class="px-3 py-3"
        >
          <USkeleton class="h-8 w-full" />
        </li>
      </template>

      <li
        v-else-if="!suppliers.length"
        class="px-3 py-8"
      >
        <BaseEmptyState icon="i-lucide-truck">
          Nenhum fornecedor cadastrado.
        </BaseEmptyState>
      </li>

      <li
        v-for="supplier in suppliers"
        v-else
        :key="supplier.id"
        class="px-3 py-3 transition-colors duration-200 ease-[var(--ease-out)] hover:bg-elevated/60"
        :class="!supplier.ativo ? 'opacity-60' : ''"
      >
        <template v-if="editingId === supplier.id">
          <div class="space-y-2">
            <UInput
              v-model="editDraft.nome"
              size="sm"
              class="w-full"
              placeholder="Nome"
              @blur="editDraft.nome = toTitleCasePt(editDraft.nome)"
            />
            <UInput
              v-model="editDraft.telefone"
              size="sm"
              class="w-full"
              placeholder="Telefone"
            />
            <UInput
              v-model="editDraft.email"
              size="sm"
              class="w-full"
              placeholder="E-mail"
            />
            <div class="flex justify-end gap-1">
              <UButton
                label="Salvar"
                size="sm"
                class="active:scale-[0.98]"
                :loading="savingId === supplier.id"
                @click="saveEdit(supplier.id)"
              />
              <UButton
                label="Cancelar"
                size="sm"
                color="neutral"
                variant="ghost"
                @click="cancelEdit"
              />
            </div>
          </div>
        </template>
        <div
          v-else
          class="flex items-start gap-2"
        >
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <p class="truncate font-medium text-highlighted">
                {{ supplier.nome }}
              </p>
              <UBadge
                :color="supplier.ativo ? 'success' : 'neutral'"
                variant="subtle"
                size="sm"
                class="shrink-0"
              >
                {{ supplier.ativo ? 'Ativo' : 'Inativo' }}
              </UBadge>
            </div>
            <p class="mt-0.5 truncate text-xs text-muted">
              {{ [supplier.telefone, supplier.email].filter(Boolean).join(' · ') || EMPTY_VALUE }}
            </p>
          </div>
          <div class="flex shrink-0 gap-0.5">
            <UButton
              icon="i-lucide-pencil"
              size="sm"
              color="neutral"
              variant="ghost"
              aria-label="Editar"
              @click="startEdit(supplier)"
            />
            <UButton
              :icon="supplier.ativo ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              size="sm"
              color="neutral"
              variant="ghost"
              :loading="togglingId === supplier.id"
              :aria-label="supplier.ativo ? 'Desativar' : 'Ativar'"
              @click="emit('toggleAtivo', { id: supplier.id, ativo: !supplier.ativo })"
            />
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
