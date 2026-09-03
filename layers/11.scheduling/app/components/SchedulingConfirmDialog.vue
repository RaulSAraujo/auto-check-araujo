<script setup lang="ts">
defineOptions({ name: 'SchedulingConfirmDialog' })

const open = defineModel<boolean>('open', { required: true })

defineProps<{
  title: string
  description: string
  confirmLabel?: string
  confirmColor?: 'error' | 'primary' | 'neutral' | 'warning'
  loading?: boolean
}>()

const emit = defineEmits<{
  confirm: []
}>()
</script>

<template>
  <UModal
    v-model:open="open"
    :title="title"
    :description="description"
    :dismissible="!loading"
    :ui="{ footer: 'justify-end' }"
  >
    <template #footer="{ close }">
      <UButton
        color="neutral"
        variant="outline"
        label="Voltar"
        :disabled="loading"
        @click="close()"
      />
      <UButton
        :color="confirmColor || 'error'"
        :label="confirmLabel || 'Confirmar'"
        :loading="loading"
        @click="emit('confirm')"
      />
    </template>
  </UModal>
</template>
