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
  <UModal v-model:open="open">
    <template #content>
      <UCard>
        <template #header>
          <h3 class="font-semibold text-highlighted">
            Excluir Veículo?
          </h3>
        </template>
        <p class="text-sm text-muted">
          Esta ação não pode ser desfeita. Não é possível excluir se houver OS vinculadas.
        </p>
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
      </UCard>
    </template>
  </UModal>
</template>
