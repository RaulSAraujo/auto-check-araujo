<script setup lang="ts">
import type { ChecklistTemplateItem } from '~~/shared/types/database'
import type { ChecklistItemDraft } from '../utils/checklist'

defineOptions({ name: 'OrdersChecklistCatalogTable' })

const props = defineProps<{
  items: ChecklistTemplateItem[]
  savingId: string | null
  togglingId: string | null
}>()

const emit = defineEmits<{
  save: [payload: { id: string, categoria: string, label: string }]
  toggleAtivo: [payload: { id: string, ativo: boolean }]
}>()

const editingId = ref<string | null>(null)
const editDraft = reactive<ChecklistItemDraft>({
  categoria: '',
  label: ''
})

function startEdit(item: ChecklistTemplateItem) {
  editingId.value = item.id
  editDraft.categoria = item.categoria
  editDraft.label = item.label
}

function cancelEdit() {
  editingId.value = null
}

function saveEdit(id: string) {
  if (!editDraft.categoria.trim() || !editDraft.label.trim()) return
  emit('save', {
    id,
    categoria: editDraft.categoria,
    label: editDraft.label
  })
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
            Categoria
          </th>
          <th class="px-3 py-2 font-medium">
            Item
          </th>
          <th class="px-3 py-2 font-medium">
            Status
          </th>
          <th class="px-3 py-2 w-28" />
        </tr>
      </thead>
      <tbody class="divide-y divide-default">
        <tr
          v-for="item in items"
          :key="item.id"
          :class="!item.ativo ? 'opacity-60' : ''"
        >
          <td class="px-3 py-2">
            <UInput
              v-if="editingId === item.id"
              v-model="editDraft.categoria"
              size="sm"
              class="w-full min-w-32"
            />
            <span
              v-else
              class="text-muted"
            >{{ item.categoria }}</span>
          </td>
          <td class="px-3 py-2">
            <UInput
              v-if="editingId === item.id"
              v-model="editDraft.label"
              size="sm"
              class="w-full min-w-40"
            />
            <span
              v-else
              class="text-highlighted"
            >{{ item.label }}</span>
          </td>
          <td class="px-3 py-2">
            <UBadge
              :color="item.ativo ? 'success' : 'neutral'"
              variant="subtle"
              size="sm"
            >
              {{ item.ativo ? 'Ativo' : 'Inativo' }}
            </UBadge>
          </td>
          <td class="px-3 py-2">
            <div class="flex justify-end gap-1">
              <template v-if="editingId === item.id">
                <UButton
                  icon="i-lucide-check"
                  color="success"
                  variant="ghost"
                  size="xs"
                  :loading="savingId === item.id"
                  aria-label="Salvar"
                  @click="saveEdit(item.id)"
                />
                <UButton
                  icon="i-lucide-x"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  :disabled="savingId === item.id"
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
                  @click="startEdit(item)"
                />
                <UButton
                  :icon="item.ativo ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  :color="item.ativo ? 'warning' : 'success'"
                  variant="ghost"
                  size="xs"
                  :loading="togglingId === item.id"
                  :aria-label="item.ativo ? 'Desativar' : 'Reativar'"
                  @click="emit('toggleAtivo', { id: item.id, ativo: !item.ativo })"
                />
              </template>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
