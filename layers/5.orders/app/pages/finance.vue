<script setup lang="ts">
defineOptions({ name: 'OrdersFinancePage' })

definePageMeta({
  path: '/financeiro',
  layout: 'app'
})

useRequirePermission('finance.view')

const {
  selectedMonth,
  summary,
  orders,
  pending
} = await useFinanceReport()
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Financeiro">
        <template #leading>
          <UDashboardSidebarToggle />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-4 sm:p-6 space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-end gap-4 max-w-3xl">
          <div class="flex-1">
            <h2 class="text-xl font-semibold text-highlighted">
              Resumo mensal
            </h2>
            <p class="text-sm text-muted mt-1">
              OS concluídas com orçamento aprovado.
            </p>
          </div>
          <UFormField
            label="Mês"
            name="mes"
            class="sm:w-48"
          >
            <UInput
              v-model="selectedMonth"
              type="month"
              class="w-full"
            />
          </UFormField>
        </div>

        <div class="grid gap-4 sm:grid-cols-3 max-w-4xl">
          <UCard>
            <p class="text-sm text-muted">
              Faturado
            </p>
            <p class="text-2xl font-semibold text-highlighted mt-1 tabular-nums">
              <USkeleton
                v-if="pending"
                class="h-8 w-28"
              />
              <span v-else>{{ formatMoney(Number(summary.total_faturado)) }}</span>
            </p>
          </UCard>

          <UCard>
            <p class="text-sm text-muted">
              Recebido
            </p>
            <p class="text-2xl font-semibold text-success mt-1 tabular-nums">
              <USkeleton
                v-if="pending"
                class="h-8 w-28"
              />
              <span v-else>{{ formatMoney(Number(summary.total_pago)) }}</span>
            </p>
          </UCard>

          <UCard>
            <p class="text-sm text-muted">
              Pendente
            </p>
            <p class="text-2xl font-semibold text-warning mt-1 tabular-nums">
              <USkeleton
                v-if="pending"
                class="h-8 w-28"
              />
              <span v-else>{{ formatMoney(Number(summary.total_pendente)) }}</span>
            </p>
          </UCard>
        </div>

        <section class="space-y-3">
          <h3 class="text-lg font-semibold text-highlighted">
            Ordens do mês
            <span
              v-if="!pending"
              class="text-sm font-normal text-muted"
            >
              ({{ summary.qtd_os }})
            </span>
          </h3>

          <OrdersFinanceTable
            :orders="orders"
            :loading="pending"
          />
        </section>
      </div>
    </template>
  </UDashboardPanel>
</template>
