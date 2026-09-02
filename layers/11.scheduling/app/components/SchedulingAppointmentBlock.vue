<script setup lang="ts">
import type { SchedulingAppointment } from '../composables/useSchedulingBoard'
import { AGENDAMENTO_STATUS_COLOR, AGENDAMENTO_STATUS_LABEL, formatTimeRange } from '../utils/scheduling'

defineOptions({ name: 'SchedulingAppointmentBlock' })

const props = defineProps<{
  appointment: SchedulingAppointment
  canWrite?: boolean
}>()

const emit = defineEmits<{
  'mark-no-show': [id: string]
}>()

const vehicleLabel = computed(() => {
  const v = props.appointment.veiculos
  if (!v) return EMPTY_VALUE
  const parts = [v.marca, v.modelo].filter(Boolean)
  return parts.length ? parts.join(' ') : EMPTY_VALUE
})
</script>

<template>
  <article
    class="rounded-lg border border-default bg-default p-3 shadow-sm transition-[transform,opacity,background-color] duration-150 hover:bg-elevated/40 active:scale-[0.99]"
  >
    <div class="flex flex-wrap items-start justify-between gap-2">
      <p class="font-mono text-sm font-semibold tabular-nums tracking-tight text-highlighted">
        {{ formatTimeRange(appointment.inicio, appointment.fim) }}
      </p>
      <UBadge
        :color="AGENDAMENTO_STATUS_COLOR[appointment.status]"
        variant="subtle"
        size="sm"
      >
        {{ AGENDAMENTO_STATUS_LABEL[appointment.status] }}
      </UBadge>
    </div>

    <div class="mt-2 flex flex-wrap items-center gap-2">
      <span
        v-if="appointment.veiculos"
        class="rounded border border-default bg-elevated/60 px-1.5 py-0.5 font-mono text-xs tracking-wide tabular-nums"
      >
        {{ formatPlaca(appointment.veiculos.placa) }}
      </span>
      <span
        v-if="appointment.patio_vaga"
        class="rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary"
      >
        Vaga {{ appointment.patio_vaga }}
      </span>
    </div>

    <p class="mt-2 truncate text-sm font-medium text-highlighted">
      {{ appointment.clientes?.nome?.trim() || EMPTY_VALUE }}
    </p>
    <p class="mt-0.5 truncate text-xs text-muted">
      {{ appointment.servico?.trim() || vehicleLabel }}
    </p>

    <div
      v-if="canWrite && (appointment.status === 'agendado' || appointment.status === 'confirmado')"
      class="mt-3"
    >
      <UButton
        size="xs"
        color="neutral"
        variant="outline"
        label="Não compareceu"
        @click="emit('mark-no-show', appointment.id)"
      />
    </div>
  </article>
</template>
