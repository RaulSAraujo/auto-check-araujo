<script setup lang="ts">
import type { DashboardAppointment } from '../composables/useDashboardStats'
import { AGENDAMENTO_STATUS_LABEL } from '~~/shared/types/oficina'

defineOptions({ name: 'HomeTodaySchedule' })

defineProps<{
  pending: boolean
  appointments: DashboardAppointment[]
}>()

const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit'
})

function timeRange(appointment: DashboardAppointment) {
  return `${timeFormatter.format(new Date(appointment.inicio))}–${timeFormatter.format(new Date(appointment.fim))}`
}

function title(appointment: DashboardAppointment) {
  const plate = appointment.veiculos ? formatPlaca(appointment.veiculos.placa) : 'Sem placa'
  const name = appointment.clientes?.nome
  return name ? `${plate} · ${name}` : plate
}
</script>

<template>
  <section
    class="home-block flex h-full min-h-0 flex-col"
    style="--home-stagger: 1"
    aria-labelledby="home-today-heading"
  >
    <div class="mb-2 flex min-h-9 items-end justify-between gap-3">
      <div class="min-w-0">
        <h2
          id="home-today-heading"
          class="text-sm font-semibold uppercase tracking-widest text-muted"
        >
          Agenda de hoje
        </h2>
        <p
          v-if="!pending"
          class="mt-0.5 text-sm text-muted"
        >
          <span class="home-num font-semibold tabular-nums text-highlighted">{{ appointments.length }}</span>
          agendamento{{ appointments.length === 1 ? '' : 's' }}
        </p>
      </div>
      <UButton
        :to="APP_ROUTES.scheduling"
        label="Agenda"
        variant="link"
        size="sm"
        color="primary"
        trailing-icon="i-lucide-arrow-right"
        class="font-medium"
      />
    </div>

    <div class="flex max-h-72 min-h-48 flex-1 flex-col overflow-hidden rounded-lg border border-default bg-default shadow-sm dark:border-accented dark:bg-elevated dark:shadow-none">
      <div
        v-if="pending"
        class="space-y-2 p-3"
      >
        <USkeleton
          v-for="n in 3"
          :key="n"
          class="h-12 w-full"
        />
      </div>

      <div
        v-else-if="appointments.length === 0"
        class="flex flex-1 items-center justify-center p-4"
      >
        <BaseEmptyState
          icon="i-lucide-calendar-days"
          class="w-full border-0"
        >
          Nenhum agendamento para hoje.
        </BaseEmptyState>
      </div>

      <ul
        v-else
        class="divide-y divide-default overflow-y-auto"
      >
        <li
          v-for="appointment in appointments"
          :key="appointment.id"
        >
          <NuxtLink
            :to="APP_ROUTES.scheduling"
            class="flex min-h-12 items-start gap-3 px-3 py-2.5 transition-colors hover:bg-elevated/60 focus-visible:bg-elevated/60 focus-visible:outline-none sm:px-4"
          >
            <span class="home-num w-24 shrink-0 text-sm font-semibold tabular-nums text-primary">
              {{ timeRange(appointment) }}
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-medium text-highlighted">
                {{ title(appointment) }}
              </span>
              <span class="mt-0.5 block truncate text-xs text-muted">
                {{ AGENDAMENTO_STATUS_LABEL[appointment.status] }}
                <template v-if="appointment.servico">
                  · {{ appointment.servico }}
                </template>
                <template v-if="appointment.patio_vaga != null">
                  · Pátio {{ appointment.patio_vaga }}
                </template>
              </span>
            </span>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.home-num {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}

.home-block {
  animation: home-rise 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(var(--home-stagger, 0) * 60ms);
}

@keyframes home-rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-block {
    animation: none;
  }
}
</style>
