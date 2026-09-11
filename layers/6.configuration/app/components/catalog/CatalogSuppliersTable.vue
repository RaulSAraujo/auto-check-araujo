<script setup lang="ts">
import type { Fornecedor } from '~~/shared/types/database'
import { EMPTY_VALUE } from '~~/shared/utils/empty'
import {
  emptySupplierDraft,
  isSupplierDraftValid,
  type SupplierDraft
} from '../../utils/catalog'

defineOptions({ name: 'CatalogSuppliersTable' })

const props = defineProps<{
  suppliers: Fornecedor[]
  savingId: string | null
  togglingId: string | null
}>()

const emit = defineEmits<{
  save: [payload: { id: string, draft: SupplierDraft }]
  toggleAtivo: [payload: { id: string, ativo: boolean }]
}>()

const editingId = ref<string | null>(null)
const editDraft = reactive<SupplierDraft>(emptySupplierDraft())

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
  <div class="min-w-0 overflow-hidden rounded-lg border border-default bg-default shadow-sm dark:border-accented dark:bg-elevated dark:shadow-none">
    <div class="overflow-x-auto">
      <table class="w-full min-w-[32rem] text-sm">
        <thead class="border-b border-default bg-elevated/40 text-left text-xs text-muted">
          <tr>
            <th class="px-3 py-2.5 font-medium">
              Nome
            </th>
            <th class="px-3 py-2.5 font-medium">
              Telefone
            </th>
            <th
              class="px-3 py-2.5 font-medium"
              :class="editingId ? 'table-cell' : 'hidden sm:table-cell'"
            >
              E-mail
            </th>
            <th class="px-3 py-2.5 font-medium">
              Status
            </th>
            <th class="w-24 px-3 py-2.5">
              <span class="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr
            v-for="supplier in suppliers"
            :key="supplier.id"
            class="motion-safe:transition-colors hover:bg-elevated/40"
            :class="!supplier.ativo ? 'opacity-55' : ''"
          >
            <td class="min-w-0 px-3 py-2.5 align-top">
              <UInput
                v-if="editingId === supplier.id"
                v-model="editDraft.nome"
                size="sm"
                aria-label="Nome"
                autocomplete="organization"
                class="w-full min-w-40"
              />
              <div
                v-else
                class="min-w-0 space-y-0.5"
              >
                <span class="block truncate font-medium text-highlighted">{{ supplier.nome }}</span>
                <p
                  v-if="supplier.observacoes"
                  class="text-xs text-muted line-clamp-1"
                >
                  {{ supplier.observacoes }}
                </p>
              </div>
            </td>
            <td class="px-3 py-2.5 align-top">
              <UInput
                v-if="editingId === supplier.id"
                v-model="editDraft.telefone"
                type="tel"
                inputmode="tel"
                size="sm"
                aria-label="Telefone"
                autocomplete="tel"
                class="w-full min-w-32 tabular-nums"
              />
              <span
                v-else
                class="text-muted tabular-nums"
              >{{ supplier.telefone || EMPTY_VALUE }}</span>
            </td>
            <td
              class="min-w-0 px-3 py-2.5 align-top"
              :class="editingId === supplier.id ? 'table-cell' : 'hidden sm:table-cell'"
            >
              <UInput
                v-if="editingId === supplier.id"
                v-model="editDraft.email"
                type="email"
                size="sm"
                aria-label="E-mail"
                autocomplete="email"
                spellcheck="false"
                class="w-full min-w-40"
              />
              <span
                v-else
                class="block truncate text-muted"
              >{{ supplier.email || EMPTY_VALUE }}</span>
            </td>
            <td class="px-3 py-2.5 align-top">
              <UBadge
                :color="supplier.ativo ? 'success' : 'neutral'"
                variant="subtle"
                size="sm"
              >
                {{ supplier.ativo ? 'Ativo' : 'Inativo' }}
              </UBadge>
            </td>
            <td class="px-3 py-2.5 align-top">
              <div class="flex justify-end gap-0.5">
                <template v-if="editingId === supplier.id">
                  <UTooltip text="Salvar">
                    <UButton
                      icon="i-lucide-check"
                      color="success"
                      variant="ghost"
                      size="xs"
                      :loading="savingId === supplier.id"
                      :disabled="!isSupplierDraftValid(editDraft)"
                      aria-label="Salvar"
                      @click="saveEdit(supplier.id)"
                    />
                  </UTooltip>
                  <UTooltip text="Cancelar">
                    <UButton
                      icon="i-lucide-x"
                      color="neutral"
                      variant="ghost"
                      size="xs"
                      :disabled="savingId === supplier.id"
                      aria-label="Cancelar"
                      @click="cancelEdit"
                    />
                  </UTooltip>
                </template>
                <template v-else>
                  <UTooltip text="Editar">
                    <UButton
                      icon="i-lucide-pencil"
                      color="neutral"
                      variant="ghost"
                      size="xs"
                      aria-label="Editar"
                      @click="startEdit(supplier)"
                    />
                  </UTooltip>
                  <UTooltip :text="supplier.ativo ? 'Desativar' : 'Reativar'">
                    <UButton
                      :icon="supplier.ativo ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                      :color="supplier.ativo ? 'warning' : 'success'"
                      variant="ghost"
                      size="xs"
                      :loading="togglingId === supplier.id"
                      :aria-label="supplier.ativo ? 'Desativar' : 'Reativar'"
                      @click="emit('toggleAtivo', { id: supplier.id, ativo: !supplier.ativo })"
                    />
                  </UTooltip>
                </template>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
