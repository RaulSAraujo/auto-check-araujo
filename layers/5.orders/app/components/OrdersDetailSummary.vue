<script setup lang="ts">
import type { OrderDetail } from '../types/orders'
import type { OrdemStatus } from '~~/shared/types/oficina'

defineProps<{
  ordem: OrderDetail
  hideFields?: boolean
}>()
</script>

<template>
  <div class="overflow-hidden rounded-md border border-default bg-elevated/25">
    <div class="flex flex-wrap items-center gap-3 border-b border-default px-4 py-3">
      <UBadge
        :color="ORDEM_STATUS_COLOR[ordem.status as OrdemStatus]"
        variant="subtle"
        size="lg"
      >
        {{ ORDEM_STATUS_LABEL[ordem.status as OrdemStatus] }}
      </UBadge>
      <span class="font-mono text-sm tabular-nums text-muted">
        Aberta em {{ formatDateTime(ordem.aberta_em) }}
      </span>
    </div>

    <dl class="grid gap-px bg-default sm:grid-cols-2">
      <div class="bg-elevated/25 px-4 py-3">
        <dt class="text-sm text-muted">
          Veículo
        </dt>
        <dd class="mt-1">
          <NuxtLink
            v-if="ordem.veiculos"
            :to="`/veiculos/${ordem.veiculos.id}`"
            class="font-mono text-primary hover:underline"
          >
            {{ formatPlaca(ordem.veiculos.placa) }}
          </NuxtLink>
          <p
            v-if="ordem.veiculos"
            class="mt-0.5 text-sm text-muted"
          >
            {{ [ordem.veiculos.marca, ordem.veiculos.modelo].filter(Boolean).join(' ') || EMPTY_VALUE }}
            <template v-if="ordem.veiculos.clientes">
              ·
              <NuxtLink
                :to="`/clientes/${ordem.veiculos.clientes.id}`"
                class="text-primary hover:underline"
              >
                {{ ordem.veiculos.clientes.nome }}
              </NuxtLink>
            </template>
          </p>
        </dd>
      </div>

      <div class="bg-elevated/25 px-4 py-3">
        <dt class="text-sm text-muted">
          Aberta por
        </dt>
        <dd class="mt-1 text-highlighted">
          {{ ordem.profiles?.nome || EMPTY_VALUE }}
        </dd>
      </div>

      <template v-if="!hideFields">
        <div
          v-if="ordem.km_entrada != null"
          class="bg-elevated/25 px-4 py-3"
        >
          <dt class="text-sm text-muted">
            Km de entrada
          </dt>
          <dd class="mt-1 font-mono tabular-nums text-highlighted">
            {{ ordem.km_entrada.toLocaleString('pt-BR') }}
          </dd>
        </div>

        <div
          class="bg-elevated/25 px-4 py-3"
          :class="ordem.km_entrada != null ? 'sm:col-span-2' : 'sm:col-span-2'"
        >
          <dt class="text-sm text-muted">
            Reclamação
          </dt>
          <dd class="mt-1 whitespace-pre-wrap text-highlighted">
            {{ ordem.reclamacao || EMPTY_VALUE }}
          </dd>
        </div>

        <div
          v-if="ordem.observacoes"
          class="bg-elevated/25 px-4 py-3 sm:col-span-2"
        >
          <dt class="text-sm text-muted">
            Observações
          </dt>
          <dd class="mt-1 whitespace-pre-wrap text-highlighted">
            {{ ordem.observacoes }}
          </dd>
        </div>
      </template>
    </dl>
  </div>
</template>
