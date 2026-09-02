<script setup lang="ts">
defineOptions({ name: 'HomeIndexPage' })

useSeoMeta({
  title: 'Início',
  description: 'Resumo operacional da oficina.'
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
    <template #body>
      <div class="bg-muted p-4 sm:p-6 space-y-6">
        <BasePageHeader
          title="Início"
          description="Resumo operacional da oficina."
        />

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
