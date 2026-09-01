<script setup lang="ts">
import type { OrdemStatus } from '~~/shared/types/oficina'
import { ORDER_LIST_COLUMNS } from '../utils/order-table-columns'
import { ORDER_ROUTES } from '../utils/order-routes'

defineOptions({ name: 'OrdersIndexPage' })

definePageMeta({
  path: '/ordens',
  layout: 'app'
})

const route = useRoute()

const {
  q,
  page,
  pageSize,
  total,
  statusFilter,
  statusItems,
  ordens,
  pending
} = await useOrdersList((route.query.status as OrdemStatus | undefined) || '')
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Ordens de serviço">
        <template #leading>
          <UDashboardSidebarToggle />
        </template>
        <template #right>
          <UButton
            :to="ORDER_ROUTES.new"
            icon="i-lucide-plus"
            label="Nova OS"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-4 sm:p-6 space-y-4">
        <div class="flex flex-col sm:flex-row gap-3 max-w-2xl">
          <UInput
            v-model="q"
            icon="i-lucide-search"
            placeholder="Buscar por número, placa ou reclamação"
            class="flex-1"
          />
          <USelect
            v-model="statusFilter"
            :items="[...statusItems]"
            class="sm:w-48"
          />
        </div>

        <UTable
          :data="ordens"
          :columns="ORDER_LIST_COLUMNS"
          :loading="pending"
          class="w-full"
        >
          <template #numero-cell="{ row }">
            <NuxtLink
              :to="ORDER_ROUTES.detail(row.original.id)"
              class="font-medium text-primary hover:underline"
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
              :color="ORDEM_STATUS_COLOR[row.original.status as OrdemStatus] || 'neutral'"
              variant="subtle"
            >
              {{ ORDEM_STATUS_LABEL[row.original.status as OrdemStatus] || row.original.status }}
            </UBadge>
          </template>

          <template #aberta_em-cell="{ row }">
            {{ formatDateTime(row.original.aberta_em) }}
          </template>

          <template #actions-cell="{ row }">
            <UButton
              :to="ORDER_ROUTES.detail(row.original.id)"
              icon="i-lucide-chevron-right"
              color="neutral"
              variant="ghost"
              size="sm"
            />
          </template>

          <template #empty>
            <div class="text-center py-8 text-muted">
              Nenhuma Ordem de Serviço encontrada.
            </div>
          </template>
        </UTable>

        <div
          v-if="total > pageSize"
          class="flex justify-center pt-2"
        >
          <UPagination
            v-model:page="page"
            :total="total"
            :items-per-page="pageSize"
            show-edges
            :sibling-count="1"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
