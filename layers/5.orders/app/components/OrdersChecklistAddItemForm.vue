<script setup lang="ts">
import {
  collectChecklistCategorias,
  isChecklistItemDraftValid,
  type ChecklistItemDraft
} from '../utils/checklist'
import type { ChecklistItem } from '~~/shared/types/database'

defineOptions({ name: 'OrdersChecklistAddItemForm' })

const props = defineProps<{
  items: ChecklistItem[]
  catalogCategorias?: string[]
  adding: boolean
}>()

const emit = defineEmits<{
  add: []
}>()

const draftModel = defineModel<ChecklistItemDraft>('draft', { required: true })

const categorias = computed(() => {
  const fromItems = collectChecklistCategorias(props.items)
  const fromCatalog = props.catalogCategorias || []
  return [...new Set([...fromItems, ...fromCatalog])]
})
</script>

<template>
  <div class="rounded-md border border-default p-4 space-y-3">
    <p class="text-sm font-medium text-highlighted">
      Adicionar item
    </p>

    <div class="grid gap-3 sm:grid-cols-2">
      <UFormField
        label="Categoria"
        required
      >
        <UInput
          v-model="draftModel.categoria"
          class="w-full"
          placeholder="Ex.: Exterior, Motor"
          list="checklist-categorias"
        />
        <datalist id="checklist-categorias">
          <option
            v-for="categoria in categorias"
            :key="categoria"
            :value="categoria"
          />
        </datalist>
      </UFormField>

      <UFormField
        label="Item"
        required
      >
        <UInput
          v-model="draftModel.label"
          class="w-full"
          placeholder="Ex.: Pneus e estepe"
        />
      </UFormField>
    </div>

    <UButton
      label="Adicionar item"
      icon="i-lucide-plus"
      :loading="adding"
      :disabled="!isChecklistItemDraftValid(draftModel)"
      @click="emit('add')"
    />
  </div>
</template>
