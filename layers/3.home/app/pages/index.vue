<script setup lang="ts">
defineOptions({ name: 'HomeIndexPage' })

definePageMeta({
  layout: 'app'
})

const {
  pending,
  osAbertas,
  osAndamento,
  clientesCount,
  veiculosCount
} = await useDashboardStats()

const { can } = usePermissions()
const { data: financeSummary, pending: pendingFinance } = await useFinanceSummary()
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Início">
        <template #leading>
          <UDashboardSidebarToggle />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-4 sm:p-6">
        <HomeOperationalSummary
          :pending="pending"
          :os-abertas="osAbertas"
          :os-andamento="osAndamento"
          :clientes-count="clientesCount"
          :veiculos-count="veiculosCount"
          :show-finance="can('finance.view')"
          :pending-finance="pendingFinance"
          :total-faturado="Number(financeSummary?.total_faturado ?? 0)"
          :total-pago="Number(financeSummary?.total_pago ?? 0)"
          :total-pendente="Number(financeSummary?.total_pendente ?? 0)"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
