<script setup lang="ts">
import type { SchedulingAppointment } from '../composables/useSchedulingBoard'
import type { AppointmentCreatePrefill } from '../utils/scheduling'

defineOptions({ name: 'SchedulingDailyTimeline' })

const props = defineProps<{
  appointments: SchedulingAppointment[]
  pending?: boolean
  canWrite?: boolean
  canCreateOrder?: boolean
  markingId?: string | null
  hasActiveFilters?: boolean
  dayHasAppointments?: boolean
}>()

const emit = defineEmits<{
  'create': [prefill?: AppointmentCreatePrefill]
  'clear-filters': []
  'edit': [appointment: SchedulingAppointment]
  'mark-no-show': [id: string]
  'undo-no-show': [id: string]
}>()

const sortedAppointments = computed(() =>
  [...props.appointments].sort(
    (a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime()
  )
)
</script>

<template>
  <section class="rounded-lg border border-default bg-default px-3 py-4 shadow-sm dark:shadow-none sm:px-4">
    <h2 class="px-1 text-xs font-semibold uppercase tracking-widest text-muted">
      Agenda do dia
    </h2>

    <div
      v-if="pending"
      class="mt-3 space-y-2"
      role="status"
      aria-live="polite"
      aria-label="Carregando agenda…"
    >
      <USkeleton
        v-for="n in 3"
        :key="n"
        class="h-12 w-full"
      />
    </div>

    <div
      v-else-if="!appointments.length && hasActiveFilters && dayHasAppointments"
      class="mt-4 flex items-center justify-between gap-3 px-1"
    >
      <p class="text-sm text-muted">
        Nada neste filtro.
      </p>
      <UButton
        label="Limpar filtro"
        color="neutral"
        variant="outline"
        size="sm"
        @click="emit('clear-filters')"
      />
    </div>

    <div
      v-else-if="!appointments.length"
      class="mt-4 flex flex-wrap items-center gap-3 px-1"
    >
      <p class="text-sm text-muted">
        Nenhum horário neste dia.
      </p>
      <UButton
        v-if="canWrite"
        label="Novo agendamento"
        icon="i-lucide-plus"
        size="sm"
        @click="emit('create')"
      />
    </div>

    <ul
      v-else
      class="mt-2 divide-y divide-default"
      aria-label="Agenda diária"
    >
      <li
        v-for="(appointment, index) in sortedAppointments"
        :key="appointment.id"
        class="motion-safe:animate-[fade-in_200ms_both]"
        :style="{ animationDelay: `${index * 40}ms` }"
      >
        <SchedulingAppointmentBlock
          :appointment="appointment"
          :can-write="canWrite"
          :can-create-order="canCreateOrder"
          :marking="markingId === appointment.id"
          @edit="emit('edit', $event)"
          @mark-no-show="emit('mark-no-show', $event)"
          @undo-no-show="emit('undo-no-show', $event)"
        />
      </li>
    </ul>
  </section>
</template>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  li {
    animation: none !important;
  }
}
</style>
