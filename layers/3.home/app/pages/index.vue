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
      <div class="p-4 sm:p-6 space-y-6">
        <div>
          <h2 class="text-xl font-semibold text-highlighted">
            Oficina
          </h2>
          <p class="text-sm text-muted mt-1">
            Resumo operacional de Clientes, Veículos e Ordens de Serviço.
          </p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2 max-w-3xl">
          <UCard>
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm text-muted">
                  OS abertas
                </p>
                <p class="text-3xl font-semibold text-highlighted mt-1">
                  <USkeleton
                    v-if="pending"
                    class="h-9 w-16"
                  />
                  <span v-else>{{ osAbertas }}</span>
                </p>
              </div>
              <UIcon
                name="i-lucide-clipboard-list"
                class="size-8 text-primary"
              />
            </div>
            <div class="mt-4">
              <UButton
                to="/ordens?status=aberta"
                label="Ver abertas"
                variant="soft"
                trailing-icon="i-lucide-arrow-right"
                size="sm"
              />
            </div>
          </UCard>

          <UCard>
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm text-muted">
                  OS em andamento
                </p>
                <p class="text-3xl font-semibold text-highlighted mt-1">
                  <USkeleton
                    v-if="pending"
                    class="h-9 w-16"
                  />
                  <span v-else>{{ osAndamento }}</span>
                </p>
              </div>
              <UIcon
                name="i-lucide-wrench"
                class="size-8 text-primary"
              />
            </div>
            <div class="mt-4">
              <UButton
                to="/ordens?status=em_andamento"
                label="Ver em andamento"
                variant="soft"
                trailing-icon="i-lucide-arrow-right"
                size="sm"
              />
            </div>
          </UCard>

          <UCard>
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm text-muted">
                  Clientes
                </p>
                <p class="text-3xl font-semibold text-highlighted mt-1">
                  <USkeleton
                    v-if="pending"
                    class="h-9 w-16"
                  />
                  <span v-else>{{ clientesCount }}</span>
                </p>
              </div>
              <UIcon
                name="i-lucide-users"
                class="size-8 text-primary"
              />
            </div>
            <div class="mt-4">
              <UButton
                to="/clientes"
                label="Ver clientes"
                variant="soft"
                trailing-icon="i-lucide-arrow-right"
                size="sm"
              />
            </div>
          </UCard>

          <UCard>
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm text-muted">
                  Veículos
                </p>
                <p class="text-3xl font-semibold text-highlighted mt-1">
                  <USkeleton
                    v-if="pending"
                    class="h-9 w-16"
                  />
                  <span v-else>{{ veiculosCount }}</span>
                </p>
              </div>
              <UIcon
                name="i-lucide-car"
                class="size-8 text-primary"
              />
            </div>
            <div class="mt-4">
              <UButton
                to="/veiculos"
                label="Ver veículos"
                variant="soft"
                trailing-icon="i-lucide-arrow-right"
                size="sm"
              />
            </div>
          </UCard>
        </div>

        <UCard
          v-if="can('finance.view')"
          class="max-w-3xl"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-sm text-muted">
                Faturamento do mês
              </p>
              <p class="text-3xl font-semibold text-highlighted mt-1 tabular-nums">
                <USkeleton
                  v-if="pendingFinance"
                  class="h-9 w-32"
                />
                <span v-else>{{ formatMoney(Number(financeSummary?.total_faturado ?? 0)) }}</span>
              </p>
              <p
                v-if="financeSummary && !pendingFinance"
                class="text-sm text-muted mt-2"
              >
                Recebido {{ formatMoney(Number(financeSummary.total_pago)) }}
                · Pendente {{ formatMoney(Number(financeSummary.total_pendente)) }}
              </p>
            </div>
            <UIcon
              name="i-lucide-banknote"
              class="size-8 text-primary"
            />
          </div>
          <div class="mt-4">
            <UButton
              to="/financeiro"
              label="Ver financeiro"
              variant="soft"
              trailing-icon="i-lucide-arrow-right"
              size="sm"
            />
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
