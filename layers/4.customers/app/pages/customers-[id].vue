<script setup lang="ts">
defineOptions({ name: 'CustomersDetailPage' })

definePageMeta({
  path: '/clientes/:id'
})

const route = useRoute()

const id = computed(() => route.params.id as string)

const { data: cliente, pending, refresh } = await useCustomerQuery(id)
const { data: veiculos, pending: pendingVeiculos, refresh: refreshVeiculos } = await useCustomerVehicles(id)
const { data: ordens, pending: pendingOrdens, refresh: refreshOrdens } = await useCustomerOrders(id)
const { state } = useCustomerForm(cliente)

const {
  editing,
  saving,
  togglingAtivo,
  deleting,
  deleteOpen,
  cancelEdit,
  save,
  toggleAtivo,
  removeCustomer
} = useCustomerDetailPage(id, cliente, veiculos, state, refresh)

const { can } = usePermissions()

onMounted(() => {
  refreshVeiculos()
  refreshOrdens()
})
</script>

<template>
  <UDashboardPanel>
    <template #body>
      <div
        v-if="pending && !cliente"
        class="p-6"
      >
        <BasePageHeader title="Cliente" />
        <USkeleton class="mt-4 h-40 w-full max-w-xl" />
      </div>

      <div
        v-else-if="cliente"
        class="p-4 sm:p-6 space-y-8 max-w-5xl"
      >
        <BasePageHeader :title="cliente.nome || 'Cliente'">
          <template #actions>
            <UButton
              :to="CUSTOMER_ROUTES.list"
              color="neutral"
              variant="ghost"
              label="Voltar"
              icon="i-lucide-arrow-left"
            />
          </template>
        </BasePageHeader>

        <section class="space-y-4">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <h2 class="text-lg font-semibold text-highlighted truncate">
                Dados do cliente
              </h2>
              <UBadge
                :color="cliente.ativo ? 'success' : 'neutral'"
                variant="subtle"
              >
                {{ cliente.ativo ? 'Ativo' : 'Inativo' }}
              </UBadge>
            </div>
            <div class="flex gap-2 shrink-0">
              <UButton
                v-if="can('customers.write') && !editing"
                :label="cliente.ativo ? 'Desativar' : 'Reativar'"
                :icon="cliente.ativo ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                :color="cliente.ativo ? 'warning' : 'success'"
                variant="soft"
                size="sm"
                :loading="togglingAtivo"
                @click="toggleAtivo"
              />
              <UButton
                v-if="can('customers.write') && !editing"
                label="Editar"
                icon="i-lucide-pencil"
                color="neutral"
                variant="soft"
                size="sm"
                @click="editing = true"
              />
              <UButton
                v-if="can('customers.delete')"
                label="Excluir"
                icon="i-lucide-trash"
                color="error"
                variant="ghost"
                size="sm"
                @click="deleteOpen = true"
              />
            </div>
          </div>

          <CustomersForm
            v-model="state"
            :disabled="!editing"
            @submit="save"
          >
            <div
              v-if="editing"
              class="flex gap-2"
            >
              <UButton
                type="submit"
                label="Salvar"
                :loading="saving"
              />
              <UButton
                label="Cancelar"
                color="neutral"
                variant="ghost"
                @click="cancelEdit"
              />
            </div>
          </CustomersForm>
        </section>

        <CustomersVehiclesSection
          class="border-t border-default pt-8"
          :cliente-id="id"
          :veiculos="veiculos || []"
          :loading="pendingVeiculos"
        />

        <CustomersOrdersSection
          class="border-t border-default pt-8"
          :ordens="ordens || []"
          :loading="pendingOrdens"
        />
      </div>

      <CustomersDeleteModal
        v-model:open="deleteOpen"
        :loading="deleting"
        @confirm="removeCustomer"
      />
    </template>
  </UDashboardPanel>
</template>
