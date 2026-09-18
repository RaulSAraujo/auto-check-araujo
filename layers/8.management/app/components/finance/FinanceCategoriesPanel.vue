<script setup lang="ts">
import type { FinanceiroCategoria } from '~~/shared/types/database'
import {
  emptyFinanceCategoryDraft,
  isFinanceCategoryDraftValid,
  type FinanceCategoryDraft
} from '../../utils/accounts-payable'
import { toTitleCasePt } from '~~/shared/utils/text-case'

defineOptions({ name: 'FinanceCategoriesPanel' })

const props = defineProps<{
  categories: FinanceiroCategoria[]
  loading?: boolean
  adding: boolean
  savingId: string | null
  togglingId: string | null
}>()

const emit = defineEmits<{
  add: [draft: FinanceCategoryDraft]
  save: [payload: { id: string, draft: FinanceCategoryDraft }]
  toggleAtivo: [payload: { id: string, ativo: boolean }]
}>()

const draft = reactive(emptyFinanceCategoryDraft())
const editingId = ref<string | null>(null)
const editDraft = reactive(emptyFinanceCategoryDraft())

function onAdd() {
  if (!isFinanceCategoryDraftValid(draft)) return
  emit('add', { nome: draft.nome })
}

watch(() => props.adding, (adding) => {
  if (!adding) Object.assign(draft, emptyFinanceCategoryDraft())
})

function startEdit(category: FinanceiroCategoria) {
  editingId.value = category.id
  editDraft.nome = category.nome
}

function cancelEdit() {
  editingId.value = null
}

function saveEdit(id: string) {
  if (!isFinanceCategoryDraftValid(editDraft)) return
  emit('save', { id, draft: { nome: editDraft.nome } })
}

watch(() => props.savingId, (id) => {
  if (!id) editingId.value = null
})
</script>

<template>
  <div class="space-y-5">
    <UFormField
      label="Nome"
      name="categoria_nome"
      required
    >
      <div class="flex items-center gap-2">
        <UInput
          v-model="draft.nome"
          name="categoria_nome"
          autocomplete="off"
          class="min-w-0 flex-1"
          placeholder="Combustível…"
          @blur="draft.nome = toTitleCasePt(draft.nome)"
          @keydown.enter.prevent="onAdd"
        />
        <UButton
          label="Adicionar"
          icon="i-lucide-plus"
          class="shrink-0 active:scale-[0.98]"
          :loading="adding"
          :disabled="!isFinanceCategoryDraftValid(draft)"
          @click="onAdd"
        />
      </div>
    </UFormField>

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
        v-else-if="!categories.length"
        class="px-3 py-8"
      >
        <BaseEmptyState icon="i-lucide-tags">
          Nenhuma categoria.
        </BaseEmptyState>
      </li>

      <li
        v-for="category in categories"
        v-else
        :key="category.id"
        class="flex items-center gap-2 px-3 py-2.5 transition-colors duration-200 ease-[var(--ease-out)] hover:bg-elevated/60"
        :class="!category.ativo ? 'opacity-60' : ''"
      >
        <template v-if="editingId === category.id">
          <UInput
            v-model="editDraft.nome"
            size="sm"
            class="min-w-0 flex-1"
            @blur="editDraft.nome = toTitleCasePt(editDraft.nome)"
            @keydown.enter.prevent="saveEdit(category.id)"
          />
          <div class="flex shrink-0 gap-0.5">
            <UButton
              icon="i-lucide-check"
              size="sm"
              variant="ghost"
              class="active:scale-[0.98]"
              :loading="savingId === category.id"
              aria-label="Salvar"
              @click="saveEdit(category.id)"
            />
            <UButton
              icon="i-lucide-x"
              size="sm"
              color="neutral"
              variant="ghost"
              aria-label="Cancelar"
              @click="cancelEdit"
            />
          </div>
        </template>
        <template v-else>
          <p class="min-w-0 flex-1 truncate text-highlighted">
            {{ category.nome }}
          </p>
          <UBadge
            :color="category.ativo ? 'success' : 'neutral'"
            variant="subtle"
            size="sm"
            class="shrink-0"
          >
            {{ category.ativo ? 'Ativa' : 'Inativa' }}
          </UBadge>
          <div class="flex shrink-0 gap-0.5">
            <UButton
              icon="i-lucide-pencil"
              size="sm"
              color="neutral"
              variant="ghost"
              aria-label="Editar"
              @click="startEdit(category)"
            />
            <UButton
              :icon="category.ativo ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              size="sm"
              color="neutral"
              variant="ghost"
              :loading="togglingId === category.id"
              :aria-label="category.ativo ? 'Desativar' : 'Ativar'"
              @click="emit('toggleAtivo', { id: category.id, ativo: !category.ativo })"
            />
          </div>
        </template>
      </li>
    </ul>
  </div>
</template>
