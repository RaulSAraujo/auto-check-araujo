<script setup lang="ts">
import type { SalesSummary } from '../utils/sales'
import { formatMoney } from '~~/shared/utils/money'

defineOptions({ name: 'SalesStatusStrip' })

defineProps<{
  summary: SalesSummary
  loading?: boolean
}>()
</script>

<template>
  <div
    class="overflow-hidden rounded-md border border-default bg-default shadow-sm divide-y divide-default"
    aria-labelledby="sales-status-heading"
  >
    <div class="px-4 py-3">
      <h2
        id="sales-status-heading"
        class="text-xs font-semibold uppercase tracking-wide text-muted"
      >
        Status
      </h2>
    </div>

    <div class="flex items-center justify-between gap-3 px-4 py-3.5">
      <div class="flex items-center gap-2 min-w-0">
        <span
          class="size-2 shrink-0 rounded-full bg-success"
          aria-hidden="true"
        />
        <div class="min-w-0">
          <p class="text-sm text-highlighted">
            Pago
          </p>
          <p class="text-xs text-muted font-mono tabular-nums">
            <USkeleton
              v-if="loading"
              class="inline-block h-3 w-8"
            />
            <span v-else>{{ summary.qtdPago }} OS</span>
          </p>
        </div>
      </div>
      <p class="shrink-0 text-sm font-semibold font-mono tabular-nums text-success">
        <USkeleton
          v-if="loading"
          class="h-5 w-20"
        />
        <span v-else>{{ formatMoney(summary.totalPago) }}</span>
      </p>
    </div>

    <div class="flex items-center justify-between gap-3 px-4 py-3.5">
      <div class="flex items-center gap-2 min-w-0">
        <span
          class="size-2 shrink-0 rounded-full bg-warning"
          aria-hidden="true"
        />
        <div class="min-w-0">
          <p class="text-sm text-highlighted">
            Pendente
          </p>
          <p class="text-xs text-muted font-mono tabular-nums">
            <USkeleton
              v-if="loading"
              class="inline-block h-3 w-8"
            />
            <span v-else>{{ summary.qtdPendente }} OS</span>
          </p>
        </div>
      </div>
      <p class="shrink-0 text-sm font-semibold font-mono tabular-nums text-warning">
        <USkeleton
          v-if="loading"
          class="h-5 w-20"
        />
        <span v-else>{{ formatMoney(summary.totalPendente) }}</span>
      </p>
    </div>
  </div>
</template>
