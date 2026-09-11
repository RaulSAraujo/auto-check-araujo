<script setup lang="ts">
import type { Fornecedor } from '~~/shared/types/database'
import type { OrdemItemTipo } from '~~/shared/types/oficina'
import { ORDEM_ITEM_TIPO_LABEL } from '~~/shared/types/oficina'
import { ORDEM_ITEM_TIPO_SELECT_ITEMS } from '#layers/orders/app/utils/budget-select-items'
import { formatMoney } from '~~/shared/utils/money'
import { EMPTY_VALUE } from '~~/shared/utils/empty'
import {
  CATALOG_TIPO_COLOR,
  catalogDraftFromRow,
  emptyCatalogItemDraft,
  isCatalogItemDraftValid,
  type CatalogItemDraft,
  type CatalogItemRow
} from '../../utils/catalog'

defineOptions({ name: 'CatalogTable' })

const props = defineProps<{
  items: CatalogItemRow[]
  suppliers: Fornecedor[]
  catalogItems: Pick<CatalogItemRow, 'id' | 'nome' | 'tipo' | 'ativo'>[]
  savingId: string | null
  togglingId: string | null
}>()

const emit = defineEmits<{
  save: [payload: { id: string, draft: CatalogItemDraft }]
  toggleAtivo: [payload: { id: string, ativo: boolean }]
}>()

const editingId = ref<string | null>(null)
const editDraft = reactive<CatalogItemDraft>(emptyCatalogItemDraft())

const supplierItems = computed(() => [
  { label: 'Sem fornecedor', value: '__none__' },
  ...props.suppliers
    .filter(s => s.ativo || s.id === editDraft.fornecedor_id)
    .map(s => ({ label: s.nome, value: s.id }))
])

const supplierModel = computed({
  get: () => editDraft.fornecedor_id || '__none__',
  set: (value: string) => {
    editDraft.fornecedor_id = value === '__none__' ? undefined : value
  }
})

const kitComponentOptions = computed(() =>
  props.catalogItems
    .filter(item => item.ativo && item.tipo !== 'kit' && item.id !== editingId.value)
    .map(item => ({
      label: `${item.nome} (${item.tipo === 'peca' ? 'Peça' : 'Serviço'})`,
      value: item.id
    }))
)

function startEdit(item: CatalogItemRow) {
  editingId.value = item.id
  Object.assign(editDraft, catalogDraftFromRow(item))
}

function cancelEdit() {
  editingId.value = null
}

function saveEdit(id: string) {
  if (!isCatalogItemDraftValid(editDraft)) return
  emit('save', { id, draft: { ...editDraft, kit_itens: [...editDraft.kit_itens] } })
}

function addKitLine() {
  const first = kitComponentOptions.value[0]
  if (!first) return
  editDraft.kit_itens.push({ item_id: first.value, quantidade: 1 })
}

function removeKitLine(index: number) {
  editDraft.kit_itens.splice(index, 1)
}

watch(() => props.savingId, (id) => {
  if (!id) editingId.value = null
})

watch(() => editDraft.tipo, (tipo: OrdemItemTipo) => {
  if (tipo === 'servico') {
    editDraft.estoque = null
    editDraft.kit_itens = []
  } else if (editDraft.estoque == null) {
    editDraft.estoque = 0
  }
  if (tipo !== 'kit') {
    editDraft.kit_itens = []
  }
})
</script>

