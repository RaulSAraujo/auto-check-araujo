<script setup lang="ts">
import type { OrderDetail } from '../types/orders'
import type { OrdemStatus } from '~~/shared/types/oficina'
import { ORDEM_STATUS_COLOR, ORDEM_STATUS_LABEL } from '~~/shared/types/oficina'

defineOptions({ name: 'OrdersDetailHero' })

const props = defineProps<{
  ordem: OrderDetail
  selectedStatus: string
  statusItems: readonly { label: string, value: string }[]
  savingStatus: boolean
  canEdit: boolean
}>()

const emit = defineEmits<{
  'update:selectedStatus': [value: string]
  back: []
}>()

const status = computed(() => props.ordem.status as OrdemStatus)
const vehicle = computed(() => props.ordem.veiculos)
const vehicleLabel = computed(() => {
  if (!vehicle.value) return null
  return [vehicle.value.marca, vehicle.value.modelo].filter(Boolean).join(' ') || null
})
const statusChanged = computed(() => props.selectedStatus !== props.ordem.status)
</script>

<template>
  <header class="orders-hero rounded-xl border border-default bg-default">
    <div class="border-b border-default px-5 py-5 sm:px-6 sm:py-6">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="min-w-0 space-y-1.5">
          <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <NuxtLink
              v-if="vehicle"
              :to="`/veiculos/${vehicle.id}`"
              class="font-mono text-3xl font-black tabular-nums tracking-tight text-highlighted transition-colors hover:text-primary"
              translate="no"
            >
              {{ formatPlaca(vehicle.placa) }}
            </NuxtLink>
            <h1
              class="font-mono text-lg font-semibold tabular-nums tracking-tight text-muted sm:text-xl"
              translate="no"
            >
              {{ ordem.numero || 'OS' }}
            </h1>
          </div>

          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span
              v-if="vehicleLabel"
              class="hidden sm:inline"
            >
              {{ vehicleLabel }}
            </span>
            <NuxtLink
              v-if="vehicle?.clientes"
              :to="`/clientes/${vehicle.clientes.id}`"
              class="text-primary hover:underline"
            >
              {{ vehicle.clientes.nome }}
            </NuxtLink>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <UBadge
            v-if="!canEdit"
            color="neutral"
            variant="subtle"
          >
            Somente leitura
          </UBadge>

          <template v-if="statusItems.length > 1">
            <USelect
              :model-value="selectedStatus"
              :items="[...statusItems]"
              class="w-40"
              :disabled="savingStatus"
              name="status"
              aria-label="Alterar status da OS"
              autocomplete="off"
              @update:model-value="emit('update:selectedStatus', String($event))"
            />
            <UBadge
              v-if="statusChanged"
              color="warning"
              variant="subtle"
              size="sm"
            >
              Pendente
            </UBadge>
          </template>
          <UBadge
            v-else
            :color="ORDEM_STATUS_COLOR[status]"
            variant="subtle"
            size="lg"
          >
            {{ ORDEM_STATUS_LABEL[status] }}
          </UBadge>

          <UButton
            color="neutral"
            variant="ghost"
            label="Voltar"
            icon="i-lucide-arrow-left"
            class="min-h-11 touch-manipulation"
            @click="emit('back')"
          />
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 divide-y divide-default sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      <div class="px-4 py-3 text-center sm:px-4">
        <p class="text-xs font-medium text-muted">
          Aberta em
        </p>
        <p class="mt-0.5 font-mono text-xs tabular-nums text-highlighted">
          {{ formatDateTime(ordem.aberta_em) }}
        </p>
      </div>
      <div class="px-4 py-3 text-center">
        <p class="text-xs font-medium text-muted">
          Aberta por
        </p>
        <p class="mt-0.5 text-xs text-highlighted">
          {{ ordem.profiles?.nome || '—' }}
        </p>
      </div>
      <div class="px-4 py-3 text-center">
        <p class="text-xs font-medium text-muted">
          Concluída em
        </p>
        <p class="mt-0.5 font-mono text-xs tabular-nums text-highlighted">
          {{ ordem.concluida_em ? formatDateTime(ordem.concluida_em) : '—' }}
        </p>
      </div>
    </div>
  </header>
</template>

<style scoped>
.orders-hero {
  animation: hero-in 280ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes hero-in {
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
  .orders-hero {
    animation: none;
  }
}
</style>
