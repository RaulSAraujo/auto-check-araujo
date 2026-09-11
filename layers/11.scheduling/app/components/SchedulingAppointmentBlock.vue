<script setup lang="ts">
import type { SchedulingAppointment } from '../composables/useSchedulingBoard'
import { ORDER_ROUTES } from '#layers/orders/app/utils/order-routes'
import {
  AGENDAMENTO_STATUS_LABEL,
  appointmentProblem,
  canMarkNoShow,
  formatTimeShort,
  statusBarClass
} from '../utils/scheduling'

defineOptions({ name: 'SchedulingAppointmentBlock' })

const props = defineProps<{
  appointment: SchedulingAppointment
  canWrite?: boolean
  canCreateOrder?: boolean
  marking?: boolean
}>()

const emit = defineEmits<{
  'edit': [appointment: SchedulingAppointment]
  'mark-no-show': [id: string]
  'undo-no-show': [id: string]
}>()

const clientName = computed(() =>
  props.appointment.clientes?.nome?.trim() || EMPTY_VALUE
)

const detail = computed(() => appointmentProblem(props.appointment))

const showMarkNoShow = computed(() =>
  props.canWrite && canMarkNoShow(props.appointment.status) && !props.appointment.ordem_servico_id
)

const showUndoNoShow = computed(() =>
  props.canWrite && props.appointment.status === 'nao_compareceu'
)

const orderHref = computed(() =>
  props.appointment.ordem_servico_id
    ? ORDER_ROUTES.detail(props.appointment.ordem_servico_id)
    : null
)

const openOrderHref = computed(() => {
  if (props.appointment.ordem_servico_id || !props.appointment.veiculo_id) return null
  if (props.appointment.status === 'nao_compareceu') return null
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
      <time class="w-12 shrink-0 font-mono text-xs tabular-nums text-muted">
        ~{{ formatTimeShort(appointment.inicio) }}
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
          v-if="detail"
          class="truncate text-xs text-muted"
        >
          {{ detail }}
        </p>
      </div>
      <span class="hidden shrink-0 text-xs text-muted lg:inline">
        {{ AGENDAMENTO_STATUS_LABEL[appointment.status] }}
      </span>
    </div>

    <div
      v-if="orderHref || (canCreateOrder && openOrderHref) || showMarkNoShow || showUndoNoShow"
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
        v-if="showMarkNoShow"
        size="sm"
        color="neutral"
        variant="ghost"
        label="Faltou"
        :loading="marking"
        :disabled="marking"
        :aria-label="`Marcar falta de ${clientName}`"
        @click="emit('mark-no-show', appointment.id)"
      />
      <UButton
        v-if="showUndoNoShow"
        size="sm"
        color="neutral"
        variant="ghost"
        label="Desfazer"
        :loading="marking"
        :disabled="marking"
        :aria-label="`Desfazer falta de ${clientName}`"
        @click="emit('undo-no-show', appointment.id)"
      />
    </div>
  </article>
</template>
