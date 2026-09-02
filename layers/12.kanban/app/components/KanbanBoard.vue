<script setup lang="ts">
import type { KanbanOrderCard } from '../composables/useKanbanBoard'
import type { KanbanColumnId } from '../utils/kanban'

defineOptions({ name: 'KanbanBoard' })

defineProps<{
  columns: Array<{
    id: KanbanColumnId
    label: string
    items: KanbanOrderCard[]
    overdueCount: number
  }>
  pending?: boolean
  overdueTotal?: number
}>()
</script>

<template>
  <div class="space-y-3">
    <div
      v-if="(overdueTotal ?? 0) > 0"
      class="flex items-center gap-2 text-sm text-muted"
      role="status"
    >
      <UIcon
        name="i-lucide-triangle-alert"
        class="size-4 text-warning"
        aria-hidden="true"
      />
      <span>
        <span class="font-mono font-semibold tabular-nums text-highlighted">{{ overdueTotal }}</span>
        alerta{{ overdueTotal === 1 ? '' : 's' }} de atraso no board
      </span>
    </div>

    <div
      class="flex gap-3 overflow-x-auto pb-1"
      role="list"
      aria-label="Quadro Kanban de ordens de serviço"
    >
      <KanbanColumn
        v-for="column in columns"
        :key="column.id"
        role="listitem"
        :column-id="column.id"
        :label="column.label"
        :items="column.items"
        :overdue-count="column.overdueCount"
        :pending="pending"
        class="max-h-[calc(100dvh-14rem)]"
      />
    </div>
  </div>
</template>
