<script setup lang="ts">
defineOptions({ name: 'VehiclesDeleteModal' })

const open = defineModel<boolean>('open', { required: true })

defineProps<{
  loading?: boolean
}>()

defineEmits<{
  confirm: []
}>()
</script>

<template>
  <UModal
    v-model:open="open"
    title="Excluir veículo?"
    description="Esta ação não pode ser desfeita. Não é possível excluir se houver OS vinculadas."
  >
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          label="Cancelar"
          color="neutral"
          variant="ghost"
          @click="open = false"
        />
        <UButton
          label="Excluir"
          color="error"
          :loading="loading"
          @click="$emit('confirm')"
        />
      </div>
    </template>
  </UModal>
</template>