<template>
  <div class="min-w-0 overflow-hidden rounded-lg border border-default bg-default shadow-sm dark:border-accented dark:bg-elevated dark:shadow-none">
    <div class="overflow-x-auto">
      <table class="w-full min-w-0 text-sm sm:min-w-[36rem]">
        <thead class="border-b border-default bg-elevated/40 text-left text-xs text-muted">
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
            <th
              class="px-3 py-2.5 font-medium text-right"
              :class="editingId ? 'table-cell' : 'hidden md:table-cell'"
            >
              Custo
            </th>
            <th
              class="px-3 py-2.5 font-medium"
              :class="editingId ? 'table-cell' : 'hidden lg:table-cell'"
            >
              Fornecedor
            </th>
            <th
              class="px-3 py-2.5 font-medium text-right"
              :class="editingId ? 'table-cell' : 'hidden sm:table-cell'"
            >
              Estoque
            </th>
            <th class="px-3 py-2.5 font-medium">
              Status
            </th>
            <th class="w-24 px-3 py-2.5" />
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <template
            v-for="item in items"
            :key="item.id"
          >
            <tr
              class="transition-colors hover:bg-elevated/40"
              :class="!item.ativo ? 'opacity-55' : ''"
            >
              <td class="px-3 py-2.5 align-top">
                <UInput
                  v-if="editingId === item.id"
                  v-model="editDraft.nome"
                  size="sm"
                  class="w-full min-w-40"
                />
                <div
                  v-else
                  class="space-y-0.5"
                >
                  <span class="font-medium text-highlighted">{{ item.nome }}</span>
                  <p
                    v-if="item.tipo === 'kit' && item.catalogo_kit_itens?.length"
                    class="text-xs text-muted"
                  >
                    {{ item.catalogo_kit_itens.length }} item(ns) no kit
                  </p>
                </div>
              </td>
              <td class="px-3 py-2.5 align-top">
                <USelect
                  v-if="editingId === item.id"
                  v-model="editDraft.tipo"
                  :items="[...ORDEM_ITEM_TIPO_SELECT_ITEMS]"
                  size="sm"
                  class="min-w-28"
                />
                <UBadge
                  v-else
                  :color="CATALOG_TIPO_COLOR[item.tipo as OrdemItemTipo]"
                  variant="subtle"
                  size="sm"
                >
                  {{ ORDEM_ITEM_TIPO_LABEL[item.tipo as OrdemItemTipo] }}
                </UBadge>
              </td>
              <td class="px-3 py-2.5 text-right font-mono tabular-nums align-top">
                <div
                  v-if="editingId === item.id"
                  class="ml-auto w-32"
                >
                  <BaseCurrencyInput
                    v-model="editDraft.valor_padrao"
                    size="sm"
                    empty-as-zero
                  />
                </div>
                <span v-else>{{ formatMoney(Number(item.valor_padrao)) }}</span>
              </td>
              <td
                class="px-3 py-2.5 text-right font-mono tabular-nums align-top text-muted"
                :class="editingId === item.id ? 'table-cell' : 'hidden md:table-cell'"
              >
                <div
                  v-if="editingId === item.id"
                  class="ml-auto w-32"
                >
                  <BaseCurrencyInput
                    v-model="editDraft.custo"
                    size="sm"
                    empty-as-zero
                  />
                </div>
                <span v-else>{{ formatMoney(Number(item.custo)) }}</span>
              </td>
              <td
                class="px-3 py-2.5 align-top"
                :class="editingId === item.id ? 'table-cell' : 'hidden lg:table-cell'"
              >
                <USelect
                  v-if="editingId === item.id"
                  v-model="supplierModel"
                  :items="supplierItems"
                  size="sm"
                  class="min-w-36"
                />
                <span
                  v-else
                  class="text-muted"
                >{{ item.fornecedores?.nome || EMPTY_VALUE }}</span>
              </td>
              <td
                class="px-3 py-2.5 text-right font-mono tabular-nums align-top"
                :class="editingId === item.id ? 'table-cell' : 'hidden sm:table-cell'"
              >
                <template v-if="editingId === item.id">
                  <UInput
                    v-if="editDraft.tipo !== 'servico'"
                    v-model.number="editDraft.estoque"
                    type="number"
                    size="sm"
                    class="ml-auto w-24 font-mono tabular-nums"
                    min="0"
                    step="1"
                  />
                  <span
                    v-else
                    class="text-muted"
                  >{{ EMPTY_VALUE }}</span>
                </template>
                <span
                  v-else-if="item.tipo === 'servico'"
                  class="text-muted"
                >{{ EMPTY_VALUE }}</span>
                <span v-else>{{ item.estoque ?? 0 }}</span>
              </td>
              <td class="px-3 py-2.5 align-top">
                <UBadge
                  :color="item.ativo ? 'success' : 'neutral'"
                  variant="subtle"
                  size="sm"
                >
                  {{ item.ativo ? 'Ativo' : 'Inativo' }}
                </UBadge>
              </td>
              <td class="px-3 py-2.5 align-top">
                <div class="flex justify-end gap-0.5">
                  <template v-if="editingId === item.id">
                    <UTooltip text="Salvar">
                      <UButton
                        icon="i-lucide-check"
                        color="success"
                        variant="ghost"
                        size="xs"
                        :loading="savingId === item.id"
                        :disabled="!isCatalogItemDraftValid(editDraft)"
                        aria-label="Salvar"
                        @click="saveEdit(item.id)"
                      />
                    </UTooltip>
                    <UTooltip text="Cancelar">
                      <UButton
                        icon="i-lucide-x"
                        color="neutral"
                        variant="ghost"
                        size="xs"
                        :disabled="savingId === item.id"
                        aria-label="Cancelar"
                        @click="cancelEdit"
                      />
                    </UTooltip>
                  </template>
                  <template v-else>
                    <UTooltip text="Editar">
                      <UButton
                        icon="i-lucide-pencil"
                        color="neutral"
                        variant="ghost"
                        size="xs"
                        aria-label="Editar"
                        @click="startEdit(item)"
                      />
                    </UTooltip>
                    <UTooltip :text="item.ativo ? 'Desativar' : 'Reativar'">
                      <UButton
                        :icon="item.ativo ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                        :color="item.ativo ? 'warning' : 'success'"
                        variant="ghost"
                        size="xs"
                        :loading="togglingId === item.id"
                        :aria-label="item.ativo ? 'Desativar' : 'Reativar'"
                        @click="emit('toggleAtivo', { id: item.id, ativo: !item.ativo })"
                      />
                    </UTooltip>
                  </template>
                </div>
              </td>
            </tr>

            <tr
              v-if="editingId === item.id && editDraft.tipo === 'kit'"
              class="bg-elevated/30"
            >
              <td
                colspan="8"
                class="px-3 py-3"
              >
                <div class="space-y-2">
                  <div class="flex items-center justify-between gap-2">
                    <p class="text-xs font-medium text-muted">
                      Itens do kit
                    </p>
                    <UButton
                      label="Incluir"
                      icon="i-lucide-plus"
                      size="xs"
                      variant="soft"
                      :disabled="!kitComponentOptions.length"
                      @click="addKitLine"
                    />
                  </div>
                  <div
                    v-for="(line, index) in editDraft.kit_itens"
                    :key="`${line.item_id}-${index}`"
                    class="flex flex-col gap-2 sm:flex-row sm:items-end"
                  >
                    <USelect
                      v-model="line.item_id"
                      :items="kitComponentOptions"
                      size="sm"
                      class="flex-1"
                    />
                    <UInput
                      v-model.number="line.quantidade"
                      type="number"
                      size="sm"
                      min="0.01"
                      step="0.01"
                      class="w-24 font-mono tabular-nums"
                    />
                    <UButton
                      icon="i-lucide-trash-2"
                      color="error"
                      variant="ghost"
                      size="xs"
                      aria-label="Remover item do kit"
                      @click="removeKitLine(index)"
                    />
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>
