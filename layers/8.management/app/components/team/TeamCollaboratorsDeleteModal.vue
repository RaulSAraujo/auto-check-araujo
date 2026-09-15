<script setup lang="ts">
import type { CollaboratorRow } from '#layers/auth/app/composables/useCollaborators'

defineOptions({ name: 'TeamCollaboratorsDeleteModal' })

const open = defineModel<boolean>('open', { required: true })

defineProps<{
  collaborator: CollaboratorRow | null
  loading?: boolean
}>()

defineEmits<{
  confirm: []
}>()
</script>

<template>
  <UModal
    v-model:open="open"
    title="Excluir colaborador?"
    :description="collaborator ? `O login de ${collaborator.nome} será removido permanentemente.` : ''"
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
