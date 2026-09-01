<script setup lang="ts">
import type { Cliente } from '~~/shared/types/database'
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
      <div class="text-center py-8 text-muted">
        Nenhum Cliente encontrado.
      </div>
    </template>
  </UTable>
</template>
