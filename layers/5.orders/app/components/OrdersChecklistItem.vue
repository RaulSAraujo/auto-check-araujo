<script setup lang="ts">
import type { ChecklistPhotoWithUrl } from '../composables/useChecklistPhotos'
import type { ChecklistItem } from '~~/shared/types/database'
import type { ChecklistResultado } from '~~/shared/types/oficina'
import { CHECKLIST_RESULTADO_LABEL } from '~~/shared/types/oficina'
import {
  CHECKLIST_RESULTADO_OPTIONS,
  confirmClearChecklistEvidence,
  hasChecklistItemEvidence,
  needsChecklistObservacao
} from '../utils/checklist'

defineOptions({ name: 'OrdersChecklistItem' })

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
  'update:resultado': [item: ChecklistItem, value: ChecklistResultado, clearDetails?: boolean]
  'update:observacao': [item: ChecklistItem, value: string]
  'uploadPhoto': [itemId: string, file: File]
  'deletePhoto': [photo: ChecklistPhotoWithUrl]
  'delete': [itemId: string]
}>()

const selected = ref<string | null>(props.item.resultado)
const detailsOpen = ref(false)
const observacaoDraft = ref(props.item.observacao ?? '')

watch(() => props.item.resultado, (value) => {
  selected.value = value
})

watch(() => props.item.observacao, (value) => {
  if (!detailsOpen.value) {
    observacaoDraft.value = value ?? ''
  }
})

watch(detailsOpen, (open) => {
  if (open) {
    observacaoDraft.value = props.item.observacao ?? ''
  }
})

const needsDetails = computed(() => needsChecklistObservacao(selected.value))

const hasDetailsContent = computed(() =>
  hasChecklistItemEvidence(props.item.observacao, props.photos.length)
)

const showDetailsAction = computed(() => {
  if (props.readOnly) return hasDetailsContent.value
  return needsDetails.value
})

const detailsSummary = computed(() => {
  const parts: string[] = []
  if (props.item.observacao?.trim()) parts.push('Obs.')
  if (props.photos.length > 0) {
    parts.push(`${props.photos.length} foto${props.photos.length === 1 ? '' : 's'}`)
  }
  return parts.join(' · ')
})

function flushObservacao() {
  if (props.readOnly) return false
  const next = observacaoDraft.value
  const current = props.item.observacao ?? ''
  if (next === current) return false
  // Emite texto atual; o pai atualiza a lista de forma imutável
  emit('update:observacao', props.item, next)
  emit('save', {
    ...props.item,
    observacao: next.trim() || null
  })
  return true
}

function selectResultado(value: ChecklistResultado) {
  if (value === selected.value) return

  const leavingProblem = needsChecklistObservacao(selected.value)
    && !needsChecklistObservacao(value)
  const wasNeedsDetails = needsChecklistObservacao(selected.value)
  const shouldClearDetails = leavingProblem && hasDetailsContent.value

  if (shouldClearDetails && !confirmClearChecklistEvidence({
    hasObservacao: Boolean(props.item.observacao?.trim()),
    photoCount: props.photos.length
  })) {
    return
  }

  selected.value = value
  emit('update:resultado', props.item, value, shouldClearDetails)

  if (!props.readOnly && needsChecklistObservacao(value) && !wasNeedsDetails) {
    detailsOpen.value = true
  }

  if (shouldClearDetails) {
    observacaoDraft.value = ''
    detailsOpen.value = false
  }
}

function openDetails() {
  detailsOpen.value = true
}

function onDetailsOpenUpdate(open: boolean) {
  if (!open && detailsOpen.value) {
    flushObservacao()
  }
  detailsOpen.value = open
}

function closeDetails() {
  flushObservacao()
  detailsOpen.value = false
}

function onDelete() {
  if (!window.confirm('Remover este item do checklist?')) return
  emit('delete', props.item.id)
}
</script>

<template>
  <div
    class="grid grid-cols-[minmax(0,1fr)_2rem_auto_2rem] items-center gap-x-1.5 py-2.5"
    :data-checklist-pending="!selected ? '' : undefined"
  >
    <p class="min-w-0 truncate text-sm font-medium text-highlighted">
      {{ item.label }}
    </p>

    <div class="relative flex size-8 items-center justify-center">
      <UButton
        v-if="showDetailsAction"
        icon="i-lucide-message-square-text"
        :color="needsDetails && !hasDetailsContent ? 'warning' : 'neutral'"
        :variant="hasDetailsContent ? 'soft' : 'ghost'"
        size="sm"
        square
        :aria-label="hasDetailsContent
          ? `Detalhes: ${detailsSummary || 'abrir'}`
          : (readOnly ? 'Ver detalhes' : 'Adicionar detalhes')"
        @click="openDetails"
      />
      <span
        v-if="showDetailsAction && photos.length > 0"
        class="pointer-events-none absolute -end-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium leading-none text-inverted"
        aria-hidden="true"
      >
        {{ photos.length }}
      </span>
    </div>

    <div class="justify-self-end">
      <UBadge
        v-if="readOnly && selected"
        :color="CHECKLIST_RESULTADO_OPTIONS.find(o => o.value === selected)?.color ?? 'neutral'"
        variant="subtle"
        size="sm"
      >
        {{ CHECKLIST_RESULTADO_LABEL[selected as ChecklistResultado] || selected }}
      </UBadge>

      <div
        v-else-if="!readOnly"
        class="inline-flex rounded-lg bg-elevated p-0.5"
        role="group"
        :aria-label="`Resultado de ${item.label}`"
      >
        <UButton
          v-for="option in CHECKLIST_RESULTADO_OPTIONS"
          :key="option.value"
          :label="option.shortLabel"
          :color="selected === option.value ? option.color : 'neutral'"
          :variant="selected === option.value ? 'solid' : 'ghost'"
          size="sm"
          class="min-w-11 justify-center px-2.5"
          :aria-pressed="selected === option.value"
          :aria-label="option.label"
          @click="selectResultado(option.value)"
        />
      </div>
    </div>

    <div class="flex size-8 items-center justify-center">
      <UButton
        v-if="!readOnly"
        icon="i-lucide-trash-2"
        color="error"
        variant="ghost"
        size="sm"
        square
        :loading="deletingItemId === item.id"
        aria-label="Remover item"
        @click="onDelete"
      />
    </div>

    <UModal
      :open="detailsOpen"
      :title="item.label"
      :description="readOnly ? 'Detalhes do problema' : 'Descreva o problema e anexe fotos'"
      :ui="{ width: 'sm:max-w-md' }"
      @update:open="onDetailsOpenUpdate"
    >
      <template #body>
        <div class="space-y-4">
          <UFormField
            v-if="!readOnly || item.observacao"
            label="Problema"
            name="observacao"
          >
            <UTextarea
              v-model="observacaoDraft"
              class="w-full"
              :disabled="readOnly"
              :rows="3"
              autoresize
              placeholder="Descreva o problema…"
              autocomplete="off"
              name="observacao"
              aria-label="Descrição do problema"
            />
          </UFormField>

          <UFormField
            v-if="!readOnly || photos.length > 0"
            label="Fotos"
            name="fotos"
          >
            <OrdersChecklistPhotoUpload
              :photos="photos"
              :read-only="readOnly"
              :uploading="uploadingPhotos"
              :deleting-photo-id="deletingPhotoId"
              @upload="emit('uploadPhoto', item.id, $event)"
              @delete="emit('deletePhoto', $event)"
            />
          </UFormField>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end">
          <UButton
            :label="readOnly ? 'Fechar' : 'Pronto'"
            color="primary"
            @click="closeDetails"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
