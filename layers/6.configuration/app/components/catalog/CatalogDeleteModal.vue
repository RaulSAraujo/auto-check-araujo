<script setup lang="ts">
defineOptions({ name: 'CatalogDeleteModal' })

const open = defineModel<boolean>('open', { required: true })

withDefaults(defineProps<{
  loading?: boolean
  title?: string
  description?: string
}>(), {
  title: 'Excluir item?',
  description: 'Esta ação não pode ser desfeita. Só é permitido se o item não fizer parte de kits.'
})

defineEmits<{
  confirm: []
}>()
</script>

<template>
  <UModal
    v-model:open="open"
    :title="title"
    :description="description"
  >
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          label="Cancelar"
          color="neutral"
          variant="ghost"
          class="min-h-11 touch-manipulation"
          @click="open = false"
        />
        <UButton
          label="Excluir"
          color="error"
          :loading="loading"
          class="min-h-11 touch-manipulation"
          @click="$emit('confirm')"
        />
      </div>
    </template>
  </UModal>
</template>
