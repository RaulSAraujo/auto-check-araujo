<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'
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

const breadcrumbItems = computed<BreadcrumbItem[]>(() => [
  {
    label: 'Clientes',
    to: CUSTOMER_ROUTES.list
  },
  {
    label: cliente.value?.nome?.trim() || 'Cliente'
  }
])

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
            <div class="space-y-2">
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
          <template #below>
            <UBadge
              :color="cliente.ativo ? 'success' : 'neutral'"
              variant="subtle"
            >
              {{ cliente.ativo ? 'Ativo' : 'Inativo' }}
            </UBadge>
          </template>
          <template
            v-if="!editing"
            #actions
          >
            <UButton
              v-if="can('customers.write')"
              label="Editar"
              icon="i-lucide-pencil"
              color="primary"
              variant="soft"
              class="min-h-11 touch-manipulation transition-transform motion-safe:active:scale-[0.98]"
              style="transition-duration: var(--duration-press)"
              @click="startEdit"
            />
            <UButton
              v-if="can('customers.write')"
              :label="cliente.ativo ? 'Desativar' : 'Reativar'"
              :icon="cliente.ativo ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              :color="cliente.ativo ? 'warning' : 'success'"
              variant="ghost"
              :loading="togglingAtivo"
              class="min-h-11 touch-manipulation transition-transform motion-safe:active:scale-[0.98]"
              style="transition-duration: var(--duration-press)"
              @click="toggleAtivo"
            />
            <UButton
              v-if="can('customers.delete')"
              label="Excluir"
              icon="i-lucide-trash"
              color="error"
              variant="ghost"
              class="min-h-11 touch-manipulation transition-transform motion-safe:active:scale-[0.98]"
              style="transition-duration: var(--duration-press)"
              @click="deleteOpen = true"
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
