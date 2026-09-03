<script setup lang="ts">
import type { SchedulingAppointment } from '../composables/useSchedulingBoard'
import { ORDER_ROUTES } from '#layers/orders/app/utils/order-routes'
import { AGENDAMENTO_STATUS_COLOR, AGENDAMENTO_STATUS_LABEL, formatTimeRange } from '../utils/scheduling'

defineOptions({ name: 'SchedulingAppointmentBlock' })

const props = defineProps<{
  appointment: SchedulingAppointment
  canWrite?: boolean
  canCreateOrder?: boolean
  marking?: boolean
}>()

const emit = defineEmits<{
  'mark-no-show': [id: string]
  'edit': [appointment: SchedulingAppointment]
}>()

const vehicleLabel = computed(() => {
  const v = props.appointment.veiculos
  if (!v) return EMPTY_VALUE
  const parts = [v.marca, v.modelo].filter(Boolean)
  return parts.length ? parts.join(' ') : EMPTY_VALUE
})

const canMarkNoShow = computed(() =>
  props.canWrite
  && (props.appointment.status === 'agendado' || props.appointment.status === 'confirmado')
)

const orderHref = computed(() =>
  props.appointment.ordem_servico_id
    ? ORDER_ROUTES.detail(props.appointment.ordem_servico_id)
    : null
)

const openOrderHref = computed(() => {
  if (props.appointment.ordem_servico_id || !props.appointment.veiculo_id) return null
  return ORDER_ROUTES.newFromAppointment(props.appointment.veiculo_id, props.appointment.id)
})

function onEdit() {
  emit('edit', props.appointment)
}
</script>

<template>
  <article
    class="rounded-lg border border-default bg-default p-3 shadow-sm transition-[transform,opacity,background-color] duration-150 hover:bg-elevated/40 motion-safe:active:scale-[0.99]"
    :class="canWrite ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary' : ''"
    :role="canWrite ? 'button' : undefined"
    :tabindex="canWrite ? 0 : undefined"
    :aria-label="canWrite ? `Editar agendamento de ${appointment.clientes?.nome || 'cliente'}` : undefined"
    @click="canWrite && onEdit()"
    @keydown.enter.prevent="canWrite && onEdit()"
    @keydown.space.prevent="canWrite && onEdit()"
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
      v-if="canMarkNoShow || orderHref || (canCreateOrder && openOrderHref)"
      class="mt-3 flex flex-wrap gap-2"
      @click.stop
      @keydown.stop
    >
      <UButton
        v-if="orderHref"
        size="xs"
        color="neutral"
        variant="outline"
        icon="i-lucide-wrench"
        label="Ver OS"
        :to="orderHref"
      />
      <UButton
        v-else-if="canCreateOrder && openOrderHref"
        size="xs"
        icon="i-lucide-plus"
        label="Abrir OS"
        :to="openOrderHref"
      />
      <UButton
        v-if="canMarkNoShow"
        size="xs"
        color="neutral"
        variant="outline"
        label="Não compareceu"
        :loading="marking"
        :disabled="marking"
        @click="emit('mark-no-show', appointment.id)"
      />
    </div>
  </article>
</template>
