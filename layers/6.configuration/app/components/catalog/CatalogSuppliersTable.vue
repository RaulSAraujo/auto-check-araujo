<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { Fornecedor } from '~~/shared/types/database'
import { EMPTY_VALUE } from '~~/shared/utils/empty'

defineOptions({ name: 'CatalogSuppliersTable' })

defineProps<{
  suppliers: Fornecedor[]
  togglingId: string | null
}>()

const emit = defineEmits<{
  edit: [payload: { id: string }]
  toggleAtivo: [payload: { id: string, ativo: boolean }]
  delete: [payload: { id: string }]
}>()

function rowMenuItems(supplier: Fornecedor, togglingId: string | null): DropdownMenuItem[][] {
  return [[
    {
      label: 'Editar',
      icon: 'i-lucide-pencil',
      onSelect: () => { emit('edit', { id: supplier.id }) }
    },
    {
      label: supplier.ativo ? 'Desativar' : 'Reativar',
      icon: supplier.ativo ? 'i-lucide-eye-off' : 'i-lucide-eye',
      color: supplier.ativo ? 'warning' : 'success',
      disabled: togglingId === supplier.id,
      onSelect: () => { emit('toggleAtivo', { id: supplier.id, ativo: !supplier.ativo }) }
    },
    {
      label: 'Excluir',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect: () => { emit('delete', { id: supplier.id }) }
    }
  ]]
}
</script>

<template>
  <div class="min-w-0 overflow-x-auto">
    <div>
      <table class="w-full min-w-[32rem] text-sm">
        <thead class="border-b border-default text-left text-xs text-muted">
          <tr>
            <th class="px-3 py-2.5 font-medium">
              Nome
            </th>
            <th class="px-3 py-2.5 font-medium">
              Telefone
            </th>
            <th class="hidden px-3 py-2.5 font-medium sm:table-cell">
              E-mail
            </th>
            <th class="px-3 py-2.5 font-medium">
              Status
            </th>
            <th class="w-12 px-3 py-2.5">
              <span class="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr
            v-for="supplier in suppliers"
            :key="supplier.id"
            class="motion-safe:transition-colors hover:bg-elevated/40"
            :class="!supplier.ativo ? 'opacity-55' : ''"
          >
            <td class="min-w-0 px-3 py-2.5 align-middle">
              <div class="min-w-0 space-y-0.5">
                <span class="block truncate font-medium text-highlighted">{{ supplier.nome }}</span>
                <p
                  v-if="supplier.observacoes"
                  class="text-xs text-muted line-clamp-1"
                >
                  {{ supplier.observacoes }}
                </p>
              </div>
            </td>
            <td class="px-3 py-2.5 align-middle tabular-nums text-muted">
              {{ supplier.telefone || EMPTY_VALUE }}
            </td>
            <td class="hidden min-w-0 px-3 py-2.5 align-middle sm:table-cell">
              <span class="block truncate text-muted">{{ supplier.email || EMPTY_VALUE }}</span>
            </td>
            <td class="px-3 py-2.5 align-middle">
              <UBadge
                :color="supplier.ativo ? 'success' : 'neutral'"
                variant="subtle"
                size="sm"
              >
                {{ supplier.ativo ? 'Ativo' : 'Inativo' }}
              </UBadge>
            </td>
            <td class="px-3 py-2.5 align-middle">
              <div class="flex justify-end">
                <UDropdownMenu
                  :items="rowMenuItems(supplier, togglingId)"
                  :content="{ align: 'end' }"
                >
                  <UButton
                    icon="i-lucide-ellipsis"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    class="min-h-9 min-w-9 touch-manipulation"
                    :loading="togglingId === supplier.id"
                    aria-label="Ações do fornecedor"
                  />
                </UDropdownMenu>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
