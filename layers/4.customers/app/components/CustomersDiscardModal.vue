<script setup lang="ts">
defineOptions({ name: 'CustomersDiscardModal' })

const open = defineModel<boolean>('open', { required: true })

const {
  title = 'Descartar alterações?',
  description = 'O que você digitou não será salvo.'
} = defineProps<{
  title?: string
  description?: string
}>()

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
          label="Continuar editando"
          color="neutral"
          variant="ghost"
          class="min-h-11 touch-manipulation"
          @click="open = false"
        />
        <UButton
          label="Descartar"
          color="error"
          class="min-h-11 touch-manipulation"
          @click="$emit('confirm')"
        />
      </div>
    </template>
  </UModal>
</template>
