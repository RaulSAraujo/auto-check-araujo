<script setup lang="ts">
import type { TeamIndicators } from '../composables/useTeamHr'

defineOptions({ name: 'AuthTeamIndicatorsSection' })

defineProps<{
  indicators: TeamIndicators | null
  pending?: boolean
}>()

function formatPct(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return '—'
  return `${value}%`
}
</script>

<template>
  <div class="space-y-6">
    <div
      v-if="pending && !indicators"
      class="grid gap-2 sm:grid-cols-3"
    >
      <USkeleton class="h-24 w-full" />
      <USkeleton class="h-24 w-full" />
      <USkeleton class="h-24 w-full" />
    </div>

    <template v-else-if="indicators">
      <div class="overflow-hidden rounded-lg border border-default">
        <div class="grid gap-px bg-default sm:grid-cols-3">
          <div class="bg-default px-4 py-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-muted">
              OS concluídas
            </p>
            <p class="mt-1 font-mono text-3xl tabular-nums text-highlighted">
              {{ indicators.os_concluidas }}
            </p>
          </div>
          <div class="bg-default px-4 py-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-muted">
              Taxa de presença
            </p>
            <p class="mt-1 font-mono text-3xl tabular-nums text-highlighted">
              {{ formatPct(indicators.taxa_presenca) }}
            </p>
          </div>
          <div class="bg-default px-4 py-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-muted">
              Faltas no mês
            </p>
            <p class="mt-1 font-mono text-3xl tabular-nums text-highlighted">
              {{ indicators.faltas }}
            </p>
          </div>
        </div>
      </div>

      <section class="space-y-4">
        <h2 class="text-lg font-semibold text-highlighted">
          Por colaborador
        </h2>

        <div
          v-if="indicators.por_colaborador.length"
          class="overflow-x-auto rounded-lg border border-default"
        >
          <table class="w-full text-sm">
            <thead class="border-b border-default bg-elevated/50 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th class="px-3 py-2 font-medium">
                  Nome
                </th>
                <th class="px-3 py-2 font-medium">
                  OS concluídas
                </th>
                <th class="px-3 py-2 font-medium">
                  Presença %
                </th>
                <th class="px-3 py-2 font-medium">
                  Faltas
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in indicators.por_colaborador"
                :key="row.id"
                class="border-b border-default last:border-0"
              >
                <td class="px-3 py-2">
                  {{ row.nome }}
                </td>
                <td class="px-3 py-2 font-mono tabular-nums">
                  {{ row.os_concluidas }}
                </td>
                <td class="px-3 py-2 font-mono tabular-nums">
                  {{ formatPct(row.presenca_pct) }}
                </td>
                <td class="px-3 py-2 font-mono tabular-nums">
                  {{ row.faltas }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <BaseEmptyState
          v-else
          icon="i-lucide-gauge"
        >
          Sem dados no período.
        </BaseEmptyState>
      </section>
    </template>

    <BaseEmptyState
      v-else
      icon="i-lucide-gauge"
    >
      Sem dados no período.
    </BaseEmptyState>
  </div>
</template>
