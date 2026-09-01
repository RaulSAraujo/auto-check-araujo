<script setup lang="ts">
import type { OrderDetail } from '../types/orders'
import type { OrdemStatus } from '~~/shared/types/oficina'

defineProps<{
  ordem: OrderDetail
  hideFields?: boolean
}>()
</script>

<template>
  <section class="space-y-4">
    <div class="flex flex-wrap items-center gap-3">
      <UBadge
        :color="ORDEM_STATUS_COLOR[ordem.status as OrdemStatus]"
        variant="subtle"
        size="lg"
      >
        {{ ORDEM_STATUS_LABEL[ordem.status as OrdemStatus] }}
      </UBadge>
      <span class="text-sm text-muted">
        Aberta em {{ formatDateTime(ordem.aberta_em) }}
      </span>
    </div>

    <div class="grid gap-3 text-sm">
      <div>
        <p class="text-muted">
          Veículo
        </p>
        <NuxtLink
          v-if="ordem.veiculos"
          :to="`/veiculos/${ordem.veiculos.id}`"
          class="font-mono text-primary hover:underline"
        >
          {{ formatPlaca(ordem.veiculos.placa) }}
        </NuxtLink>
        <p
          v-if="ordem.veiculos"
          class="text-muted"
        >
          {{ [ordem.veiculos.marca, ordem.veiculos.modelo].filter(Boolean).join(' ') || '—' }}
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
      </div>

      <div>
        <p class="text-muted">
          Aberta por
        </p>
        <p class="text-highlighted">
          {{ ordem.profiles?.nome || '—' }}
        </p>
      </div>

      <template v-if="!hideFields">
        <div v-if="ordem.km_entrada != null">
          <p class="text-muted">
            Km de entrada
          </p>
          <p class="text-highlighted">
            {{ ordem.km_entrada.toLocaleString('pt-BR') }}
          </p>
        </div>

        <div>
          <p class="text-muted">
            Reclamação
          </p>
          <p class="text-highlighted whitespace-pre-wrap">
            {{ ordem.reclamacao || '—' }}
          </p>
        </div>

        <div v-if="ordem.observacoes">
          <p class="text-muted">
            Observações
          </p>
          <p class="text-highlighted whitespace-pre-wrap">
            {{ ordem.observacoes }}
          </p>
        </div>
      </template>
    </div>
  </section>
</template>
