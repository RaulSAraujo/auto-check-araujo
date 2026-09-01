<script setup lang="ts">
defineOptions({ name: 'DashboardIndexPage' })

definePageMeta({
  layout: 'app'
})

const supabase = useTypedSupabaseClient()

type DashboardStats = {
  clientes: number
  veiculos: number
  os_abertas: number
  os_andamento: number
}

const { data: stats, pending } = await useAsyncData('dashboard-stats', async () => {
  const { data, error } = await supabase.rpc('dashboard_stats')
  if (error) throw error
  return data as DashboardStats
})

const osAbertas = computed(() => stats.value?.os_abertas ?? 0)
const osAndamento = computed(() => stats.value?.os_andamento ?? 0)
const clientesCount = computed(() => stats.value?.clientes ?? 0)
const veiculosCount = computed(() => stats.value?.veiculos ?? 0)
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
      </div>
    </template>
  </UDashboardPanel>
</template>
