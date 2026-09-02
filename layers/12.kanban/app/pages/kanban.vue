<script setup lang="ts">
import { ORDER_ROUTES } from '#layers/orders/app/utils/order-routes'

defineOptions({ name: 'KanbanIndexPage' })

definePageMeta({
  path: '/kanban',
  layout: 'app'
})

const { can } = usePermissions()
const { columns, overdueTotal, pending, error, refresh } = await useKanbanBoard()
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Kanban">
        <template #leading>
          <UDashboardSidebarToggle />
        </template>
        <template #right>
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="ghost"
            aria-label="Atualizar board"
            :loading="pending"
            @click="refresh()"
          />
          <UButton
            v-if="can('orders.create')"
            :to="ORDER_ROUTES.new"
            icon="i-lucide-plus"
            label="Nova OS"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex h-full min-h-0 flex-col gap-4 p-4 sm:p-6">
        <div class="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 class="text-lg font-semibold tracking-tight text-highlighted text-balance sm:text-xl">
              Gestão visual da oficina
            </h1>
            <p class="mt-0.5 text-sm text-muted">
              Tempo por etapa, responsáveis e alertas de atraso.
            </p>
          </div>
        </div>

        <UAlert
          v-if="error"
          color="error"
          variant="subtle"
          title="Não foi possível carregar o Kanban"
          :description="error.message"
        >
          <template #actions>
            <UButton
              label="Tentar de novo"
              color="neutral"
              variant="outline"
              size="xs"
              @click="refresh()"
            />
          </template>
        </UAlert>

        <KanbanBoard
          v-else
          :columns="columns"
          :pending="pending"
          :overdue-total="overdueTotal"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
