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
  <div class="flex flex-wrap items-center gap-2">
    <div
      v-for="photo in photos"
      :key="photo.id"
      class="relative size-12 overflow-hidden rounded-md bg-default ring-1 ring-default"
    >
      <img
        :src="photo.url"
        :alt="photo.nome_arquivo || 'Foto do checklist'"
        width="48"
        height="48"
        loading="lazy"
        class="size-full object-cover"
      >

      <button
        v-if="!readOnly"
        type="button"
        class="absolute end-0.5 top-0.5 flex size-5 items-center justify-center rounded-full bg-error text-inverted shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        :aria-label="deletingPhotoId === photo.id ? 'Removendo…' : 'Remover foto'"
        :disabled="deletingPhotoId === photo.id"
        @click="emit('delete', photo)"
      >
        <UIcon
          name="i-lucide-x"
          class="size-3"
          aria-hidden="true"
        />
      </button>
    </div>

    <UButton
      v-if="canAdd"
      label="Foto"
      icon="i-lucide-camera"
      color="neutral"
      variant="soft"
      size="sm"
      :loading="uploading"
      :aria-label="uploading ? 'Enviando…' : 'Adicionar foto'"
      @click="openFilePicker"
    />

    <input
      ref="inputRef"
      type="file"
      class="hidden"
      :accept="CHECKLIST_PHOTOS_ACCEPT"
      @change="onFileChange"
    >
  </div>
</template>
