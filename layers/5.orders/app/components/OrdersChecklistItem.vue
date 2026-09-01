<script setup lang="ts">
import type { ChecklistItem } from '~~/shared/types/database'
import type { ChecklistResultado } from '~~/shared/types/oficina'
import { checklistResultadoColor } from '../utils/checklist'
import { CHECKLIST_RESULTADO_SELECT_ITEMS } from '../utils/order-select-items'

defineProps<{
  item: ChecklistItem
  readOnly: boolean
}>()

const emit = defineEmits<{
  'save': [item: ChecklistItem]
  'update:resultado': [item: ChecklistItem, value: ChecklistResultado]
  'update:observacao': [item: ChecklistItem, value: string]
}>()
</script>

<template>
  <div class="rounded-lg border border-default p-3 space-y-3">
    <div class="flex flex-wrap items-start justify-between gap-2">
      <p class="font-medium text-highlighted">
        {{ item.label }}
      </p>
      <UBadge
        v-if="item.resultado"
        :color="checklistResultadoColor(item.resultado)"
        variant="subtle"
        size="sm"
      >
        {{ CHECKLIST_RESULTADO_LABEL[item.resultado as ChecklistResultado] || item.resultado }}
      </UBadge>
    </div>

    <div class="grid gap-3 sm:grid-cols-[12rem_1fr] items-start">
      <UFormField label="Resultado">
        <USelect
          :model-value="(item.resultado as ChecklistResultado | null) ?? undefined"
          :items="[...CHECKLIST_RESULTADO_SELECT_ITEMS]"
          :disabled="readOnly"
          class="w-full"
          @update:model-value="(v) => emit('update:resultado', item, v as ChecklistResultado)"
        />
      </UFormField>
      <UFormField label="Observação">
        <UInput
          :model-value="item.observacao ?? ''"
          class="w-full"
          :disabled="readOnly"
          placeholder="Opcional"
          @update:model-value="(v: string) => emit('update:observacao', item, v)"
          @blur="emit('save', item)"
        />
      </UFormField>
    </div>
  </div>
</template>
