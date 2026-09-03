<script setup lang="ts">
import type { PatioSlot, SchedulingAppointment } from '../composables/useSchedulingBoard'

defineOptions({ name: 'SchedulingPatioPanel' })

defineProps<{
  slots: PatioSlot[]
  pending?: boolean
  canWrite?: boolean
}>()

const emit = defineEmits<{
  edit: [appointment: SchedulingAppointment]
}>()
</script>

<template>
  <BasePanel title="Status do pátio">
    <div
      v-if="pending"
      class="grid grid-cols-2 gap-2 sm:grid-cols-4"
      role="status"
      aria-label="Carregando pátio…"
    >
      <USkeleton
        v-for="n in 8"
        :key="n"
        class="h-16 w-full"
      />
    </div>

    <ul
      v-else
      class="grid grid-cols-2 gap-2 sm:grid-cols-4"
      aria-label="Vagas do pátio"
    >
      <li
        v-for="item in slots"
        :key="item.slot"
      >
        <button
          v-if="item.appointment && canWrite"
          type="button"
          class="w-full rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-2 text-left transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          :aria-label="`Editar agendamento da vaga ${item.slot}`"
          @click="emit('edit', item.appointment)"
        >
          <p class="text-xs font-semibold uppercase tracking-wide text-muted">
            Vaga {{ item.slot }}
          </p>
          <p class="mt-1 font-mono text-sm font-medium tabular-nums tracking-wide text-highlighted">
            {{ item.appointment.veiculos ? formatPlaca(item.appointment.veiculos.placa) : EMPTY_VALUE }}
          </p>
        </button>
        <div
          v-else
          class="rounded-lg border border-default px-2.5 py-2"
          :class="item.appointment ? 'bg-primary/5 border-primary/20' : 'bg-elevated/30'"
        >
          <p class="text-xs font-semibold uppercase tracking-wide text-muted">
            Vaga {{ item.slot }}
          </p>
          <p
            v-if="item.appointment?.veiculos"
            class="mt-1 font-mono text-sm font-medium tabular-nums tracking-wide text-highlighted"
          >
            {{ formatPlaca(item.appointment.veiculos.placa) }}
          </p>
          <p
            v-else
            class="mt-1 text-sm text-muted"
          >
            Livre
          </p>
        </div>
      </li>
    </ul>
  </BasePanel>
</template>
