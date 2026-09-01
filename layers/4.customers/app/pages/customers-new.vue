<script setup lang="ts">
defineOptions({ name: 'CustomersNewPage' })

definePageMeta({
  path: '/clientes/novo',
  layout: 'app'
})

const router = useRouter()
useRequirePermission('customers.write')
const { state } = useCustomerForm()
const { createCustomer } = useCustomerMutations()

const loading = ref(false)

async function onSubmit() {
  loading.value = true
  try {
    const { data } = await createCustomer(state)
    if (data) {
      await router.push(CUSTOMER_ROUTES.detail(data.id))
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Novo cliente">
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
      <div class="p-4 sm:p-6 max-w-xl">
        <CustomersForm
          v-model="state"
          compact
          @submit="onSubmit"
        >
          <div class="flex gap-2">
            <UButton
              type="submit"
              label="Salvar"
              :loading="loading"
            />
            <UButton
              :to="CUSTOMER_ROUTES.list"
              label="Cancelar"
              color="neutral"
              variant="ghost"
            />
          </div>
        </CustomersForm>
      </div>
    </template>
  </UDashboardPanel>
</template>
