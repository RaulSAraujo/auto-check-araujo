<script setup lang="ts">
import type { SalesCollaboratorRow } from '../utils/sales'
import { formatMoney } from '~~/shared/utils/money'

defineOptions({ name: 'SalesCollaboratorsRanking' })

defineProps<{
  collaborators: SalesCollaboratorRow[]
  loading?: boolean
}>()
</script>

<template>
  <section
    class="overflow-hidden rounded-lg border border-default bg-default shadow-sm"
    aria-labelledby="sales-collaborators-heading"
  >
    <div class="border-b border-default px-4 py-3">
      <h2
        id="sales-collaborators-heading"
        class="text-xs font-semibold uppercase tracking-wide text-muted"
      >
        Colaboradores
      </h2>
      <p class="mt-0.5 text-sm text-muted">
        Ranking por faturamento
      </p>
    </div>

    <div
      v-if="loading"
      class="divide-y divide-default"
    >
      <div
        v-for="i in 3"
        :key="i"
        class="space-y-2 px-4 py-3.5"
      >
        <USkeleton class="h-4 w-32" />
        <USkeleton class="h-3 w-48" />
      </div>
    </div>

    <ul
      v-else-if="collaborators.length"
      class="divide-y divide-default"
    >
      <li
        v-for="(row, index) in collaborators"
        :key="row.id"
        class="flex items-start justify-between gap-3 px-4 py-3.5"
      >
        <div class="min-w-0">
          <p class="text-sm font-medium text-highlighted truncate">
            <span class="font-mono tabular-nums text-muted">{{ index + 1 }}.</span>
            {{ row.nome }}
          </p>
          <p class="mt-0.5 text-xs text-muted font-mono tabular-nums">
            {{ row.qtdOs }} OS · TM {{ formatMoney(row.ticketMedio) }} · Com {{ formatMoney(row.comissao) }}
          </p>
        </div>
        <p class="shrink-0 text-sm font-semibold font-mono tabular-nums text-highlighted">
          {{ formatMoney(row.totalFaturado) }}
        </p>
      </li>
    </ul>

    <div
      v-else
      class="px-4 py-8"
    >
      <BaseEmptyState icon="i-lucide-users">
        Nenhum colaborador com vendas no período.
      </BaseEmptyState>
    </div>
  </section>
</template>
