<script setup lang="ts">
import {
  buildWeekDays,
  formatWeekHeading,
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
}>()

const weekdays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const days = computed(() => buildWeekDays(props.selectedDate))
const today = startOfLocalDay(new Date())
const focusedKey = ref(startOfLocalDay(props.selectedDate).toISOString())

watch(() => props.selectedDate, (value) => {
  focusedKey.value = startOfLocalDay(value).toISOString()
})

function countFor(day: Date): number {
  return props.counts.get(startOfLocalDay(day).toISOString()) ?? 0
}

function dayLabel(day: Date): string {
  const dateLabel = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(day)
  const count = countFor(day)
  if (count === 0) return `${dateLabel}, sem agendamentos`
  if (count === 1) return `${dateLabel}, 1 agendamento`
  return `${dateLabel}, ${count} agendamentos`
}

function dayKey(day: Date) {
  return startOfLocalDay(day).toISOString()
}

function onDayKeydown(event: KeyboardEvent, index: number) {
  let next = index
  if (event.key === 'ArrowRight') next = index + 1
  else if (event.key === 'ArrowLeft') next = index - 1
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = 6
  else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    const current = days.value[index]
    if (current) emit('select', current)
    return
  }
  else {
    return
  }

  const target = days.value[next]
  if (!target) return
  event.preventDefault()
  focusedKey.value = dayKey(target)
  nextTick(() => {
    document.getElementById(`scheduling-day-${next}`)?.focus()
  })
}
</script>

<template>
  <section class="rounded-lg border border-default bg-default p-4 shadow-sm dark:shadow-none sm:p-6">
    <h2 class="sr-only">
      {{ formatWeekHeading(selectedDate) }}
    </h2>

    <div
      v-if="pending"
      class="grid grid-cols-7 gap-1"
      role="status"
      aria-live="polite"
      aria-label="Carregando semana…"
    >
      <USkeleton
        v-for="n in 7"
        :key="n"
        class="h-24 w-full"
      />
    </div>

    <div
      v-else
      class="space-y-2"
    >
      <div
        class="grid grid-cols-7"
        aria-hidden="true"
      >
        <span
          v-for="label in weekdays"
          :key="label"
          class="py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted"
        >
          {{ label }}
        </span>
      </div>

      <div
        class="grid grid-cols-7 gap-1"
        role="grid"
        aria-label="Agenda da semana"
      >
        <button
          v-for="(day, index) in days"
          :id="`scheduling-day-${index}`"
          :key="day.toISOString()"
          type="button"
          role="gridcell"
          class="flex min-h-24 flex-col items-center justify-center gap-1 rounded-lg transition-colors hover:bg-elevated/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-safe:active:scale-[0.98] touch-manipulation"
          :class="isSameLocalDay(day, selectedDate) ? 'bg-primary/10' : ''"
          :tabindex="dayKey(day) === focusedKey ? 0 : -1"
          :aria-label="dayLabel(day)"
          :aria-selected="isSameLocalDay(day, selectedDate)"
          :aria-current="isSameLocalDay(day, today) ? 'date' : undefined"
          @keydown="onDayKeydown($event, index)"
          @click="emit('select', day)"
        >
          <span
            class="font-mono text-sm tabular-nums"
            :class="isSameLocalDay(day, today) ? 'font-semibold text-primary' : 'text-highlighted'"
          >
            {{ day.getDate() }}
          </span>
          <span
            v-if="countFor(day) > 0"
            class="font-mono text-[0.6875rem] tabular-nums text-primary"
          >
            {{ countFor(day) }}
          </span>
          <span
            v-else
            class="text-[0.6875rem] text-muted"
          >
            —
          </span>
        </button>
      </div>
    </div>
  </section>
</template>
