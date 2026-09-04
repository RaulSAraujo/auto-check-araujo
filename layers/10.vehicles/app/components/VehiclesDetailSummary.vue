<script setup lang="ts">
import type { VeiculoComCliente } from '../utils/vehicle-types'
import { VEHICLE_ROUTES } from '../utils/vehicle-routes'
import { formatPlacaInput } from '../utils/vehicle-form'

defineOptions({ name: 'VehiclesDetailSummary' })

const { veiculo } = defineProps<{
  veiculo: VeiculoComCliente
}>()

const plate = computed(() => formatPlacaInput(veiculo.placa))

const brandModel = computed(() => {
  const parts = [veiculo.marca, veiculo.modelo].filter(Boolean)
  return parts.length ? parts.join(' ') : null
})

const kmLabel = computed(() => {
  if (veiculo.km_atual == null) return null
  return new Intl.NumberFormat('pt-BR').format(veiculo.km_atual)
})

const hasNotes = computed(() => Boolean(veiculo.observacoes?.trim()))
</script>

<template>
  <section
    class="vehicles-detail-summary scroll-mt-28 rounded-lg border border-default bg-default p-4 shadow-sm dark:shadow-none sm:p-5"
    aria-labelledby="vehicle-data-heading"
  >
    <h2
      id="vehicle-data-heading"
      class="text-sm font-semibold uppercase tracking-widest text-muted"
    >
      Dados do veículo
    </h2>

    <dl class="mt-4 divide-y divide-default">
      <div class="flex flex-col gap-1 py-3 first:pt-0 sm:flex-row sm:items-baseline sm:gap-6">
        <dt class="shrink-0 text-sm text-muted sm:w-28">
          Placa
        </dt>
        <dd
          class="min-w-0 font-mono text-sm font-medium tabular-nums text-highlighted"
          translate="no"
        >
          {{ plate }}
        </dd>
      </div>

      <div class="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:gap-6">
        <dt class="shrink-0 text-sm text-muted sm:w-28">
          Proprietário
        </dt>
        <dd class="min-w-0 text-sm break-words">
          <NuxtLink
            v-if="veiculo.clientes"
            :to="VEHICLE_ROUTES.customerDetail(veiculo.clientes.id)"
            class="font-medium text-primary underline-offset-2 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {{ veiculo.clientes.nome }}
          </NuxtLink>
          <span
            v-else
            class="text-muted"
          >Não informado</span>
        </dd>
      </div>

      <div class="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:gap-6">
        <dt class="shrink-0 text-sm text-muted sm:w-28">
          Marca / modelo
        </dt>
        <dd
          class="min-w-0 text-sm break-words"
          :class="brandModel ? 'text-highlighted' : 'text-muted'"
        >
          {{ brandModel || 'Não informado' }}
        </dd>
      </div>

      <div class="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:gap-6">
        <dt class="shrink-0 text-sm text-muted sm:w-28">
          Ano
        </dt>
        <dd
          class="min-w-0 text-sm"
          :class="veiculo.ano != null
            ? 'font-mono tabular-nums text-highlighted'
            : 'text-muted'"
        >
          {{ veiculo.ano ?? 'Não informado' }}
        </dd>
      </div>

      <div class="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:gap-6">
        <dt class="shrink-0 text-sm text-muted sm:w-28">
          Cor
        </dt>
        <dd
          class="min-w-0 text-sm break-words"
          :class="veiculo.cor?.trim() ? 'text-highlighted' : 'text-muted'"
        >
          {{ veiculo.cor?.trim() || 'Não informado' }}
        </dd>
      </div>

      <div class="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:gap-6">
        <dt class="shrink-0 text-sm text-muted sm:w-28">
          KM atual
        </dt>
        <dd
          class="min-w-0 text-sm"
          :class="kmLabel
            ? 'font-mono tabular-nums text-highlighted'
            : 'text-muted'"
        >
          {{ kmLabel || 'Não informado' }}
        </dd>
      </div>

      <div
        v-if="hasNotes"
        class="flex flex-col gap-1 py-3 last:pb-0 sm:flex-row sm:items-baseline sm:gap-6"
      >
        <dt class="shrink-0 text-sm text-muted sm:w-28">
          Observações
        </dt>
        <dd class="min-w-0 text-sm text-pretty text-highlighted break-words whitespace-pre-wrap">
          {{ veiculo.observacoes }}
        </dd>
      </div>
    </dl>
  </section>
</template>

<style scoped>
.vehicles-detail-summary {
  animation: vehicles-summary-rise 280ms var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1)) both;
}

@keyframes vehicles-summary-rise {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .vehicles-detail-summary {
    animation: none;
  }
}
</style>
