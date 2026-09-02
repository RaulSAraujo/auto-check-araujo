<script setup lang="ts">
import type { SchedulingAppointment } from '../composables/useSchedulingBoard'
import { formatTimeShort } from '../utils/scheduling'

defineOptions({ name: 'SchedulingNoShowList' })

defineProps<{
  items: SchedulingAppointment[]
  pending?: boolean
  canWrite?: boolean
}>()

const emit = defineEmits<{
  handle: [id: string]
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
  <BasePanel>
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <h2 class="font-semibold text-highlighted">
          Não comparecimento
        </h2>
        <UBadge
          v-if="items.length"
          color="error"
          variant="subtle"
          class="font-mono tabular-nums"
        >
          {{ items.length }}
        </UBadge>
      </div>
    </template>

    <div
      v-if="pending"
      class="space-y-2"
    >
      <USkeleton class="h-14 w-full" />
      <USkeleton class="h-14 w-full" />
    </div>

    <p
      v-else-if="!items.length"
      class="text-sm text-muted"
    >
      Nenhum não comparecimento recente.
    </p>

    <ul
      v-else
      class="divide-y divide-default"
      aria-label="Lista de não comparecimentos"
    >
      <li
        v-for="item in items"
        :key="item.id"
        class="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
      >
        <div class="min-w-0">
          <p class="truncate text-sm font-medium text-highlighted">
            {{ item.clientes?.nome?.trim() || EMPTY_VALUE }}
          </p>
          <p class="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
            <span
              v-if="item.veiculos"
              class="font-mono tabular-nums"
            >{{ formatPlaca(item.veiculos.placa) }}</span>
            <span>{{ relativeLabel(item.inicio) }}</span>
          </p>
        </div>
        <UButton
          v-if="canWrite"
          size="xs"
          color="neutral"
          variant="outline"
          label="Marcar"
          :aria-label="`Marcar tratado: ${item.clientes?.nome || 'agendamento'}`"
          @click="emit('handle', item.id)"
        />
      </li>
    </ul>
  </BasePanel>
</template>
