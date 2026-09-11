<script setup lang="ts">
import type { ColaboradorPapel } from '~~/shared/types/oficina'
import { COLABORADOR_PAPEL_LABEL } from '~~/shared/types/oficina'
import type { CollaboratorRow } from '#layers/auth/app/composables/useCollaborators'

defineOptions({ name: 'TeamCollaboratorsTable' })

defineProps<{
  collaborators: CollaboratorRow[]
  currentUserId?: string
  updatingId?: string | null
}>()

const emit = defineEmits<{
  'update:papel': [payload: { id: string, papel: ColaboradorPapel }]
}>()

const papelItems = computed(() =>
  (Object.keys(COLABORADOR_PAPEL_LABEL) as ColaboradorPapel[]).map(value => ({
    label: COLABORADOR_PAPEL_LABEL[value],
    value
  }))
)

function onPapelChange(id: string, papel: ColaboradorPapel) {
  emit('update:papel', { id, papel })
}
</script>

<template>
  <div class="overflow-x-auto rounded-lg border border-default">
    <table class="w-full text-sm">
      <thead class="border-b border-default bg-elevated/50 text-left text-xs uppercase tracking-wide text-muted">
        <tr>
          <th class="px-3 py-2 font-medium">
            Nome
          </th>
          <th class="px-3 py-2 font-medium">
            Usuário
          </th>
          <th class="px-3 py-2 font-medium">
            Papel
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in collaborators"
          :key="row.id"
          class="border-b border-default last:border-0"
        >
          <td class="px-3 py-2">
            {{ row.nome }}
            <UBadge
              v-if="row.id === currentUserId"
              color="neutral"
              variant="subtle"
              size="xs"
              class="ml-2"
            >
              Você
            </UBadge>
          </td>
          <td class="px-3 py-2 text-muted font-mono text-xs">
            {{ row.username }}
          </td>
          <td class="px-3 py-2">
            <USelect
              :model-value="row.papel"
              :items="papelItems"
              value-key="value"
              :disabled="updatingId === row.id"
              class="min-w-36"
              @update:model-value="onPapelChange(row.id, $event as ColaboradorPapel)"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
