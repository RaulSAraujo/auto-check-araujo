<script setup lang="ts">
import {
  buildMonthGrid,
  formatMonthHeading,
  isSameLocalDay,
  startOfLocalDay
} from '../utils/scheduling'

defineOptions({ name: 'SchedulingCalendar' })

const props = defineProps<{
  selectedDate: Date
  counts: Map<string, number>
  pending?: boolean
}>()

const emit = defineEmits<{
  'select': [date: Date]
  'prev-month': []
  'next-month': []
}>()

const weekdays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const days = computed(() => buildMonthGrid(props.selectedDate))
const today = startOfLocalDay(new Date())

function countFor(day: Date): number {
  return props.counts.get(startOfLocalDay(day).toISOString()) ?? 0
}

function isOutsideMonth(day: Date): boolean {
  return day.getMonth() !== props.selectedDate.getMonth()
}
</script>

<template>
  <BasePanel>
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <h2 class="font-semibold text-highlighted">
          {{ formatMonthHeading(selectedDate) }}
        </h2>
        <div class="flex items-center gap-1">
          <UButton
            icon="i-lucide-chevron-left"
            color="neutral"
            variant="ghost"
            size="sm"
            aria-label="Mês anterior"
            @click="emit('prev-month')"
          />
          <UButton
            icon="i-lucide-chevron-right"
            color="neutral"
            variant="ghost"
            size="sm"
            aria-label="Próximo mês"
            @click="emit('next-month')"
          />
        </div>
      </div>
    </template>

    <div
      v-if="pending"
      class="grid grid-cols-7 gap-1"
    >
      <USkeleton
        v-for="n in 28"
        :key="n"
        class="aspect-square w-full"
      />
    </div>

    <div
      v-else
      class="space-y-2"
    >
      <div class="grid grid-cols-7 gap-1">
        <span
          v-for="label in weekdays"
          :key="label"
          class="text-center text-[0.6875rem] font-semibold uppercase tracking-wide text-muted"
        >
          {{ label }}
        </span>
      </div>

      <div
        class="grid grid-cols-7 gap-1"
        role="grid"
        aria-label="Calendário de agendamentos"
      >
        <button
          v-for="day in days"
          :key="day.toISOString()"
          type="button"
          class="flex min-h-16 flex-col items-start rounded-lg border border-transparent px-1.5 py-1 text-left transition-[transform,background-color] duration-150 hover:bg-elevated/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.98]"
          :class="[
            isSameLocalDay(day, selectedDate) ? 'border-primary bg-primary/10' : 'border-default/60',
            isOutsideMonth(day) ? 'opacity-40' : '',
            isSameLocalDay(day, today) && !isSameLocalDay(day, selectedDate) ? 'ring-1 ring-inset ring-primary/30' : ''
          ]"
          @click="emit('select', day)"
        >
          <span class="font-mono text-xs tabular-nums text-muted">
            {{ day.getDate() }}
          </span>
          <span
            v-if="countFor(day) > 0"
            class="mt-auto font-mono text-[0.6875rem] font-semibold tabular-nums text-primary"
          >
            {{ countFor(day) }}
          </span>
        </button>
      </div>
    </div>
  </BasePanel>
</template>
