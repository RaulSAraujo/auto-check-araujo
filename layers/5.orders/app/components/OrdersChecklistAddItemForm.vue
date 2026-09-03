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
  <div class="space-y-4">
    <UFormField
      label="Categoria"
      name="categoria"
      required
    >
      <UInput
        v-model="draftModel.categoria"
        class="w-full"
        placeholder="Ex.: Exterior…"
        list="checklist-categorias"
        autocomplete="off"
        name="categoria"
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
      name="item"
      required
    >
      <UInput
        v-model="draftModel.label"
        class="w-full"
        placeholder="Ex.: Pneus e estepe…"
        autocomplete="off"
        name="item"
      />
    </UFormField>

    <UButton
      label="Adicionar"
      icon="i-lucide-plus"
      block
      :loading="adding"
      :disabled="!isChecklistItemDraftValid(draftModel)"
      @click="emit('add')"
    />
  </div>
</template>
