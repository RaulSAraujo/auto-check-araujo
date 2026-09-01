<script setup lang="ts">
defineOptions({ name: 'CustomersDetailPage' })

definePageMeta({
  path: '/clientes/:id',
  layout: 'app'
})

const route = useRoute()
const router = useRouter()

const id = computed(() => route.params.id as string)

const editing = ref(false)
const saving = ref(false)
const deleting = ref(false)
const deleteOpen = ref(false)

const { data: cliente, pending, refresh } = await useCustomerQuery(id)
const { data: veiculos, pending: pendingVeiculos, refresh: refreshVeiculos } = await useCustomerVehicles(id)
const { state } = useCustomerForm(cliente)
const { updateCustomer, deleteCustomer } = useCustomerMutations()

function cancelEdit() {
  editing.value = false
  refresh()
}

async function save() {
  saving.value = true
  try {
    const { error } = await updateCustomer(id.value, state)
    if (!error) {
      editing.value = false
      await refresh()
    }
  } finally {
    saving.value = false
  }
}

async function removeCliente() {
  deleting.value = true
  try {
    const { error, blocked } = await deleteCustomer(id.value, veiculos.value?.length || 0)
    if (blocked) {
      deleteOpen.value = false
      return
    }
    if (!error) {
      await router.push(CUSTOMER_ROUTES.list)
    }
  } finally {
    deleting.value = false
    deleteOpen.value = false
  }
}

onMounted(() => {
  refreshVeiculos()
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="cliente?.nome || 'Cliente'">
        <template #leading>
          <UDashboardSidebarToggle />
        </template>
        <template #right>
          <UButton
            :to="CUSTOMER_ROUTES.list"
            color="neutral"
            variant="ghost"
            label="Voltar"
            icon="i-lucide-arrow-left"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div
        v-if="pending && !cliente"
        class="p-6"
      >
        <USkeleton class="h-40 w-full max-w-xl" />
      </div>

      <div
        v-else-if="cliente"
        class="p-4 sm:p-6 space-y-8 max-w-3xl"
      >
        <section class="space-y-4">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-lg font-semibold text-highlighted">
              Dados do Cliente
            </h2>
            <div class="flex gap-2">
              <UButton
                v-if="!editing"
                label="Editar"
                icon="i-lucide-pencil"
                color="neutral"
                variant="soft"
                size="sm"
                @click="editing = true"
              />
              <UButton
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
          :cliente-id="id"
          :veiculos="veiculos || []"
          :loading="pendingVeiculos"
        />
      </div>

      <CustomersDeleteModal
        v-model:open="deleteOpen"
        :loading="deleting"
        @confirm="removeCliente"
      />
    </template>
  </UDashboardPanel>
</template>
