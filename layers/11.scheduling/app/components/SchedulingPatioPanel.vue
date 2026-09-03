<script setup lang="ts">
import type { PatioSlot, SchedulingAppointment } from '../composables/useSchedulingBoard'
import { PATIO_SLOT_COUNT } from '../utils/scheduling'

defineOptions({ name: 'SchedulingPatioPanel' })

const props = defineProps<{
  slots: PatioSlot[]
  pending?: boolean
  canWrite?: boolean
}>()

const emit = defineEmits<{
  edit: [appointment: SchedulingAppointment]
  create: [slot: number]
}>()

const occupiedCount = computed(() =>
  props.slots.filter(item => item.appointment).length
)
</script>

<template>
  <section class="rounded-lg border border-default bg-default p-4 shadow-sm dark:shadow-none">
    <div class="mb-3 flex items-baseline justify-between gap-2">
      <h2 class="text-xs font-semibold uppercase tracking-widest text-muted">
        Pátio
      </h2>
      <span
        v-if="!pending"
        class="font-mono text-xs tabular-nums text-muted"
      >
        {{ occupiedCount }}/{{ PATIO_SLOT_COUNT }}
      </span>
    </div>

    <div
      v-if="pending"
      class="grid grid-cols-2 gap-2"
      role="status"
      aria-live="polite"
      aria-label="Carregando pátio…"
    >
      <USkeleton
        v-for="n in 8"
        :key="n"
        class="h-14 w-full"
      />
    </div>

    <ul
      v-else
      class="grid grid-cols-2 gap-2"
      aria-label="Vagas do pátio"
    >
      <li
        v-for="item in slots"
        :key="item.slot"
      >
        <button
          v-if="item.appointment && canWrite"
          type="button"
          class="flex min-h-12 w-full flex-col items-start justify-center rounded-lg bg-primary/10 px-2.5 py-2 text-left transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-safe:active:scale-[0.98] touch-manipulation"
          :aria-label="`Editar vaga ${item.slot}`"
          @click="emit('edit', item.appointment)"
        >
          <span class="font-mono text-[0.6875rem] tabular-nums text-muted">{{ item.slot }}</span>
          <span class="mt-0.5 w-full truncate font-mono text-xs font-medium tabular-nums text-highlighted">
            {{ item.appointment.veiculos ? formatPlaca(item.appointment.veiculos.placa) : EMPTY_VALUE }}
          </span>
        </button>
        <button
          v-else-if="!item.appointment && canWrite"
          type="button"
          class="flex min-h-12 w-full flex-col items-start justify-center rounded-lg border border-dashed border-default px-2.5 py-2 text-left text-muted transition-colors hover:border-primary/40 hover:bg-elevated/60 hover:text-highlighted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-safe:active:scale-[0.98] touch-manipulation"
          :aria-label="`Reservar vaga ${item.slot}`"
          @click="emit('create', item.slot)"
        >
          <span class="font-mono text-[0.6875rem] tabular-nums">{{ item.slot }}</span>
        </button>
        <div
          v-else
          class="flex min-h-12 flex-col items-start justify-center rounded-lg px-2.5 py-2"
          :class="item.appointment ? 'bg-primary/10' : 'border border-dashed border-default'"
        >
          <span class="font-mono text-[0.6875rem] tabular-nums text-muted">{{ item.slot }}</span>
          <span
            v-if="item.appointment?.veiculos"
            class="mt-0.5 w-full truncate font-mono text-xs font-medium tabular-nums text-highlighted"
          >
            {{ formatPlaca(item.appointment.veiculos.placa) }}
          </span>
        </div>
      </li>
    </ul>
  </section>
</template>
