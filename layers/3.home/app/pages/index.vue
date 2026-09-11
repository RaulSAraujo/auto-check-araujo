<script setup lang="ts">
defineOptions({ name: 'HomeIndexPage' })

useSeoMeta({
  title: 'Início',
  description: 'Resumo operacional da oficina.'
})

const {
  pending,
  error,
  refresh,
  statusCounts,
  weeklyTrend,
  activeOrders,
  todayAppointments,
  clientesCount,
  veiculosCount,
  activeOrdersTotal,
  weeklyCompletedTotal,
  weeklyRevenueTotal,
  showFinance,
  financeSummary
} = await useDashboardStats()
</script>

<template>
  <UDashboardPanel>
    <template #body>
      <div class="bg-muted p-4 sm:p-5">
        <div class="mx-auto w-full max-w-5xl space-y-5">
          <BasePageHeader
            title="Início"
            description="Resumo operacional da oficina."
          >
            <template #actions>
              <UButton
                :to="APP_ROUTES.ordersNew"
                label="Nova OS"
                color="primary"
                icon="i-lucide-plus"
              />
            </template>
          </BasePageHeader>

          <UAlert
            v-if="error"
            color="error"
            variant="subtle"
            title="Não foi possível carregar o resumo"
            description="Verifica a conexão e tenta de novo."
            aria-live="polite"
          >
            <template #actions>
              <UButton
                label="Tentar de novo"
                color="neutral"
                variant="outline"
                size="sm"
                :loading="pending"
                @click="refresh()"
              />
            </template>
          </UAlert>

          <template v-else>
            <div class="grid gap-4 lg:grid-cols-2 lg:items-stretch">
              <LazyHomeOrdersStatusChart
                :pending="pending"
                :status-counts="statusCounts"
                :total="activeOrdersTotal"
              />
              <HomeActiveOrdersList
                :pending="pending"
                :orders="activeOrders"
                :total="activeOrdersTotal"
              />
            </div>

            <div class="grid gap-4 lg:grid-cols-2 lg:items-stretch">
              <HomeTodaySchedule
                :pending="pending"
                :appointments="todayAppointments"
              />
              <HomeRegistryStats
                :pending="pending"
                :clientes-count="clientesCount"
                :veiculos-count="veiculosCount"
              />
            </div>

            <LazyHomeWeeklyChart
              :pending="pending"
              :weekly-trend="weeklyTrend"
              :total-count="weeklyCompletedTotal"
              :total-revenue="weeklyRevenueTotal"
            />

            <LazyHomeFinanceChart
              v-if="showFinance"
              :pending="pending"
              :total-faturado="financeSummary.total_faturado"
              :total-pago="financeSummary.total_pago"
              :total-pendente="financeSummary.total_pendente"
            />
          </template>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
