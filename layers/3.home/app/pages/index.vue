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
      <div class="bg-muted p-4 sm:p-6">
        <div class="mx-auto w-full max-w-5xl space-y-4 sm:space-y-6">
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
                class="w-full justify-center sm:w-auto"
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
            <div class="grid min-w-0 gap-4 lg:grid-cols-2 lg:items-stretch [&>*]:min-w-0">
              <HomeActiveOrdersList
                class="order-1 lg:order-2"
                :pending="pending"
                :orders="activeOrders"
                :total="activeOrdersTotal"
              />
              <LazyHomeOrdersStatusChart
                class="order-2 lg:order-1"
                :pending="pending"
                :status-counts="statusCounts"
                :total="activeOrdersTotal"
              />
            </div>

            <div class="grid min-w-0 gap-4 lg:grid-cols-2 lg:items-stretch [&>*]:min-w-0">
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
