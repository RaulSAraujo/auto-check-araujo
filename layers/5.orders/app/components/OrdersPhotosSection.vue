<script setup lang="ts">
import {
  ORDER_PHOTOS_ACCEPT,
  ORDER_PHOTOS_MAX_COUNT
} from '../utils/order-photos'

defineOptions({ name: 'OrdersPhotosSection' })

const props = defineProps<{
  ordemId: string
  canEdit: boolean
}>()

const inputRef = ref<HTMLInputElement | null>(null)

const {
  photos,
  pending,
  uploading,
  deletingId,
  uploadFiles,
  removePhoto,
  updateCaption
} = useOrderPhotos(() => props.ordemId, {
  canEdit: () => props.canEdit
})

const canAdd = computed(() =>
  props.canEdit && photos.value.length < ORDER_PHOTOS_MAX_COUNT
)

function openPicker() {
  inputRef.value?.click()
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return
  await uploadFiles(input.files)
  input.value = ''
}

async function onCaptionBlur(photoId: string, event: FocusEvent) {
  const value = (event.target as HTMLInputElement | null)?.value ?? ''
  await updateCaption(photoId, value)
}
</script>

<template>
  <div
    class="space-y-3"
    aria-labelledby="os-fotos-heading"
  >
    <div class="flex items-center justify-between gap-3">
      <div class="min-w-0">
        <h3
          id="os-fotos-heading"
          class="flex items-center gap-2 text-sm font-semibold text-highlighted"
        >
          <UIcon
            name="i-lucide-camera"
            class="size-4 text-muted"
            aria-hidden="true"
          />
          Fotos
          <span class="text-xs font-normal text-muted">(evidência da OS)</span>
        </h3>
        <p class="mt-0.5 text-xs text-muted">
          Detalhes do diagnóstico — só uso interno.
        </p>
      </div>

      <UButton
        v-if="canAdd"
        label="Adicionar"
        icon="i-lucide-plus"
        size="sm"
        color="neutral"
        variant="soft"
        :loading="uploading"
        class="touch-manipulation"
        @click="openPicker"
      />
    </div>

    <input
      ref="inputRef"
      type="file"
      class="hidden"
      :accept="ORDER_PHOTOS_ACCEPT"
      capture="environment"
      multiple
      @change="onFileChange"
    >

    <div
      v-if="pending && !photos.length"
      class="grid grid-cols-2 gap-2 sm:grid-cols-3"
    >
      <USkeleton
        v-for="n in 3"
        :key="n"
        class="aspect-square rounded-lg"
      />
    </div>

    <BaseEmptyState
      v-else-if="!photos.length"
      icon="i-lucide-image"
      class="min-h-24 py-4"
    >
      Nenhuma foto ainda.
      <template
        v-if="canAdd"
        #actions
      >
        <UButton
          label="Tirar ou escolher foto"
          icon="i-lucide-camera"
          size="sm"
          :loading="uploading"
          @click="openPicker"
        />
      </template>
    </BaseEmptyState>

    <ul
      v-else
      class="grid grid-cols-2 gap-3 sm:grid-cols-3"
    >
      <li
        v-for="photo in photos"
        :key="photo.id"
        class="group relative overflow-hidden rounded-lg bg-elevated/40 ring-1 ring-default/60"
      >
        <div class="aspect-square bg-muted/40">
          <img
            v-if="photo.url"
            :src="photo.url"
            :alt="photo.legenda || photo.nome_arquivo || 'Foto da OS'"
            class="size-full object-cover"
            loading="lazy"
          >
          <div
            v-else
            class="flex size-full items-center justify-center text-muted"
          >
            <UIcon
              name="i-lucide-image-off"
              class="size-6"
            />
          </div>
        </div>

        <div class="space-y-1.5 p-2">
          <UInput
            v-if="canEdit"
            :model-value="photo.legenda || ''"
            size="xs"
            variant="subtle"
            placeholder="Legenda…"
            class="w-full"
            @blur="onCaptionBlur(photo.id, $event)"
          />
          <p
            v-else-if="photo.legenda"
            class="truncate text-xs text-muted"
          >
            {{ photo.legenda }}
          </p>
        </div>

        <UButton
          v-if="canEdit"
          icon="i-lucide-trash-2"
          color="error"
          variant="solid"
          size="xs"
          class="absolute right-1.5 top-1.5 opacity-90 shadow-sm"
          :loading="deletingId === photo.id"
          aria-label="Remover foto"
          @click="removePhoto(photo)"
        />
      </li>
    </ul>
  </div>
</template>
