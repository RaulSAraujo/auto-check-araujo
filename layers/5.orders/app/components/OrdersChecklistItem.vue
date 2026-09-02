<script setup lang="ts">
import type { ChecklistPhotoWithUrl } from '../composables/useChecklistPhotos'
import type { ChecklistItem } from '~~/shared/types/database'
import type { ChecklistResultado } from '~~/shared/types/oficina'
import {
  CHECKLIST_RESULTADO_OPTIONS,
  needsChecklistObservacao
} from '../utils/checklist'

const props = defineProps<{
  item: ChecklistItem
  readOnly: boolean
  photos: ChecklistPhotoWithUrl[]
  uploadingPhotos: boolean
  deletingPhotoId: string | null
  deletingItemId: string | null
}>()

const emit = defineEmits<{
  'save': [item: ChecklistItem]
  'update:resultado': [item: ChecklistItem, value: ChecklistResultado]
  'update:observacao': [item: ChecklistItem, value: string]
  'uploadPhoto': [itemId: string, file: File]
  'deletePhoto': [photo: ChecklistPhotoWithUrl]
  'delete': [itemId: string]
}>()

const showObservacao = computed(() => {
  if (props.readOnly) return Boolean(props.item.observacao)
  return needsChecklistObservacao(props.item.resultado) || Boolean(props.item.observacao)
})

const showPhotos = computed(() => {
  if (props.readOnly) return props.photos.length > 0
  return true
})
</script>

<template>
  <div
    class="space-y-2 py-3"
    :class="!item.resultado ? 'bg-warning/5 -mx-1 px-1 rounded-sm' : ''"
    :data-checklist-pending="!item.resultado ? '' : undefined"
  >
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p class="text-sm font-medium text-highlighted sm:min-w-0 sm:flex-1">
        {{ item.label }}
      </p>

      <div class="flex shrink-0 items-center gap-1">
        <div
          v-if="readOnly"
          class="shrink-0"
        >
          <UBadge
            v-if="item.resultado"
            :color="CHECKLIST_RESULTADO_OPTIONS.find(o => o.value === item.resultado)?.color ?? 'neutral'"
            variant="subtle"
            size="sm"
          >
            {{ CHECKLIST_RESULTADO_LABEL[item.resultado as ChecklistResultado] || item.resultado }}
          </UBadge>
        </div>

        <template v-else>
          <UButton
            v-for="option in CHECKLIST_RESULTADO_OPTIONS"
            :key="option.value"
            :label="option.shortLabel"
            :color="option.color"
            :variant="item.resultado === option.value ? 'solid' : 'outline'"
            size="sm"
            class="min-w-11 justify-center"
            :aria-label="option.label"
            @click="emit('update:resultado', item, option.value)"
          />
          <UButton
            icon="i-lucide-trash"
            color="error"
            variant="ghost"
            size="sm"
            :loading="deletingItemId === item.id"
            aria-label="Remover item"
            @click="emit('delete', item.id)"
          />
        </template>
      </div>
    </div>

    <UInput
      v-if="showObservacao"
      :model-value="item.observacao ?? ''"
      class="w-full"
      :disabled="readOnly"
      :placeholder="needsChecklistObservacao(item.resultado) ? 'Descreva o problema' : 'Observação opcional'"
      size="sm"
      @update:model-value="(v: string) => emit('update:observacao', item, v)"
      @blur="emit('save', item)"
    />

    <OrdersChecklistPhotoUpload
      v-if="showPhotos"
      :photos="photos"
      :read-only="readOnly"
      :uploading="uploadingPhotos"
      :deleting-photo-id="deletingPhotoId"
      @upload="emit('uploadPhoto', item.id, $event)"
      @delete="emit('deletePhoto', $event)"
    />
  </div>
</template>
