<script setup lang="ts">
import { formatMoney } from '~~/shared/utils/money'
import type { DashboardDayPoint } from '../composables/useDashboardStats'
import { homePrimaryHex } from '../utils/home-chart-colors'

defineOptions({ name: 'HomeWeeklyChart' })

const props = defineProps<{
  pending: boolean
  weeklyTrend: DashboardDayPoint[]
  totalCount: number
  totalRevenue: number
}>()

const colorMode = useColorMode()
const { duration } = useHomeChartMotion()

const chartData = computed(() =>
  props.weeklyTrend.map(point => ({
    day: point.label,
    count: point.count
  }))
)

const categories = computed(() => ({
  count: {
    name: 'Concluídas',
    color: homePrimaryHex(colorMode.value === 'dark')
  }
}))

const xFormatter = (index: number) => chartData.value[index]?.day ?? ''

const yFormatter = (value: number) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value)
</script>

<template>
  <section
    class="home-block"
    style="--home-stagger: 1"
    aria-labelledby="home-weekly-heading"
  >
    <div class="mb-2 flex min-h-9 items-end justify-between gap-3">
      <div class="min-w-0">
        <h2
          id="home-weekly-heading"
          class="text-sm font-semibold uppercase tracking-widest text-muted"
        >
          Concluídas · 7 dias
        </h2>
        <p
          v-if="!pending"
          class="mt-0.5 text-sm text-muted"
        >
          <span class="home-num font-semibold tabular-nums text-highlighted">{{ totalCount }}</span>
          OS ·
          <span class="home-num font-semibold tabular-nums text-highlighted">{{ formatMoney(totalRevenue) }}</span>
        </p>
      </div>
      <UButton
        :to="`${APP_ROUTES.orders}?status=concluida`"
        label="Ver concluídas"
        variant="link"
        size="sm"
        color="primary"
        trailing-icon="i-lucide-arrow-right"
        class="font-medium"
      />
    </div>

    <div class="overflow-hidden rounded-lg border border-default bg-default shadow-sm dark:border-accented dark:bg-elevated dark:shadow-none">
      <div
        v-if="pending"
        class="p-4 sm:p-5"
      >
        <USkeleton class="h-56 w-full" />
      </div>

      <BaseEmptyState
        v-else-if="totalCount === 0"
        icon="i-lucide-check-circle"
        class="m-4"
      >
        Nenhuma OS concluída nos últimos 7 dias.
        <template #actions>
          <UButton
            :to="APP_ROUTES.orders"
            label="Ver ordens"
            color="primary"
            variant="soft"
            size="sm"
          />
        </template>
      </BaseEmptyState>

      <template v-else>
        <div class="p-4 sm:hidden">
          <p class="text-sm text-muted">
            {{ totalCount === 1 ? '1 OS concluída' : `${totalCount} OS concluídas` }} nos últimos 7 dias.
          </p>
          <p class="mt-1 home-num text-lg font-bold tabular-nums text-highlighted">
            {{ formatMoney(totalRevenue) }}
          </p>
        </div>

        <div
          class="hidden p-3 sm:block sm:p-4"
          role="img"
          :aria-label="`${totalCount} ordens concluídas nos últimos 7 dias`"
        >
          <ClientOnly>
            <BarChart
              :data="chartData"
              :categories="categories"
              :height="200"
              :y-axis="['count']"
              x-axis="day"
              :x-formatter="xFormatter"
              :y-formatter="yFormatter"
              :duration="duration"
              :hide-legend="true"
              :radius="4"
              :y-num-ticks="4"
              :x-num-ticks="7"
              :bar-padding="0.2"
              :y-grid-line="true"
              :x-grid-line="false"
              :x-tick-line="false"
              :y-tick-line="false"
            />
            <template #fallback>
              <USkeleton class="h-56 w-full" />
            </template>
          </ClientOnly>
        </div>
      </template>
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
