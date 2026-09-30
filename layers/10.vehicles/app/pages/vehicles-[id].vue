<script setup lang="ts">
import type { BreadcrumbItem, DropdownMenuItem } from '@nuxt/ui'
import { VEHICLE_ROUTES } from '../utils/vehicle-routes'
import { formatPlacaInput } from '../utils/vehicle-form'

defineOptions({ name: 'VehiclesDetailPage' })

definePageMeta({
  path: '/veiculos/:id'
})

const route = useRoute()
const id = computed(() => route.params.id as string)

const [
  { data: veiculo, pending, refresh },
  { data: ordens, pending: pendingOrdens }
] = await Promise.all([
  useVehicleQuery(id),
  useVehicleOrders(id)
])
const voiceClienteId = ref('')
const preferredClienteId = computed(() => voiceClienteId.value || veiculo.value?.cliente_id || undefined)
const {
  clienteItems,
  searchTerm: clienteSearchTerm,
  pending: clientesPending
} = useCustomerOptions('clientes-options-edit', preferredClienteId)
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

useVoiceForm('vehicle', {
  ops: ['edit'],
  state,
  format: { placa: v => formatPlacaInput(String(v)) },
  open: (draft) => {
    if (!editing.value) startEdit()
    if (typeof draft.fields.dono === 'string') voiceClienteId.value = draft.fields.dono
  },
  currentId: () => id.value,
  label: () => (veiculo.value ? formatPlaca(veiculo.value.placa) : undefined),
  accept: draft => draft.id === id.value,
  ready: () => !!veiculo.value && can('vehicles.write')
})

const backFallback = computed(() => {
  const owner = veiculo.value?.clientes
  return owner
    ? VEHICLE_ROUTES.customerDetail(owner.id)
    : VEHICLE_ROUTES.list
})

const { back } = useSmartBack(backFallback)

const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
  const plate = veiculo.value ? formatPlaca(veiculo.value.placa) : 'Veículo'
  return [
    {
      label: 'Veículos',
      to: VEHICLE_ROUTES.list
    },
    { label: plate }
  ]
})

const moreMenuItems = computed<DropdownMenuItem[][]>(() => {
  const items: DropdownMenuItem[] = []

  if (can('vehicles.write')) {
    items.push({
      label: 'Editar',
      icon: 'i-lucide-pencil',
      onSelect: () => { startEdit() }
    })
  }

  if (can('vehicles.delete')) {
    items.push({
      label: 'Excluir',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect: () => { deleteOpen.value = true }
    })
  }

  return items.length ? [items] : []
})

const showMoreMenu = computed(() => !editing.value && moreMenuItems.value.length > 0)
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
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <USkeleton class="h-8 w-40 sm:w-56" />
            <USkeleton class="h-11 w-28 shrink-0 rounded-lg" />
          </div>
        </div>
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
            <UDropdownMenu
              v-if="showMoreMenu"
              :items="moreMenuItems"
              :content="{ align: 'end' }"
            >
              <UButton
                label="Ações"
                trailing-icon="i-lucide-chevron-down"
                color="neutral"
                variant="soft"
                class="min-h-11 touch-manipulation"
              />
            </UDropdownMenu>
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

        <VehiclesEditForm
          v-if="editing"
          v-model="state"
          v-model:cliente-search-term="clienteSearchTerm"
          :cliente-items="clienteItems"
          :clientes-pending="clientesPending"
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
