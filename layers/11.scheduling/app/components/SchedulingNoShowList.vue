<script setup lang="ts">
import type { SchedulingAppointment } from '../composables/useSchedulingBoard'
import { formatTimeShort } from '../utils/scheduling'

defineOptions({ name: 'SchedulingNoShowList' })

defineProps<{
  items: SchedulingAppointment[]
  pending?: boolean
  canWrite?: boolean
  markingId?: string | null
}>()

const emit = defineEmits<{
  handle: [id: string]
  edit: [appointment: SchedulingAppointment]
}>()

function relativeLabel(inicio: string): string {
  const date = new Date(inicio)
  const today = new Date()
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const startDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((startToday.getTime() - startDay.getTime()) / 86_400_000)
  const time = formatTimeShort(inicio)

  if (diffDays === 0) return `Hoje, ${time}`
  if (diffDays === 1) return `Ontem, ${time}`
  return `${new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date)}, ${time}`
}
</script>

<template>
  <section
    v-if="pending || items.length"
    class="rounded-lg border border-default bg-default p-4 shadow-sm dark:shadow-none"
    aria-label="Não comparecimento"
  >
    <div class="mb-3 flex items-baseline justify-between gap-2">
      <h2 class="text-xs font-semibold uppercase tracking-widest text-muted">
        Faltas
      </h2>
      <span
        v-if="items.length"
        class="font-mono text-xs tabular-nums text-error"
      >
        {{ items.length }}
      </span>
    </div>

    <div
      v-if="pending"
      class="space-y-2"
      role="status"
      aria-live="polite"
      aria-label="Carregando faltas…"
    >
      <USkeleton class="h-12 w-full" />
    </div>

    <ul
      v-else
      class="divide-y divide-default"
    >
      <li
        v-for="item in items"
        :key="item.id"
        class="flex items-center gap-2 py-2 first:pt-0 last:pb-0"
      >
        <button
          type="button"
          class="min-h-11 min-w-0 flex-1 rounded-md py-1 text-left hover:bg-elevated/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          :disabled="!canWrite"
          :class="canWrite ? 'cursor-pointer' : 'cursor-default'"
          @click="canWrite && emit('edit', item)"
        >
          <p class="truncate text-sm font-medium text-highlighted">
            {{ item.clientes?.nome?.trim() || EMPTY_VALUE }}
          </p>
          <p class="truncate text-xs text-muted">
            <span
              v-if="item.veiculos"
              class="font-mono tabular-nums"
            >{{ formatPlaca(item.veiculos.placa) }}</span>
            <span> · {{ relativeLabel(item.inicio) }}</span>
          </p>
        </button>
        <UButton
          v-if="canWrite"
          size="xs"
          color="neutral"
          variant="ghost"
          icon="i-lucide-check"
          square
          :loading="markingId === item.id"
          :disabled="markingId === item.id"
          :aria-label="`Marcar como tratado: ${item.clientes?.nome || 'agendamento'}`"
          @click="emit('handle', item.id)"
        />
      </li>
    </ul>
  </section>
</template>
