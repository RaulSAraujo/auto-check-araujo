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
}>()

const emit = defineEmits<{
  'update:selectedStatus': [value: string]
  saveStatus: []
}>()

const route = useRoute()
const id = computed(() => route.params.id as string)
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
    <div class="relative overflow-hidden rounded-t-xl border-b border-default bg-linear-to-br from-primary/8 via-transparent to-transparent px-5 py-5 sm:px-6 sm:py-6">
      <div
        class="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-primary/6 blur-3xl"
        aria-hidden="true"
      />

      <div class="relative flex flex-wrap items-start justify-between gap-4">
        <div class="min-w-0 space-y-1.5">
          <NuxtLink
            v-if="vehicle"
            :to="`/veiculos/${vehicle.id}`"
            class="font-mono text-3xl font-black tabular-nums tracking-tight text-highlighted transition-colors hover:text-primary"
            translate="no"
          >
            {{ formatPlaca(vehicle.placa) }}
          </NuxtLink>

          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span
              class="font-mono text-xs tabular-nums"
              translate="no"
            >
              {{ ordem.numero || 'OS' }}
            </span>
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

        <div
          v-if="statusItems.length > 1"
          class="flex items-center gap-2"
        >
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
          <Transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="scale-90 opacity-0"
            enter-to-class="scale-100 opacity-100"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="scale-100 opacity-100"
            leave-to-class="scale-90 opacity-0"
          >
            <UButton
              v-if="statusChanged"
              label="Aplicar"
              size="sm"
              :loading="savingStatus"
              @click="emit('saveStatus')"
            />
          </Transition>
        </div>
        <UBadge
          v-else
          :color="ORDEM_STATUS_COLOR[status]"
          variant="subtle"
          size="lg"
        >
          {{ ORDEM_STATUS_LABEL[status] }}
        </UBadge>
      </div>
    </div>

    <div class="grid grid-cols-4 divide-x divide-default px-1">
      <div class="px-4 py-3 text-center">
        <p class="text-[11px] font-medium uppercase tracking-widest text-muted">
          Aberta em
        </p>
        <p class="mt-0.5 font-mono text-xs tabular-nums text-highlighted">
          {{ formatDateTime(ordem.aberta_em) }}
        </p>
      </div>
      <div class="px-4 py-3 text-center">
        <p class="text-[11px] font-medium uppercase tracking-widest text-muted">
          Aberta por
        </p>
        <p class="mt-0.5 text-xs text-highlighted">
          {{ ordem.profiles?.nome || '—' }}
        </p>
      </div>
      <div class="px-4 py-3 text-center">
        <p class="text-[11px] font-medium uppercase tracking-widest text-muted">
          Km entrada
        </p>
        <p class="mt-0.5 font-mono text-xs tabular-nums text-highlighted">
          {{ ordem.km_entrada != null ? new Intl.NumberFormat('pt-BR').format(ordem.km_entrada) : '—' }}
        </p>
      </div>
      <div class="px-4 py-3 text-center">
        <p class="text-[11px] font-medium uppercase tracking-widest text-muted">
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
