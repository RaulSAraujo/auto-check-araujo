<script setup lang="ts">
defineOptions({ name: 'CustomersIndexPage' })

definePageMeta({
  path: '/clientes',
  layout: 'app'
})

const { q, clientes, pending } = await useCustomersList()
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Clientes">
        <template #leading>
          <UDashboardSidebarToggle />
        </template>
        <template #right>
          <UButton
            :to="CUSTOMER_ROUTES.new"
            icon="i-lucide-plus"
            label="Novo cliente"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-4 sm:p-6 space-y-4">
        <UInput
          v-model="q"
          icon="i-lucide-search"
          placeholder="Buscar por nome, telefone, documento ou e-mail"
          class="max-w-md"
        />

        <CustomersTable
          :clientes="clientes || []"
          :loading="pending"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
