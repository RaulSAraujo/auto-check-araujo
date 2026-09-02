<script setup lang="ts">
import type { KanbanOrderCard } from '../composables/useKanbanBoard'
import { ORDER_ROUTES } from '#layers/orders/app/utils/order-routes'
import { EMPTY_VALUE } from '~~/shared/utils/empty'

defineOptions({ name: 'KanbanCard' })

const props = defineProps<{
  order: KanbanOrderCard
}>()

const vehicleLabel = computed(() => {
  const vehicle = props.order.veiculos
  if (!vehicle) return EMPTY_VALUE
  const parts = [vehicle.marca, vehicle.modelo].filter(Boolean)
  return parts.length ? parts.join(' ') : EMPTY_VALUE
})

const title = computed(() => {
  const complaint = props.order.reclamacao?.trim()
  if (complaint) return complaint
  return vehicleLabel.value !== EMPTY_VALUE ? vehicleLabel.value : props.order.numero
})

const customerName = computed(() =>
  props.order.veiculos?.clientes?.nome?.trim() || EMPTY_VALUE
)

const responsibleName = computed(() =>
  props.order.profiles?.nome?.trim() || EMPTY_VALUE
)
</script>

<template>
  <NuxtLink
    :to="ORDER_ROUTES.detail(order.id)"
    class="block rounded-lg border border-default bg-default p-3 shadow-sm transition-[transform,opacity,background-color] duration-150 hover:bg-elevated/50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    :class="order.overdue ? 'border-error/40 bg-error/5' : ''"
  >
    <div class="flex items-start justify-between gap-2">
      <p class="font-mono text-sm font-semibold tabular-nums tracking-tight text-primary">
        {{ order.numero }}
      </p>
      <UBadge
        v-if="order.overdue"
        color="error"
        variant="subtle"
        size="sm"
        class="shrink-0"
      >
        Atraso
      </UBadge>
    </div>

    <p class="mt-1.5 line-clamp-2 text-sm font-medium text-highlighted text-pretty">
      {{ title }}
    </p>

    <p class="mt-1 truncate text-xs text-muted">
      {{ customerName }}
    </p>

    <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted">
      <span
        v-if="order.veiculos"
        class="rounded border border-default bg-elevated/60 px-1.5 py-0.5 font-mono tracking-wide tabular-nums text-default"
      >
        {{ formatPlaca(order.veiculos.placa) }}
      </span>

      <span class="inline-flex min-w-0 items-center gap-1">
        <UIcon
          name="i-lucide-user"
          class="size-3.5 shrink-0"
          aria-hidden="true"
        />
        <span class="truncate">{{ responsibleName }}</span>
      </span>

      <span class="inline-flex items-center gap-1 font-mono tabular-nums">
        <UIcon
          name="i-lucide-clock"
          class="size-3.5 shrink-0"
          aria-hidden="true"
        />
        {{ order.stageDurationLabel }}
      </span>
    </div>
  </NuxtLink>
</template>
