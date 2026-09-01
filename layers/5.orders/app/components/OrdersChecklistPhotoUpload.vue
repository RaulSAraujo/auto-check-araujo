<script setup lang="ts">
import type { ChecklistPhotoWithUrl } from '../composables/useChecklistPhotos'
import { CHECKLIST_PHOTOS_ACCEPT, CHECKLIST_PHOTOS_MAX_PER_ITEM } from '../utils/checklist-photos'

defineOptions({ name: 'OrdersChecklistPhotoUpload' })

const props = defineProps<{
  photos: ChecklistPhotoWithUrl[]
  readOnly: boolean
  uploading: boolean
  deletingPhotoId: string | null
}>()

const emit = defineEmits<{
  upload: [file: File]
  delete: [photo: ChecklistPhotoWithUrl]
}>()

const inputRef = ref<HTMLInputElement | null>(null)

const canAdd = computed(() => {
  return !props.readOnly && props.photos.length < CHECKLIST_PHOTOS_MAX_PER_ITEM
})

const showSection = computed(() => {
  return props.readOnly ? props.photos.length > 0 : true
})

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  emit('upload', file)
  input.value = ''
}

function openFilePicker() {
  inputRef.value?.click()
}
</script>

<template>
  <div
    v-if="showSection"
    class="space-y-2"
  >
    <div class="flex items-center justify-between gap-2">
      <p class="text-xs font-medium text-muted">
        Fotos
        <span v-if="!readOnly">
          ({{ photos.length }}/{{ CHECKLIST_PHOTOS_MAX_PER_ITEM }})
        </span>
      </p>

      <UButton
        v-if="canAdd"
        label="Adicionar foto"
        icon="i-lucide-camera"
        color="neutral"
        variant="soft"
        size="xs"
        :loading="uploading"
        @click="openFilePicker"
      />
    </div>

    <input
      ref="inputRef"
      type="file"
      class="hidden"
      :accept="CHECKLIST_PHOTOS_ACCEPT"
      @change="onFileChange"
    >

    <div
      v-if="photos.length > 0"
      class="flex flex-wrap gap-2"
    >
      <div
        v-for="photo in photos"
        :key="photo.id"
        class="relative h-20 w-20 overflow-hidden rounded-md border border-default bg-elevated"
      >
        <img
          :src="photo.url"
          :alt="photo.nome_arquivo || 'Foto do checklist'"
          class="h-full w-full object-cover"
        >

        <UButton
          v-if="!readOnly"
          icon="i-lucide-x"
          color="error"
          variant="solid"
          size="xs"
          class="absolute top-1 right-1"
          :loading="deletingPhotoId === photo.id"
          aria-label="Remover foto"
          @click="emit('delete', photo)"
        />
      </div>
    </div>

    <p
      v-else-if="!readOnly"
      class="text-xs text-muted"
    >
      Anexe fotos como evidência de avarias (JPEG, PNG ou WebP, até 5 MB).
    </p>
  </div>
</template>
