<script setup lang="ts">
import {
  collectChecklistCategorias,
  isChecklistItemDraftValid,
  type ChecklistItemDraft
} from '../utils/checklist'
import type { ChecklistTemplateItem } from '~~/shared/types/database'

defineOptions({ name: 'OrdersChecklistCatalogForm' })

const props = defineProps<{
  items: ChecklistTemplateItem[]
  adding: boolean
}>()

const emit = defineEmits<{
  add: []
}>()

const draftModel = defineModel<ChecklistItemDraft>('draft', { required: true })

const categorias = computed(() => collectChecklistCategorias(props.items))
</script>

<template>
  <BasePanel title="Adicionar ao catálogo">
    <div class="space-y-3">
      <UFormField
        label="Categoria"
        required
      >
        <UInput
          v-model="draftModel.categoria"
          class="w-full"
          placeholder="Ex.: Exterior, Motor"
          list="checklist-catalog-categorias"
        />
        <datalist id="checklist-catalog-categorias">
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

      <UButton
        label="Adicionar"
        icon="i-lucide-plus"
        :loading="adding"
        :disabled="!isChecklistItemDraftValid(draftModel)"
        @click="emit('add')"
      />
    </div>
  </BasePanel>
</template>
