<script setup lang="ts">
import type { Cliente } from '~~/shared/types/database'
import { formatContactList } from '~~/shared/utils/contact'
import { CUSTOMER_LIST_COLUMNS } from '../utils/customer-table-columns'
import { CUSTOMER_ROUTES } from '../utils/customer-routes'

defineOptions({ name: 'CustomersTable' })

defineProps<{
  clientes: Cliente[]
  loading?: boolean
}>()
</script>

<template>
  <UTable
    :data="clientes"
    :columns="CUSTOMER_LIST_COLUMNS"
    :loading="loading"
    class="w-full"
  >
    <template #telefones-cell="{ row }">
      <span class="text-sm">
        {{ formatContactList(row.original.telefones) }}
      </span>
    </template>

    <template #emails-cell="{ row }">
      <span class="text-sm">
        {{ formatContactList(row.original.emails) }}
      </span>
    </template>

    <template #ativo-cell="{ row }">
      <UBadge
        :color="row.original.ativo ? 'success' : 'neutral'"
        variant="subtle"
      >
        {{ row.original.ativo ? 'Ativo' : 'Inativo' }}
      </UBadge>
    </template>

    <template #actions-cell="{ row }">
      <UButton
        :to="CUSTOMER_ROUTES.detail(row.original.id)"
        icon="i-lucide-chevron-right"
        color="neutral"
        variant="ghost"
        size="sm"
        aria-label="Abrir cliente"
        @click.stop
      />
    </template>

    <template #empty>
      <BaseEmptyState icon="i-lucide-users">
        Nenhum cliente encontrado.
        <template #actions>
          <UButton
            :to="CUSTOMER_ROUTES.new"
            icon="i-lucide-plus"
            label="Novo cliente"
            size="sm"
          />
        </template>
      </BaseEmptyState>
    </template>
  </UTable>
</template>
