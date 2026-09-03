<script setup lang="ts">
import type { SchedulingAppointment } from '../composables/useSchedulingBoard'
import { ORDER_ROUTES } from '#layers/orders/app/utils/order-routes'
import { AGENDAMENTO_STATUS_LABEL, formatTimeRange, statusBarClass } from '../utils/scheduling'

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

const clientName = computed(() =>
  props.appointment.clientes?.nome?.trim() || EMPTY_VALUE
)

const detail = computed(() => {
  const service = props.appointment.servico?.trim()
  if (service) return service
  const v = props.appointment.veiculos
  if (!v) return ''
  return [v.marca, v.modelo].filter(Boolean).join(' ')
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
    class="flex min-w-0 items-center gap-3 border-l-[3px] py-2.5 pl-3 pr-1"
    :class="statusBarClass(appointment.status)"
  >
    <div
      class="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-md"
      :class="canWrite ? 'cursor-pointer hover:bg-elevated/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary' : ''"
      :role="canWrite ? 'button' : undefined"
      :tabindex="canWrite ? 0 : undefined"
      :aria-label="canWrite ? `Editar agendamento de ${clientName}` : undefined"
      @click="canWrite && onEdit()"
      @keydown.enter.prevent="canWrite && onEdit()"
      @keydown.space.prevent="canWrite && onEdit()"
    >
      <time class="w-[4.75rem] shrink-0 font-mono text-xs tabular-nums text-muted">
        {{ formatTimeRange(appointment.inicio, appointment.fim) }}
      </time>
      <span
        v-if="appointment.veiculos"
        class="w-[5.5rem] shrink-0 font-mono text-sm font-medium tabular-nums tracking-wide text-highlighted"
      >
        {{ formatPlaca(appointment.veiculos.placa) }}
      </span>
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium text-highlighted">
          {{ clientName }}
        </p>
        <p
          v-if="detail || appointment.patio_vaga"
          class="truncate text-xs text-muted"
        >
          <template v-if="detail">{{ detail }}</template>
          <template v-if="detail && appointment.patio_vaga"> · </template>
          <template v-if="appointment.patio_vaga">vaga {{ appointment.patio_vaga }}</template>
        </p>
      </div>
      <span class="hidden shrink-0 text-xs text-muted lg:inline">
        {{ AGENDAMENTO_STATUS_LABEL[appointment.status] }}
      </span>
    </div>

    <div
      v-if="canMarkNoShow || orderHref || (canCreateOrder && openOrderHref)"
      class="flex shrink-0 flex-wrap items-center justify-end gap-0.5"
    >
      <UButton
        v-if="orderHref"
        size="sm"
        color="neutral"
        variant="ghost"
        label="Ver OS"
        :to="orderHref"
      />
      <UButton
        v-else-if="canCreateOrder && openOrderHref"
        size="sm"
        color="neutral"
        variant="ghost"
        label="Abrir OS"
        :to="openOrderHref"
      />
      <UButton
        v-if="canMarkNoShow"
        size="sm"
        color="neutral"
        variant="ghost"
        label="Falta"
        :loading="marking"
        :disabled="marking"
        :aria-label="`Marcar não comparecimento de ${clientName}`"
        @click="emit('mark-no-show', appointment.id)"
      />
    </div>
  </article>
</template>
