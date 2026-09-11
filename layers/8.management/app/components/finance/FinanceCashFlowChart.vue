<script setup lang="ts">
import { formatMoney } from '~~/shared/utils/money'
import type { CashFlowRow } from '../../composables/useFinanceCashFlow'
import { financeCashFlowCategories } from '../../utils/finance-chart-colors'

defineOptions({ name: 'FinanceCashFlowChart' })

const props = defineProps<{
  data: CashFlowRow[]
  loading?: boolean
}>()

const colorMode = useColorMode()

/** Entradas + saídas only — saldo is entradas − saídas (redundant third bar + negatives break the scale). */
const chartData = computed(() =>
  props.data.map(row => ({
    month: row.mes_label,
    entradas: row.entradas,
    saidas: row.saidas,
    saldo: row.saldo
  }))
)

const categories = computed(() => {
  const all = financeCashFlowCategories(colorMode.value === 'dark')
  return {
    entradas: all.entradas,
    saidas: all.saidas
  }
})

const xFormatter = (index: number) => chartData.value[index]?.month ?? ''

const yFormatter = (value: number | Date) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return ''
  if (Math.abs(n) >= 1000) {
    return `R$ ${(n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`
  }
  return `R$ ${n.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
}

const tooltipTitleFormatter = (row: { month?: string }) => row.month ?? ''
</script>

<template>
  <section aria-labelledby="finance-cashflow-heading">
    <h2
      id="finance-cashflow-heading"
      class="mb-2 text-sm font-semibold uppercase tracking-widest text-muted"
    >
      Fluxo de caixa · 6 meses
    </h2>

    <div
      v-if="loading"
      class="h-72 w-full overflow-hidden rounded-lg border border-default bg-default shadow-sm dark:border-accented dark:bg-elevated dark:shadow-none"
    >
      <USkeleton class="h-full w-full rounded-none" />
    </div>

    <div
      v-else-if="!data.length"
      class="flex h-72 items-center justify-center rounded-lg border border-default bg-default shadow-sm dark:border-accented dark:bg-elevated dark:shadow-none"
    >
      <BaseEmptyState icon="i-lucide-chart-column">
        Sem dados suficientes para o gráfico.
      </BaseEmptyState>
    </div>

    <div
      v-else
      class="finance-cashflow-chart overflow-hidden rounded-lg border border-default bg-default p-3 shadow-sm sm:p-4 dark:border-accented dark:bg-elevated dark:shadow-none"
      role="img"
      :aria-label="'Fluxo de caixa dos últimos 6 meses'"
    >
      <ClientOnly>
        <BarChart
          :data="chartData"
          :categories="categories"
          :height="220"
          :y-axis="['entradas', 'saidas']"
          x-axis="month"
          :x-formatter="xFormatter"
          :y-formatter="yFormatter"
          :tooltip-title-formatter="tooltipTitleFormatter"
          :padding="{ top: 8, right: 8, bottom: 28, left: 52 }"
          :radius="4"
          :y-num-ticks="4"
          :x-num-ticks="6"
          :bar-padding="0.25"
          :y-grid-line="true"
          :x-grid-line="false"
          :x-tick-line="false"
          :y-tick-line="false"
          :duration="400"
        >
          <template #tooltip="{ values }">
            <div
              v-if="values"
              class="space-y-1.5 p-1 text-sm"
            >
              <p class="font-semibold text-highlighted">
                {{ values.month }}
              </p>
              <p class="flex justify-between gap-6 tabular-nums">
                <span class="text-muted">Entradas</span>
                <span>{{ formatMoney(Number(values.entradas)) }}</span>
              </p>
              <p class="flex justify-between gap-6 tabular-nums">
                <span class="text-muted">Saídas</span>
                <span>{{ formatMoney(Number(values.saidas)) }}</span>
              </p>
              <p class="flex justify-between gap-6 border-t border-default pt-1.5 tabular-nums">
                <span class="text-muted">Saldo</span>
                <span class="font-semibold">{{ formatMoney(Number(values.saldo)) }}</span>
              </p>
            </div>
          </template>
        </BarChart>
        <template #fallback>
          <USkeleton class="h-56 w-full" />
        </template>
      </ClientOnly>
    </div>
  </section>
</template>

<style scoped>
/*
 * Unovis dark theme only listens for html[data-theme=dark] / .dark-theme —
 * Nuxt color-mode uses .dark. Force readable axis + tooltip tokens here.
 */
.finance-cashflow-chart {
  --vis-axis-tick-label-color: var(--ui-text-muted);
  --vis-axis-grid-color: var(--ui-border);
  --vis-axis-tick-color: var(--ui-border);
  --vis-tooltip-background-color: var(--ui-bg-elevated);
  --vis-tooltip-text-color: var(--ui-text-highlighted);
  --vis-tooltip-border-color: var(--ui-border);
  --vis-tooltip-padding: 8px 10px;
  --vis-legend-label-color: var(--ui-text-muted);
}
</style>
