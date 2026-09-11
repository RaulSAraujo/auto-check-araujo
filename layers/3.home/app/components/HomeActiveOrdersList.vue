<script setup lang="ts">
import { ORDER_ROUTES } from '#layers/orders/app/utils/order-routes'
import type { DashboardActiveOrder } from '../composables/useDashboardStats'
import { HOME_STATUS_HEX, type HomeActiveStatus } from '../utils/home-chart-colors'
import { ORDEM_STATUS_LABEL } from '~~/shared/types/oficina'

defineOptions({ name: 'HomeActiveOrdersList' })

defineProps<{
  pending: boolean
  orders: DashboardActiveOrder[]
  total: number
}>()

function statusTone(status: string) {
  if (status === 'aberta') return 'text-primary'
  if (status === 'em_andamento') return 'text-warning'
  return 'text-muted'
}

function statusDot(status: string) {
  if (status === 'aberta' || status === 'em_andamento') {
    return HOME_STATUS_HEX[status as HomeActiveStatus]
  }
  return '#717783'
}

function vehicleLabel(order: DashboardActiveOrder) {
  const vehicle = order.veiculos
  if (!vehicle) return 'Sem veículo'
  const plate = formatPlaca(vehicle.placa)
  const model = [vehicle.marca, vehicle.modelo].filter(Boolean).join(' ')
  return model ? `${plate} · ${model}` : plate
}
</script>

<template>
  <section
    class="home-block flex h-full min-h-0 flex-col"
    style="--home-stagger: 1"
    aria-labelledby="home-active-orders-heading"
  >
    <div class="mb-2 flex min-h-9 items-end justify-between gap-3">
      <div class="min-w-0">
        <h2
          id="home-active-orders-heading"
          class="text-sm font-semibold uppercase tracking-widest text-muted"
        >
          OS ativas
        </h2>
        <p
          v-if="!pending"
          class="mt-0.5 text-sm text-muted"
        >
          <span class="home-num font-semibold tabular-nums text-highlighted">{{ total }}</span>
          na fila · {{ orders.length }} recentes
        </p>
      </div>
      <UButton
        :to="APP_ROUTES.orders"
        label="Ver ordens"
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
          v-for="n in 4"
          :key="n"
          class="h-12 w-full"
        />
      </div>

      <div
        v-else-if="orders.length === 0"
        class="flex flex-1 items-center justify-center p-4"
      >
        <BaseEmptyState
          icon="i-lucide-clipboard-list"
          class="w-full border-0"
        >
          Nenhuma OS ativa.
          <template #actions>
            <UButton
              :to="APP_ROUTES.ordersNew"
              label="Nova OS"
              color="primary"
              size="sm"
            />
          </template>
        </BaseEmptyState>
      </div>

      <ul
        v-else
        class="divide-y divide-default overflow-y-auto"
      >
        <li
          v-for="order in orders"
          :key="order.id"
        >
          <NuxtLink
            :to="ORDER_ROUTES.detail(order.id)"
            class="group flex min-h-12 items-center gap-3 px-3 py-2.5 transition-colors hover:bg-elevated/60 focus-visible:bg-elevated/60 focus-visible:outline-none sm:px-4"
          >
            <span
              class="size-2.5 shrink-0 rounded-full"
              :style="{ backgroundColor: statusDot(order.status) }"
              aria-hidden="true"
            />
            <span class="min-w-0 flex-1">
              <span class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span class="home-num text-sm font-semibold tabular-nums text-highlighted">
                  {{ order.numero }}
                </span>
                <span
                  class="text-xs font-medium"
                  :class="statusTone(order.status)"
                >
                  {{ ORDEM_STATUS_LABEL[order.status] }}
                </span>
              </span>
              <span class="mt-0.5 block truncate text-sm text-muted">
                {{ vehicleLabel(order) }}
                <template v-if="order.veiculos?.clientes?.nome">
                  · {{ order.veiculos.clientes.nome }}
                </template>
              </span>
            </span>
            <span class="hidden shrink-0 text-xs tabular-nums text-dimmed sm:inline">
              {{ formatDateTime(order.aberta_em) }}
            </span>
            <UIcon
              name="i-lucide-chevron-right"
              class="size-5 shrink-0 text-dimmed"
              aria-hidden="true"
            />
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
