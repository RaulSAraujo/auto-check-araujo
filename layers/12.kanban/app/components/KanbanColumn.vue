<script setup lang="ts">
import type { KanbanOrderCard } from '../composables/useKanbanBoard'
import type { KanbanColumnId } from '../utils/kanban'

defineOptions({ name: 'KanbanColumn' })

defineProps<{
  columnId: KanbanColumnId
  label: string
  items: KanbanOrderCard[]
  overdueCount: number
  pending?: boolean
}>()
</script>

<template>
  <section
    class="flex min-h-0 min-w-[16.5rem] flex-1 flex-col rounded-lg border border-default bg-elevated/30"
    :aria-labelledby="`kanban-col-${columnId}`"
  >
    <header class="flex items-center justify-between gap-2 border-b border-default px-3 py-2.5">
      <div class="min-w-0">
        <h2
          :id="`kanban-col-${columnId}`"
          class="text-xs font-semibold uppercase tracking-wide text-muted"
        >
          {{ label }}
        </h2>
      </div>
      <div class="flex shrink-0 items-center gap-1.5">
        <UBadge
          v-if="overdueCount > 0"
          color="error"
          variant="subtle"
          size="sm"
          class="font-mono tabular-nums"
        >
          {{ overdueCount }} atraso
        </UBadge>
        <span class="font-mono text-sm font-semibold tabular-nums text-highlighted">
          <USkeleton
            v-if="pending"
            class="inline-block h-4 w-6"
          />
          <template v-else>
            {{ items.length }}
          </template>
        </span>
      </div>
    </header>

    <div class="flex flex-1 flex-col gap-2 overflow-y-auto p-2 sm:p-2.5">
      <template v-if="pending">
        <USkeleton
          v-for="n in 3"
          :key="n"
          class="h-28 w-full rounded-lg"
        />
      </template>

      <template v-else-if="items.length">
        <KanbanCard
          v-for="order in items"
          :key="order.id"
          :order="order"
        />
      </template>

      <p
        v-else
        class="px-2 py-6 text-center text-sm text-muted"
      >
        Nenhuma OS
      </p>
    </div>
  </section>
</template>
