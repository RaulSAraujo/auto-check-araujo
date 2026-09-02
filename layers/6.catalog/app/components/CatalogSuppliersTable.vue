<script setup lang="ts">
import type { Fornecedor } from '~~/shared/types/database'
import {
  emptySupplierDraft,
  isSupplierDraftValid,
  type SupplierDraft
} from '../utils/catalog'

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
  <div class="overflow-x-auto rounded-lg border border-default">
    <table class="w-full text-sm">
      <thead class="border-b border-default bg-elevated/50 text-left text-xs uppercase tracking-wide text-muted">
        <tr>
          <th class="px-3 py-2 font-medium">
            Nome
          </th>
          <th class="px-3 py-2 font-medium">
            Telefone
          </th>
          <th class="px-3 py-2 font-medium">
            E-mail
          </th>
          <th class="px-3 py-2 font-medium">
            Status
          </th>
          <th class="px-3 py-2 w-28" />
        </tr>
      </thead>
      <tbody class="divide-y divide-default">
        <tr
          v-for="supplier in suppliers"
          :key="supplier.id"
          :class="!supplier.ativo ? 'opacity-60' : ''"
        >
          <td class="px-3 py-2">
            <UInput
              v-if="editingId === supplier.id"
              v-model="editDraft.nome"
              size="sm"
              class="w-full min-w-40"
            />
            <div
              v-else
              class="space-y-1"
            >
              <span class="text-highlighted">{{ supplier.nome }}</span>
              <p
                v-if="supplier.observacoes"
                class="text-xs text-muted line-clamp-1"
              >
                {{ supplier.observacoes }}
              </p>
            </div>
          </td>
          <td class="px-3 py-2">
            <UInput
              v-if="editingId === supplier.id"
              v-model="editDraft.telefone"
              size="sm"
              class="w-full min-w-32"
            />
            <span
              v-else
              class="text-muted"
            >{{ supplier.telefone || '—' }}</span>
          </td>
          <td class="px-3 py-2">
            <UInput
              v-if="editingId === supplier.id"
              v-model="editDraft.email"
              size="sm"
              class="w-full min-w-40"
            />
            <span
              v-else
              class="text-muted"
            >{{ supplier.email || '—' }}</span>
          </td>
          <td class="px-3 py-2">
            <UBadge
              :color="supplier.ativo ? 'success' : 'neutral'"
              variant="subtle"
              size="sm"
            >
              {{ supplier.ativo ? 'Ativo' : 'Inativo' }}
            </UBadge>
          </td>
          <td class="px-3 py-2">
            <div class="flex justify-end gap-1">
              <template v-if="editingId === supplier.id">
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
                <UButton
                  icon="i-lucide-x"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  :disabled="savingId === supplier.id"
                  aria-label="Cancelar"
                  @click="cancelEdit"
                />
              </template>
              <template v-else>
                <UButton
                  icon="i-lucide-pencil"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  aria-label="Editar"
                  @click="startEdit(supplier)"
                />
                <UButton
                  :icon="supplier.ativo ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  :color="supplier.ativo ? 'warning' : 'success'"
                  variant="ghost"
                  size="xs"
                  :loading="togglingId === supplier.id"
                  :aria-label="supplier.ativo ? 'Desativar' : 'Reativar'"
                  @click="emit('toggleAtivo', { id: supplier.id, ativo: !supplier.ativo })"
                />
              </template>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
