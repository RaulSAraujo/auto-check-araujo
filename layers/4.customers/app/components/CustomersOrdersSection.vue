<script setup lang="ts">
import type { OrdemStatus } from '~~/shared/types/oficina'
import type { CustomerOrderItem } from '../utils/customer-table-columns'
import { CUSTOMER_ORDER_COLUMNS } from '../utils/customer-table-columns'

defineOptions({ name: 'CustomersOrdersSection' })

const page = defineModel<number>('page', { default: 1 })

defineProps<{
  ordens: CustomerOrderItem[]
  total?: number
  pageSize?: number
  loading?: boolean
}>()
</script>

<template>
  <section class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-sm font-semibold uppercase tracking-widest text-muted">
        Histórico de OS
      </h2>
      <p
        v-if="total"
        class="font-mono text-xs tabular-nums text-muted"
      >
        {{ total }} {{ total === 1 ? 'ordem' : 'ordens' }}
      </p>
    </div>

    <div class="space-y-2 md:hidden">
      <template v-if="loading">
        <USkeleton
          v-for="n in 3"
          :key="n"
          class="h-24 w-full rounded-xl"
        />
      </template>

      <template v-else-if="ordens.length">
        <NuxtLink
          v-for="ordem in ordens"
          :key="ordem.id"
          :to="`/ordens/${ordem.id}`"
          class="group block min-h-24 rounded-xl bg-elevated/40 px-3 py-3 ring-1 ring-default/70 transition-colors active:bg-elevated"
        >
          <span class="flex items-center justify-between gap-3">
            <span class="font-mono font-semibold tabular-nums text-primary">{{ ordem.numero }}</span>
            <UBadge
              :color="ORDEM_STATUS_COLOR[ordem.status as OrdemStatus]"
              variant="subtle"
              size="sm"
              class="shrink-0"
            >
              {{ ORDEM_STATUS_LABEL[ordem.status as OrdemStatus] }}
            </UBadge>
          </span>
          <span class="mt-2 flex items-center justify-between gap-3 text-sm text-muted">
            <span class="font-mono truncate tracking-wide">{{ ordem.veiculos ? formatPlaca(ordem.veiculos.placa) : '—' }}</span>
            <UIcon
              name="i-lucide-chevron-right"
              class="size-5 shrink-0 text-dimmed transition-transform group-active:translate-x-0.5"
            />
          </span>
          <span class="mt-1 block font-mono text-xs tabular-nums text-muted">{{ formatDateTime(ordem.aberta_em) }}</span>
        </NuxtLink>
      </template>

      <BaseEmptyState
        v-else
        icon="i-lucide-clipboard-list"
      >
        Nenhuma OS neste cliente.
      </BaseEmptyState>
    </div>

    <UTable
      :data="ordens"
      :columns="CUSTOMER_ORDER_COLUMNS"
      :loading="loading"
      class="hidden w-full md:block"
    >
      <template #numero-cell="{ row }">
        <NuxtLink
          :to="`/ordens/${row.original.id}`"
          class="font-mono font-medium tabular-nums text-primary hover:underline"
        >
          {{ row.original.numero }}
        </NuxtLink>
      </template>

      <template #placa-cell="{ row }">
        <span class="font-mono tracking-wide">
          {{ row.original.veiculos ? formatPlaca(row.original.veiculos.placa) : '—' }}
        </span>
      </template>

      <template #status-cell="{ row }">
        <UBadge
          :color="ORDEM_STATUS_COLOR[row.original.status as OrdemStatus]"
          variant="subtle"
        >
          {{ ORDEM_STATUS_LABEL[row.original.status as OrdemStatus] }}
        </UBadge>
      </template>

      <template #aberta_em-cell="{ row }">
        <span class="font-mono tabular-nums">
          {{ formatDateTime(row.original.aberta_em) }}
        </span>
      </template>

      <template #actions-cell="{ row }">
        <UButton
          :to="`/ordens/${row.original.id}`"
          icon="i-lucide-chevron-right"
          color="neutral"
          variant="ghost"
          size="sm"
          class="motion-safe:active:scale-[0.98]"
          :aria-label="`Abrir ${row.original.numero}`"
        />
      </template>

      <template #empty>
        <BaseEmptyState icon="i-lucide-clipboard-list">
          Nenhuma OS neste cliente.
        </BaseEmptyState>
      </template>
    </UTable>

    <div
      v-if="total && pageSize && total > pageSize"
      class="flex justify-center pt-1"
    >
      <UPagination
        v-model:page="page"
        :total="total"
        :items-per-page="pageSize"
        show-edges
        :sibling-count="1"
      />
    </div>
  </section>
</template>
