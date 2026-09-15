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
  deletingId?: string | null
}>()

const emit = defineEmits<{
  'update:papel': [payload: { id: string, papel: ColaboradorPapel }]
  'reset-password': [row: CollaboratorRow]
  delete: [row: CollaboratorRow]
  'create': []
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
  <div class="space-y-2 md:hidden">
    <template v-if="loading"><USkeleton v-for="n in 3" :key="n" class="h-24 w-full rounded-xl" /></template>
    <template v-else-if="collaborators.length">
      <div v-for="collaborator in collaborators" :key="collaborator.id" class="rounded-xl bg-elevated/40 p-3 ring-1 ring-default/70">
        <div class="flex items-center gap-3"><UAvatar :text="initials(collaborator.nome)" size="md" :alt="collaborator.nome" /><div class="min-w-0 flex-1"><p class="truncate font-semibold text-highlighted">{{ collaborator.nome }}</p><p class="truncate font-mono text-xs text-muted">{{ collaborator.username }}</p></div><UBadge v-if="collaborator.id === currentUserId" color="neutral" variant="subtle" size="sm">Você</UBadge></div>
        <div class="mt-3 flex items-center gap-2"><USelect v-if="collaborator.id !== currentUserId" :model-value="collaborator.papel" :items="papelItems" value-key="value" :loading="updatingId === collaborator.id" class="min-w-0 flex-1" @update:model-value="onPapelChange(collaborator.id, $event as ColaboradorPapel)" /><UBadge v-else :color="PAPEL_COLOR[collaborator.papel]" variant="subtle">{{ COLABORADOR_PAPEL_LABEL[collaborator.papel] }}</UBadge><UButton icon="i-lucide-key-round" color="neutral" variant="ghost" square :aria-label="`Redefinir senha de ${collaborator.nome}`" @click="emit('reset-password', collaborator)" /><UButton v-if="collaborator.id !== currentUserId" icon="i-lucide-trash-2" color="error" variant="ghost" square :loading="deletingId === collaborator.id" :aria-label="`Excluir ${collaborator.nome}`" @click="emit('delete', collaborator)" /></div>
      </div>
    </template>
    <BaseEmptyState v-else icon="i-lucide-users">Nenhum colaborador ainda.</BaseEmptyState>
  </div>
  <UTable
    :data="collaborators"
    :columns="columns"
    :loading="loading"
    class="hidden w-full md:block"
    :ui="{
      root: 'rounded-none border-0 bg-transparent shadow-none',
      base: 'rounded-none bg-transparent'
    }"
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
        <UButton
          v-if="row.original.id !== currentUserId"
          icon="i-lucide-trash-2"
          color="error"
          variant="ghost"
          size="sm"
          :loading="deletingId === row.original.id"
          :aria-label="`Excluir ${row.original.nome}`"
          @click.stop="emit('delete', row.original)"
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
