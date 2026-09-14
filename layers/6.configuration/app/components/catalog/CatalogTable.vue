<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { OrdemItemTipo } from '~~/shared/types/oficina'
import { ORDEM_ITEM_TIPO_LABEL } from '~~/shared/types/oficina'
import { formatMoney } from '~~/shared/utils/money'
import { EMPTY_VALUE } from '~~/shared/utils/empty'
import {
  CATALOG_TIPO_COLOR,
  type CatalogItemRow
} from '../../utils/catalog'

defineOptions({ name: 'CatalogTable' })

defineProps<{
  items: CatalogItemRow[]
  togglingId: string | null
}>()

const emit = defineEmits<{
  edit: [payload: { id: string }]
  toggleAtivo: [payload: { id: string, ativo: boolean }]
  delete: [payload: { id: string }]
}>()

function rowMenuItems(item: CatalogItemRow, togglingId: string | null): DropdownMenuItem[][] {
  return [[
    {
      label: 'Editar',
      icon: 'i-lucide-pencil',
      onSelect: () => { emit('edit', { id: item.id }) }
    },
    {
      label: item.ativo ? 'Desativar' : 'Reativar',
      icon: item.ativo ? 'i-lucide-eye-off' : 'i-lucide-eye',
      color: item.ativo ? 'warning' : 'success',
      disabled: togglingId === item.id,
      onSelect: () => { emit('toggleAtivo', { id: item.id, ativo: !item.ativo }) }
    },
    {
      label: 'Excluir',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect: () => { emit('delete', { id: item.id }) }
    }
  ]]
}
</script>

<template>
  <div class="min-w-0 overflow-x-auto">
    <div>
      <table class="w-full min-w-0 text-sm sm:min-w-[36rem]">
        <thead class="border-b border-default text-left text-xs text-muted">
          <tr>
            <th class="px-3 py-2.5 font-medium">
              Nome
            </th>
            <th class="px-3 py-2.5 font-medium">
              Tipo
            </th>
            <th class="px-3 py-2.5 font-medium text-right">
              Valor
            </th>
            <th class="hidden px-3 py-2.5 font-medium text-right md:table-cell">
              Custo
            </th>
            <th class="hidden px-3 py-2.5 font-medium lg:table-cell">
              Fornecedor
            </th>
            <th class="hidden px-3 py-2.5 font-medium text-right sm:table-cell">
              Estoque
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
            v-for="item in items"
            :key="item.id"
            class="motion-safe:transition-colors hover:bg-elevated/40"
            :class="!item.ativo ? 'opacity-55' : ''"
          >
            <td class="min-w-0 px-3 py-2.5 align-middle">
              <div class="min-w-0 space-y-0.5">
                <span class="block truncate font-medium text-highlighted">{{ item.nome }}</span>
                <p
                  v-if="item.tipo === 'kit' && item.catalogo_kit_itens?.length"
                  class="text-xs text-muted"
                >
                  {{ item.catalogo_kit_itens.length }} {{ item.catalogo_kit_itens.length === 1 ? 'item no kit' : 'itens no kit' }}
                </p>
              </div>
            </td>
            <td class="px-3 py-2.5 align-middle">
              <UBadge
                :color="CATALOG_TIPO_COLOR[item.tipo as OrdemItemTipo]"
                variant="subtle"
                size="sm"
              >
                {{ ORDEM_ITEM_TIPO_LABEL[item.tipo as OrdemItemTipo] }}
              </UBadge>
            </td>
            <td class="px-3 py-2.5 text-right font-mono tabular-nums align-middle">
              {{ formatMoney(Number(item.valor_padrao)) }}
            </td>
            <td class="hidden px-3 py-2.5 text-right font-mono tabular-nums align-middle text-muted md:table-cell">
              {{ formatMoney(Number(item.custo)) }}
            </td>
            <td class="hidden min-w-0 px-3 py-2.5 align-middle lg:table-cell">
              <span class="block truncate text-muted">{{ item.fornecedores?.nome || EMPTY_VALUE }}</span>
            </td>
            <td class="hidden px-3 py-2.5 text-right font-mono tabular-nums align-middle sm:table-cell">
              <span
                v-if="item.tipo === 'servico'"
                class="text-muted"
              >{{ EMPTY_VALUE }}</span>
              <span v-else>{{ item.estoque ?? 0 }}</span>
            </td>
            <td class="px-3 py-2.5 align-middle">
              <UBadge
                :color="item.ativo ? 'success' : 'neutral'"
                variant="subtle"
                size="sm"
              >
                {{ item.ativo ? 'Ativo' : 'Inativo' }}
              </UBadge>
            </td>
            <td class="px-3 py-2.5 align-middle">
              <div class="flex justify-end">
                <UDropdownMenu
                  :items="rowMenuItems(item, togglingId)"
                  :content="{ align: 'end' }"
                >
                  <UButton
                    icon="i-lucide-ellipsis"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    class="min-h-9 min-w-9 touch-manipulation"
                    :loading="togglingId === item.id"
                    aria-label="Ações do item"
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
