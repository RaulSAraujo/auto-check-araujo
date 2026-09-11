<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { ColaboradorPapel } from '~~/shared/types/oficina'
import { COLABORADOR_PAPEL_LABEL } from '~~/shared/types/oficina'
import type { CollaboratorRow } from '#layers/auth/app/composables/useCollaborators'

defineOptions({ name: 'TeamCollaboratorsTable' })

const props = defineProps<{
  collaborators: CollaboratorRow[]
  loading?: boolean
  currentUserId?: string
  updatingId?: string | null
}>()

const emit = defineEmits<{
  'update:papel': [payload: { id: string, papel: ColaboradorPapel }]
  'reset-password': [row: CollaboratorRow]
  create: []
}>()

const PAPEL_COLOR: Record<ColaboradorPapel, 'primary' | 'warning' | 'neutral'> = {
  gerente: 'primary',
  mecanico: 'warning',
  recepcao: 'neutral'
}

const columns: TableColumn<CollaboratorRow>[] = [
  { accessorKey: 'nome', header: 'Nome' },
  { accessorKey: 'username', header: 'Usuário' },
  { id: 'papel', header: 'Papel' },
  { id: 'actions', header: '' }
]

const papelItems = computed(() =>
  (Object.keys(COLABORADOR_PAPEL_LABEL) as ColaboradorPapel[]).map(value => ({
    label: COLABORADOR_PAPEL_LABEL[value],
    value
  }))
)

function initials(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase()
}

function onPapelChange(id: string, papel: ColaboradorPapel) {
  if (id === props.currentUserId) return
  emit('update:papel', { id, papel })
}
</script>

<template>
  <UTable
    :data="collaborators"
    :columns="columns"
    :loading="loading"
    class="w-full"
  >
    <template #nome-cell="{ row }">
      <div class="flex items-center gap-3 min-w-0">
        <UAvatar
          :text="initials(row.original.nome)"
          size="sm"
          :alt="row.original.nome"
        />
        <div class="min-w-0">
          <p class="truncate font-medium text-highlighted">
            {{ row.original.nome }}
            <UBadge
              v-if="row.original.id === currentUserId"
              color="neutral"
              variant="subtle"
              size="xs"
              class="ml-1.5 align-middle"
            >
              Você
            </UBadge>
          </p>
        </div>
      </div>
    </template>

    <template #username-cell="{ row }">
      <span class="font-mono text-xs text-muted tabular-nums">
        {{ row.original.username }}
      </span>
    </template>

    <template #papel-cell="{ row }">
      <div class="flex items-center gap-2">
        <USelect
          v-if="row.original.id !== currentUserId"
          :model-value="row.original.papel"
          :items="papelItems"
          value-key="value"
          :loading="updatingId === row.original.id"
          :disabled="updatingId === row.original.id"
          class="min-w-40"
          :aria-label="`Papel de ${row.original.nome}`"
          @update:model-value="onPapelChange(row.original.id, $event as ColaboradorPapel)"
        />
        <UBadge
          v-else
          :color="PAPEL_COLOR[row.original.papel]"
          variant="subtle"
        >
          {{ COLABORADOR_PAPEL_LABEL[row.original.papel] }}
        </UBadge>
      </div>
    </template>

    <template #actions-cell="{ row }">
      <div class="flex justify-end">
        <UButton
          icon="i-lucide-key-round"
          color="neutral"
          variant="ghost"
          size="sm"
          :aria-label="`Redefinir senha de ${row.original.nome}`"
          @click.stop="emit('reset-password', row.original)"
        />
      </div>
    </template>

    <template #empty>
      <BaseEmptyState icon="i-lucide-users">
        Nenhum colaborador ainda.
        <template #actions>
          <UButton
            label="Novo colaborador"
            icon="i-lucide-user-plus"
            size="sm"
            @click="emit('create')"
          />
        </template>
      </BaseEmptyState>
    </template>
  </UTable>
</template>
