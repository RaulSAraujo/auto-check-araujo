<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'
import { VEHICLE_ROUTES } from '../utils/vehicle-routes'

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

useSeoMeta({
  title: computed(() => veiculo.value ? formatPlaca(veiculo.value.placa) : 'Veículo'),
  description: 'Dados e histórico de ordens do veículo.'
})

const {
  editing,
  saving,
  deleting,
  deleteOpen,
  discardOpen,
  discardTitle,
  discardDescription,
  isDirty,
  startEdit,
  cancelEdit,
  confirmDiscard,
  save,
  removeVehicle
} = useVehicleDetailPage(id, veiculo, state, refresh)

const { can } = usePermissions()

const backFallback = computed(() => {
  const owner = veiculo.value?.clientes
  return owner
    ? VEHICLE_ROUTES.customerDetail(owner.id)
    : VEHICLE_ROUTES.list
})

const { back } = useSmartBack(backFallback)

const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
  const plate = veiculo.value ? formatPlaca(veiculo.value.placa) : 'Veículo'
  const owner = veiculo.value?.clientes

  if (owner) {
    return [
      {
        label: 'Clientes',
        to: VEHICLE_ROUTES.customers
      },
      {
        label: owner.nome,
        to: VEHICLE_ROUTES.customerDetail(owner.id)
      },
      { label: plate }
    ]
  }

  return [
    {
      label: 'Veículos',
      to: VEHICLE_ROUTES.list
    },
    { label: plate }
  ]
})
</script>

<template>
  <UDashboardPanel>
    <template #body>
      <div
        v-if="pending && !veiculo"
        class="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-6"
      >
        <div class="space-y-2">
          <USkeleton class="h-4 w-40" />
          <USkeleton class="h-8 w-40 sm:w-56" />
        </div>
        <USkeleton class="h-11 w-28 rounded-lg" />
        <USkeleton class="h-52 w-full rounded-lg" />
        <USkeleton class="h-36 w-full rounded-lg" />
      </div>

      <div
        v-else-if="veiculo"
        class="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-6"
      >
        <BasePageHeader
          :title="formatPlaca(veiculo.placa)"
          :description="editing
            ? 'Altere os dados e salve.'
            : undefined"
        >
          <template #breadcrumb>
            <UBreadcrumb :items="breadcrumbItems" />
          </template>
          <template #actions>
            <UButton
              color="neutral"
              variant="ghost"
              label="Voltar"
              icon="i-lucide-arrow-left"
              class="min-h-11 touch-manipulation"
              @click="back"
            />
          </template>
        </BasePageHeader>

        <div
          v-if="!editing"
          class="flex flex-wrap items-center gap-2"
        >
          <UButton
            v-if="can('vehicles.write')"
            label="Editar"
            icon="i-lucide-pencil"
            color="primary"
            variant="soft"
            class="min-h-11 touch-manipulation transition-transform motion-safe:active:scale-[0.98]"
            style="transition-duration: var(--duration-press)"
            @click="startEdit"
          />
          <UButton
            v-if="can('vehicles.delete')"
            label="Excluir"
            icon="i-lucide-trash"
            color="error"
            variant="ghost"
            class="min-h-11 touch-manipulation transition-transform motion-safe:active:scale-[0.98]"
            style="transition-duration: var(--duration-press)"
            @click="deleteOpen = true"
          />
        </div>

        <VehiclesEditForm
          v-if="editing"
          v-model="state"
          :cliente-items="clienteItems"
          :loading="saving"
          :dirty="isDirty"
          @submit="save"
          @cancel="cancelEdit"
        />
        <VehiclesDetailSummary
          v-else
          :veiculo="veiculo"
        />

        <VehiclesOrdersSection
          v-if="!editing"
          class="border-t border-default pt-6"
          :veiculo-id="id"
          :ordens="ordens || []"
          :loading="pendingOrdens"
        />
      </div>

      <div
        v-else
        class="mx-auto w-full max-w-2xl space-y-4 p-4 sm:p-6"
      >
        <BasePageHeader title="Veículo não encontrado" />
        <p class="text-sm text-muted">
          Esse veículo não existe ou foi removido.
        </p>
        <UButton
          :to="VEHICLE_ROUTES.list"
          label="Voltar para veículos"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="soft"
          class="min-h-11 touch-manipulation"
        />
      </div>

      <VehiclesDiscardModal
        v-model:open="discardOpen"
        :title="discardTitle"
        :description="discardDescription"
        @confirm="confirmDiscard"
      />

      <VehiclesDeleteModal
        v-model:open="deleteOpen"
        :loading="deleting"
        @confirm="removeVehicle"
      />
    </template>
  </UDashboardPanel>
</template>
