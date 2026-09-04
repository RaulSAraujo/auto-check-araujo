<script setup lang="ts">
defineOptions({ name: 'OrdersConfirmDialog' })

const open = defineModel<boolean>('open', { required: true })

const props = withDefaults(defineProps<{
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  confirmColor?: 'error' | 'primary' | 'neutral' | 'warning' | 'success'
  loading?: boolean
}>(), {
  confirmLabel: 'Confirmar',
  cancelLabel: 'Cancelar',
  confirmColor: 'error',
  loading: false
})

const emit = defineEmits<{
  confirm: []
}>()
</script>

<template>
  <UModal
    v-model:open="open"
    :title="props.title"
    :description="props.description"
    :dismissible="!props.loading"
    :ui="{ content: 'overscroll-contain', footer: 'justify-end' }"
  >
    <template #footer="{ close }">
      <UButton
        color="neutral"
        variant="outline"
        :label="props.cancelLabel"
        :disabled="props.loading"
        class="min-h-11 touch-manipulation"
        @click="close()"
      />
      <UButton
        :color="props.confirmColor"
        :label="props.confirmLabel"
        :loading="props.loading"
        class="min-h-11 touch-manipulation"
        @click="emit('confirm')"
      />
    </template>
  </UModal>
</template>
