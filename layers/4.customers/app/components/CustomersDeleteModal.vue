<script setup lang="ts">
defineOptions({ name: 'CustomersDeleteModal' })

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
    title="Excluir cliente?"
    description="Esta ação não pode ser desfeita. Só é permitido se o cliente não tiver veículos."
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
