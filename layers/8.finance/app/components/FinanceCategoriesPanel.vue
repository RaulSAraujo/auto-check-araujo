<script setup lang="ts">
import type { FinanceiroCategoria } from '~~/shared/types/database'
import {
  emptyFinanceCategoryDraft,
  isFinanceCategoryDraftValid,
  type FinanceCategoryDraft
} from '../utils/accounts-payable'

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
  <div class="grid gap-6 lg:grid-cols-[minmax(0,20rem)_1fr]">
    <BasePanel title="Nova categoria">
      <div class="space-y-3">
        <UFormField
          label="Nome"
          required
        >
          <UInput
            v-model="draft.nome"
            class="w-full"
            placeholder="Ex.: Combustível"
          />
        </UFormField>
        <UButton
          label="Adicionar"
          icon="i-lucide-plus"
          :loading="adding"
          :disabled="!isFinanceCategoryDraftValid(draft)"
          @click="onAdd"
        />
      </div>
    </BasePanel>

    <div class="overflow-x-auto rounded-lg border border-default">
      <table class="w-full text-sm">
        <thead class="border-b border-default bg-elevated/50 text-left text-xs uppercase tracking-wide text-muted">
          <tr>
            <th class="px-3 py-2 font-medium">
              Nome
            </th>
            <th class="px-3 py-2 font-medium">
              Status
            </th>
            <th class="px-3 py-2 w-28" />
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr
            v-if="loading"
          >
            <td
              colspan="3"
              class="px-3 py-4"
            >
              <USkeleton class="h-6 w-full" />
            </td>
          </tr>
          <tr
            v-else-if="!categories.length"
          >
            <td
              colspan="3"
              class="px-3 py-6"
            >
              <BaseEmptyState icon="i-lucide-tags">
                Nenhuma categoria.
              </BaseEmptyState>
            </td>
          </tr>
          <tr
            v-for="category in categories"
            v-else
            :key="category.id"
            :class="!category.ativo ? 'opacity-60' : ''"
          >
            <td class="px-3 py-2">
              <UInput
                v-if="editingId === category.id"
                v-model="editDraft.nome"
                size="sm"
                class="w-full min-w-40"
              />
              <span
                v-else
                class="text-highlighted"
              >{{ category.nome }}</span>
            </td>
            <td class="px-3 py-2">
              <UBadge
                :color="category.ativo ? 'success' : 'neutral'"
                variant="subtle"
                size="sm"
              >
                {{ category.ativo ? 'Ativa' : 'Inativa' }}
              </UBadge>
            </td>
            <td class="px-3 py-2">
              <div class="flex justify-end gap-1">
                <template v-if="editingId === category.id">
                  <UButton
                    icon="i-lucide-check"
                    size="sm"
                    variant="ghost"
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
                </template>
                <template v-else>
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
                </template>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
