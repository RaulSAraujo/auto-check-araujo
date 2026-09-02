<script setup lang="ts">
defineOptions({ name: 'VehiclesDetailPage' })

definePageMeta({
  path: '/veiculos/:id'
})

const route = useRoute()

const id = computed(() => route.params.id as string)

const { data: veiculo, pending, refresh } = await useVehicleQuery(id)
const { clienteItems } = await useCustomerOptions('clientes-options-edit')
const { data: ordens, pending: pendingOrdens } = await useVehicleOrders(id)
const { state } = useVehicleForm(veiculo)

const {
  editing,
  saving,
  deleting,
  deleteOpen,
  cancelEdit,
  save,
  removeVehicle
} = useVehicleDetailPage(id, state, refresh)

const { can } = usePermissions()
</script>

<template>
  <UDashboardPanel>
    <template #body>
      <div
        v-if="pending && !veiculo"
        class="p-6"
      >
        <BasePageHeader title="Veículo" />
        <USkeleton class="mt-4 h-40 w-full max-w-xl" />
      </div>

      <div
        v-else-if="veiculo"
        class="p-4 sm:p-6 space-y-8 max-w-3xl"
      >
        <BasePageHeader :title="formatPlaca(veiculo.placa)">
          <template #actions>
            <UButton
              :to="VEHICLE_ROUTES.list"
              color="neutral"
              variant="ghost"
              label="Voltar"
              icon="i-lucide-arrow-left"
            />
          </template>
        </BasePageHeader>

        <div class="space-y-4 max-w-xl">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p
                v-if="veiculo.clientes"
                class="text-sm text-muted"
              >
                Proprietário:
                <NuxtLink
                  :to="VEHICLE_ROUTES.customerDetail(veiculo.clientes.id)"
                  class="text-primary hover:underline"
                >
                  {{ veiculo.clientes.nome }}
                </NuxtLink>
              </p>
            </div>
            <div class="flex gap-2">
              <UButton
                v-if="can('vehicles.write') && !editing"
                label="Editar"
                icon="i-lucide-pencil"
                color="neutral"
                variant="soft"
                size="sm"
                @click="editing = true"
              />
              <UButton
                v-if="can('vehicles.delete')"
                label="Excluir"
                icon="i-lucide-trash"
                color="error"
                variant="ghost"
                size="sm"
                @click="deleteOpen = true"
              />
            </div>
          </div>

          <VehiclesForm
            v-model="state"
            :cliente-items="clienteItems"
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
          </VehiclesForm>
        </div>

        <VehiclesOrdersSection
          class="border-t border-default pt-8"
          :veiculo-id="id"
          :ordens="ordens || []"
          :loading="pendingOrdens"
        />
      </div>

      <VehiclesDeleteModal
        v-model:open="deleteOpen"
        :loading="deleting"
        @confirm="removeVehicle"
      />
    </template>
  </UDashboardPanel>
</template>
