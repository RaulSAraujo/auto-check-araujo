<script setup lang="ts">
defineOptions({ name: 'DashboardIndexPage' })

definePageMeta({
  layout: 'app'
})

const supabase = useTypedSupabaseClient()

const { data: clientesCount, pending: pendingClientes } = await useAsyncData('dashboard-clientes-count', async () => {
  const { count, error } = await supabase
    .from('clientes')
    .select('*', { count: 'exact', head: true })
  if (error) throw error
  return count ?? 0
})

const { data: veiculosCount, pending: pendingVeiculos } = await useAsyncData('dashboard-veiculos-count', async () => {
  const { count, error } = await supabase
    .from('veiculos')
    .select('*', { count: 'exact', head: true })
  if (error) throw error
  return count ?? 0
})

const { data: osAbertas, pending: pendingOsAbertas } = await useAsyncData('dashboard-os-abertas', async () => {
  const { count, error } = await supabase
    .from('ordens_servico')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'aberta')
  if (error) throw error
  return count ?? 0
})

const { data: osAndamento, pending: pendingOsAndamento } = await useAsyncData('dashboard-os-andamento', async () => {
  const { count, error } = await supabase
    .from('ordens_servico')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'em_andamento')
  if (error) throw error
  return count ?? 0
})
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
                    v-if="pendingOsAbertas"
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
                    v-if="pendingOsAndamento"
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
                    v-if="pendingClientes"
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
                    v-if="pendingVeiculos"
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
