<script setup lang="ts">
import type { CustomerStatusFilter } from '../utils/customer-status'
import { CUSTOMER_STATUS_FILTER_ACTIVE } from '../utils/customer-status'

defineOptions({ name: 'CustomersIndexPage' })

definePageMeta({
  path: '/clientes'
})

const route = useRoute()

const {
  q,
  page,
  pageSize,
  total,
  statusFilter,
  statusItems,
  clientes,
  pending
} = await useCustomersList(
  (route.query.status as CustomerStatusFilter | undefined) ?? CUSTOMER_STATUS_FILTER_ACTIVE
)

const { can } = usePermissions()
</script>

<template>
  <UDashboardPanel>
    <template #body>
      <div class="p-4 sm:p-6 space-y-4">
        <BasePageHeader title="Clientes">
          <template #actions>
            <UButton
              v-if="can('customers.write')"
              :to="CUSTOMER_ROUTES.new"
              icon="i-lucide-plus"
              label="Novo cliente"
            />
          </template>
        </BasePageHeader>

        <div class="flex flex-col sm:flex-row gap-3 max-w-2xl">
          <UInput
            v-model="q"
            icon="i-lucide-search"
            placeholder="Buscar por nome, telefone, documento ou e-mail"
            class="flex-1"
          />
          <USelect
            v-model="statusFilter"
            :items="[...statusItems]"
            class="sm:w-40"
          />
        </div>

        <CustomersTable
          :clientes="clientes"
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
