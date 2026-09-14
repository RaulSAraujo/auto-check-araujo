<script setup lang="ts">
import type { OrdemStatus } from '~~/shared/types/oficina'
import { ORDER_ROUTES } from '../utils/order-routes'
import { ORDEM_STATUS_FILTER_ALL } from '../utils/order-select-items'

defineOptions({ name: 'OrdersIndexPage' })

definePageMeta({
  path: '/ordens'
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
} = await useOrdersList((route.query.status as OrdemStatus | undefined) ?? ORDEM_STATUS_FILTER_ALL)

const { can } = usePermissions()
</script>

<template>
  <UDashboardPanel>
    <template #body>
      <div class="p-4 sm:p-6 space-y-4">
        <BasePageHeader
          title="Ordens de Serviço Digitais"
          description="Controle completo da operação da oficina."
        >
          <template #actions>
            <UButton
              v-if="can('orders.create')"
              :to="ORDER_ROUTES.new"
              icon="i-lucide-plus"
              label="Nova OS"
              class="w-full justify-center sm:w-auto"
            />
          </template>
        </BasePageHeader>

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

        <OrdersTable
          :ordens="ordens"
          :loading="pending"
        />

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
