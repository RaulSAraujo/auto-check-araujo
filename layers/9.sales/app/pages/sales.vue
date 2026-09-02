<script setup lang="ts">
import { SALES_PERIOD_ITEMS } from '../utils/sales'

defineOptions({ name: 'SalesIndexPage' })

definePageMeta({
  path: '/vendas',
  layout: 'app'
})

useRequirePermission('finance.view')

const {
  period,
  collaboratorId,
  collaboratorOptions,
  orders,
  summary,
  collaborators,
  commissionRate,
  pending,
  error,
  refresh,
  exportCsv
} = await useSalesReport()

const periodItems = [...SALES_PERIOD_ITEMS]
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Controle de Vendas">
        <template #leading>
          <UDashboardSidebarToggle />
        </template>
        <template #right>
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="ghost"
            aria-label="Atualizar vendas"
            :loading="pending"
            @click="refresh()"
          />
          <UButton
            icon="i-lucide-download"
            color="neutral"
            variant="outline"
            label="Exportar"
            :disabled="pending || !orders.length"
            @click="exportCsv()"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-4 sm:p-6 space-y-6">
        <div class="flex flex-col gap-1">
          <p class="text-sm text-muted">
            Gerencie todas as vendas da oficina.
          </p>
        </div>

        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-end">
            <UFormField
              label="Período"
              name="periodo"
            >
              <UTabs
                v-model="period"
                :items="periodItems"
                :content="false"
                size="sm"
                class="w-full sm:w-auto"
              />
            </UFormField>

            <UFormField
              label="Colaborador"
              name="colaborador"
              class="sm:w-56"
            >
              <USelect
                v-model="collaboratorId"
                :items="collaboratorOptions"
                class="w-full"
              />
            </UFormField>
          </div>
        </div>

        <UAlert
          v-if="error"
          color="error"
          variant="subtle"
          title="Não foi possível carregar as vendas"
          :description="error.message"
        >
          <template #actions>
            <UButton
              label="Tentar de novo"
              color="neutral"
              variant="outline"
              size="sm"
              @click="refresh()"
            />
          </template>
        </UAlert>

        <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <SalesKpiStrip
            :summary="summary"
            :commission-rate="commissionRate"
            :loading="pending"
          />
          <SalesStatusStrip
            :summary="summary"
            :loading="pending"
          />
        </div>

        <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <section class="space-y-3 min-w-0">
            <div class="flex items-center justify-between gap-3">
              <h2 class="text-lg font-semibold text-highlighted">
                Financeiro
                <span
                  v-if="!pending"
                  class="text-sm font-normal text-muted"
                >
                  ({{ summary.qtdOs }})
                </span>
              </h2>
              <UButton
                to="/ordens?status=concluida"
                label="Ver OS"
                variant="link"
                size="sm"
                trailing-icon="i-lucide-arrow-right"
              />
            </div>

            <SalesTable
              :orders="orders"
              :loading="pending"
            />
          </section>

          <SalesCollaboratorsRanking
            :collaborators="collaborators"
            :loading="pending"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
