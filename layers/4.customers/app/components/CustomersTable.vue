<script setup lang="ts">
import type { Cliente } from '~~/shared/types/database'
import { formatContactList } from '~~/shared/utils/contact'
import { CUSTOMER_LIST_COLUMNS } from '../utils/customer-table-columns'
import { CUSTOMER_ROUTES } from '../utils/customer-routes'

defineOptions({ name: 'CustomersTable' })

defineProps<{
  clientes: Cliente[]
  loading?: boolean
}>()
</script>

<template>
  <div class="space-y-2 md:hidden">
    <template v-if="loading">
      <USkeleton
        v-for="n in 3"
        :key="n"
        class="h-20 w-full"
      />
    </template>

    <template v-else-if="clientes.length">
      <NuxtLink
        v-for="cliente in clientes"
        :key="cliente.id"
        :to="CUSTOMER_ROUTES.detail(cliente.id)"
        class="group flex min-h-[5.75rem] items-center gap-3 rounded-xl bg-elevated/40 px-3 py-3 ring-1 ring-default/70 transition-colors active:bg-elevated"
      >
        <UAvatar
          :alt="cliente.nome"
          :text="cliente.nome.charAt(0).toUpperCase()"
          size="md"
          class="shrink-0"
        />
        <span class="min-w-0 flex-1 space-y-1.5">
          <span class="flex min-w-0 items-center gap-2">
            <span class="min-w-0 flex-1 truncate font-semibold text-highlighted">{{ cliente.nome }}</span>
            <UBadge
              :color="cliente.ativo ? 'success' : 'neutral'"
              variant="subtle"
              size="sm"
              class="shrink-0"
            >
              {{ cliente.ativo ? 'Ativo' : 'Inativo' }}
            </UBadge>
          </span>
          <span class="flex min-w-0 items-center gap-1.5 text-sm text-muted">
            <UIcon
              name="i-lucide-contact"
              class="size-4 shrink-0 text-dimmed"
            />
            <span class="truncate">{{ formatContactList(cliente.telefones) || formatContactList(cliente.emails) || cliente.documento || EMPTY_VALUE }}</span>
          </span>
        </span>
        <UIcon
          name="i-lucide-chevron-right"
          class="size-5 shrink-0 text-dimmed transition-transform group-active:translate-x-0.5"
        />
      </NuxtLink>
    </template>

    <BaseEmptyState
      v-else
      icon="i-lucide-users"
    >
      Nenhum cliente encontrado.
    </BaseEmptyState>
  </div>

  <UTable
    :data="clientes"
    :columns="CUSTOMER_LIST_COLUMNS"
    :loading="loading"
    class="hidden w-full md:block"
  >
    <template #telefones-cell="{ row }">
      <span class="text-sm">
        {{ formatContactList(row.original.telefones) }}
      </span>
    </template>

    <template #emails-cell="{ row }">
      <span class="text-sm">
        {{ formatContactList(row.original.emails) }}
      </span>
    </template>

    <template #ativo-cell="{ row }">
      <UBadge
        :color="row.original.ativo ? 'success' : 'neutral'"
        variant="subtle"
      >
        {{ row.original.ativo ? 'Ativo' : 'Inativo' }}
      </UBadge>
    </template>

    <template #actions-cell="{ row }">
      <UButton
        :to="CUSTOMER_ROUTES.detail(row.original.id)"
        icon="i-lucide-chevron-right"
        color="neutral"
        variant="ghost"
        size="sm"
        aria-label="Abrir cliente"
        @click.stop
      />
    </template>

    <template #empty>
      <BaseEmptyState icon="i-lucide-users">
        Nenhum cliente encontrado.
        <template #actions>
          <UButton
            :to="CUSTOMER_ROUTES.new"
            icon="i-lucide-plus"
            label="Novo cliente"
            size="sm"
          />
        </template>
      </BaseEmptyState>
    </template>
  </UTable>
</template>
