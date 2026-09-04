<script setup lang="ts">
import type { BreadcrumbItem, DropdownMenuItem } from '@nuxt/ui'
import { CUSTOMER_ROUTES } from '../utils/customer-routes'

defineOptions({ name: 'CustomersDetailPage' })

definePageMeta({
  path: '/clientes/:id'
})

const route = useRoute()
const id = computed(() => route.params.id as string)

const { data: cliente, pending, refresh } = await useCustomerQuery(id)
const { data: veiculos, pending: pendingVeiculos, refresh: refreshVeiculos } = await useCustomerVehicles(id)
const {
  ordens,
  total: ordensTotal,
  page: ordensPage,
  pageSize: ordensPageSize,
  pending: pendingOrdens,
  refresh: refreshOrdens
} = await useCustomerOrders(id)
const { state } = useCustomerForm(cliente)

useSeoMeta({
  title: computed(() => cliente.value?.nome?.trim() || 'Cliente'),
  description: 'Dados, veículos e ordens do cliente.'
})

const {
  editing,
  saving,
  togglingAtivo,
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
  toggleAtivo,
  removeCustomer
} = useCustomerDetailPage(id, cliente, veiculos, state, refresh)

const { can } = usePermissions()
const { back } = useSmartBack(CUSTOMER_ROUTES.list)

const breadcrumbItems = computed<BreadcrumbItem[]>(() => [
  {
    label: 'Clientes',
    to: CUSTOMER_ROUTES.list
  },
  {
    label: cliente.value?.nome?.trim() || 'Cliente'
  }
])

const moreMenuItems = computed<DropdownMenuItem[][]>(() => {
  const items: DropdownMenuItem[] = []

  if (can('customers.write')) {
    items.push({
      label: 'Editar',
      icon: 'i-lucide-pencil',
      onSelect: () => { startEdit() }
    })
  }

  if (can('customers.write') && cliente.value) {
    items.push({
      label: cliente.value.ativo ? 'Desativar' : 'Reativar',
      icon: cliente.value.ativo ? 'i-lucide-eye-off' : 'i-lucide-eye',
      color: cliente.value.ativo ? 'warning' : 'success',
      disabled: togglingAtivo.value,
      onSelect: () => { void toggleAtivo() }
    })
  }

  if (can('customers.delete')) {
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
        class="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-6"
      >
        <div class="space-y-2">
          <USkeleton class="h-4 w-40" />
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="flex flex-wrap items-center gap-2">
              <USkeleton class="h-8 w-56 sm:w-72" />
              <USkeleton class="h-5 w-16 rounded-full" />
            </div>
            <USkeleton class="h-11 w-28 shrink-0 rounded-lg" />
          </div>
        </div>
        <USkeleton class="h-52 w-full rounded-lg" />
        <USkeleton class="h-36 w-full rounded-lg" />
      </div>

      <div
        v-else-if="cliente"
        class="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-6"
      >
        <BasePageHeader
          :title="cliente.nome || 'Cliente'"
          :description="editing
            ? 'Altere os dados e salve.'
            : undefined"
        >
          <template #breadcrumb>
            <UBreadcrumb :items="breadcrumbItems" />
          </template>
          <template #title-trailing>
            <UBadge
              :color="cliente.ativo ? 'success' : 'neutral'"
              variant="subtle"
            >
              {{ cliente.ativo ? 'Ativo' : 'Inativo' }}
            </UBadge>
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

        <CustomersEditForm
          v-if="editing"
          v-model="state"
          :loading="saving"
          :dirty="isDirty"
          @submit="save"
          @cancel="cancelEdit"
        />
        <CustomersDetailSummary
          v-else
          :cliente="cliente"
        />

        <template v-if="!editing">
          <CustomersVehiclesSection
            class="border-t border-default pt-6"
            :cliente-id="id"
            :veiculos="veiculos || []"
            :loading="pendingVeiculos"
          />

          <CustomersOrdersSection
            v-model:page="ordensPage"
            class="border-t border-default pt-6"
            :ordens="ordens"
            :total="ordensTotal"
            :page-size="ordensPageSize"
            :loading="pendingOrdens"
          />
        </template>
      </div>

      <div
        v-else
        class="mx-auto w-full max-w-2xl space-y-4 p-4 sm:p-6"
      >
        <BasePageHeader title="Cliente não encontrado" />
        <p class="text-sm text-muted">
          Esse cliente não existe ou foi removido.
        </p>
        <UButton
          :to="CUSTOMER_ROUTES.list"
          label="Voltar para clientes"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="soft"
          class="min-h-11 touch-manipulation"
        />
      </div>

      <CustomersDiscardModal
        v-model:open="discardOpen"
        :title="discardTitle"
        :description="discardDescription"
        @confirm="confirmDiscard"
      />

      <CustomersDeleteModal
        v-model:open="deleteOpen"
        :loading="deleting"
        @confirm="removeCustomer"
      />
    </template>
  </UDashboardPanel>
</template>
