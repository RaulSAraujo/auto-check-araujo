<script setup lang="ts">
import type { SchedulingAppointment } from '../composables/useSchedulingBoard'
import { LUNCH_HOUR, timelineHours } from '../utils/scheduling'

defineOptions({ name: 'SchedulingDailyTimeline' })

defineProps<{
  appointments: SchedulingAppointment[]
  pending?: boolean
  canWrite?: boolean
  canCreateOrder?: boolean
  markingId?: string | null
}>()

const emit = defineEmits<{
  'mark-no-show': [id: string]
  'create': []
  'edit': [appointment: SchedulingAppointment]
}>()

const hours = timelineHours()

function appointmentsForHour(list: SchedulingAppointment[], hour: number) {
  return list.filter((row) => {
    const start = new Date(row.inicio)
    return start.getHours() === hour
  })
}
</script>

<template>
  <BasePanel title="Cronograma diário">
    <div
      v-if="pending"
      class="space-y-3"
      role="status"
      aria-label="Carregando agenda…"
    >
      <USkeleton
        v-for="n in 4"
        :key="n"
        class="h-20 w-full"
      />
    </div>

    <BaseEmptyState
      v-else-if="!appointments.length"
      icon="i-lucide-calendar-off"
    >
      Nenhum agendamento neste dia. Crie um horário para o cliente.
      <template
        v-if="canWrite"
        #actions
      >
        <UButton
          label="Novo agendamento"
          icon="i-lucide-plus"
          @click="emit('create')"
        />
      </template>
    </BaseEmptyState>

    <ol
      v-else
      class="space-y-0 divide-y divide-default"
      aria-label="Agenda diária"
    >
      <li
        v-for="hour in hours"
        :key="hour"
        class="grid grid-cols-[3.5rem_1fr] gap-3 py-3 first:pt-0 last:pb-0"
      >
        <span class="pt-1 font-mono text-xs tabular-nums text-muted">
          {{ String(hour).padStart(2, '0') }}:00
        </span>

        <div class="min-w-0 space-y-2">
          <p
            v-if="hour === LUNCH_HOUR"
            class="border-t border-dashed border-default pt-2 text-xs text-muted"
          >
            Horário de almoço
          </p>

          <SchedulingAppointmentBlock
            v-for="appointment in appointmentsForHour(appointments, hour)"
            :key="appointment.id"
            :appointment="appointment"
            :can-write="canWrite"
            :can-create-order="canCreateOrder"
            :marking="markingId === appointment.id"
            @mark-no-show="emit('mark-no-show', $event)"
            @edit="emit('edit', $event)"
          />
        </div>
      </li>
    </ol>
  </BasePanel>
</template>
