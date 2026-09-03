<script setup lang="ts">
import type { DashboardStatusCounts } from '../composables/useDashboardStats'
import {
  HOME_STATUS_ORDER,
  homeStatusCategories,
  type HomeActiveStatus
} from '../utils/home-chart-colors'
import { ORDEM_STATUS_LABEL } from '~~/shared/types/oficina'

defineOptions({ name: 'HomeOrdersStatusChart' })

const props = defineProps<{
  pending: boolean
  statusCounts: DashboardStatusCounts
  total: number
}>()

const colorMode = useColorMode()

const categories = computed(() =>
  homeStatusCategories(colorMode.value === 'dark')
)

const rows = computed(() =>
  HOME_STATUS_ORDER.map((status) => ({
    status,
    label: ORDEM_STATUS_LABEL[status],
    count: props.statusCounts[status],
    to: `${APP_ROUTES.orders}?status=${status}`,
    toneClass: statusToneClass(status)
  }))
)

function statusToneClass(status: HomeActiveStatus) {
  if (status === 'aberta') return 'text-primary'
  if (status === 'em_andamento') return 'text-warning'
  return 'text-error'
}
</script>

<template>
  <section
    class="home-block flex h-full min-h-0 flex-col"
    style="--home-stagger: 0"
    aria-labelledby="home-orders-heading"
  >
    <div class="mb-2 flex min-h-9 items-end justify-between gap-3">
      <h2
        id="home-orders-heading"
        class="text-sm font-semibold uppercase tracking-widest text-muted"
      >
        Ordens de serviço
      </h2>
      <UButton
        :to="APP_ROUTES.orders"
        label="Ver todas"
        variant="link"
        size="sm"
        color="primary"
        trailing-icon="i-lucide-arrow-right"
        class="font-medium"
      />
    </div>

    <ul class="flex max-h-72 min-h-48 flex-1 flex-col divide-y divide-default overflow-hidden rounded-lg border border-default bg-default shadow-sm dark:border-accented dark:bg-elevated dark:shadow-none">
      <template v-if="pending">
        <li
          v-for="n in 3"
          :key="n"
          class="flex flex-1 items-center px-4 py-3"
        >
          <USkeleton class="h-8 w-full" />
        </li>
      </template>

      <li
        v-else-if="total === 0"
        class="flex flex-1 items-center p-4"
      >
        <BaseEmptyState
          icon="i-lucide-clipboard-list"
          class="w-full border-0"
        >
          Nenhuma OS em aberto.
          <template #actions>
            <UButton
              :to="APP_ROUTES.ordersNew"
              label="Nova OS"
              color="primary"
              size="sm"
            />
          </template>
        </BaseEmptyState>
      </li>

      <template v-else>
        <li
          v-for="row in rows"
          :key="row.status"
          class="flex min-h-0 flex-1"
        >
          <NuxtLink
            :to="row.to"
            class="group flex min-h-12 w-full items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-elevated/60 focus-visible:bg-elevated/60 focus-visible:outline-none"
          >
            <span class="flex min-w-0 items-center gap-3">
              <span
                class="size-2.5 shrink-0 rounded-full"
                :style="{ backgroundColor: categories[row.status]?.color }"
                aria-hidden="true"
              />
              <span class="truncate text-sm font-medium text-highlighted sm:text-base">
                {{ row.label }}
              </span>
            </span>
            <span class="flex items-center gap-2">
              <span
                class="home-num text-2xl font-bold tabular-nums tracking-tight transition-transform group-hover:scale-105 sm:text-3xl"
                :class="row.toneClass"
              >
                {{ row.count }}
              </span>
              <UIcon
                name="i-lucide-chevron-right"
                class="size-5 shrink-0 text-dimmed"
                aria-hidden="true"
              />
            </span>
          </NuxtLink>
        </li>
      </template>
    </ul>
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

  .group:hover .home-num {
    transform: none;
  }
}
</style>
