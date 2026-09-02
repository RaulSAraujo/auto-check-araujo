<script setup lang="ts">
import type { Fornecedor } from '~~/shared/types/database'
import type { OrdemItemTipo } from '~~/shared/types/oficina'
import { ORDEM_ITEM_TIPO_LABEL } from '~~/shared/types/oficina'
import { ORDEM_ITEM_TIPO_SELECT_ITEMS } from '#layers/orders/app/utils/budget-select-items'
import { formatMoney } from '~~/shared/utils/money'
import {
  catalogDraftFromRow,
  emptyCatalogItemDraft,
  isCatalogItemDraftValid,
  type CatalogItemDraft,
  type CatalogItemRow
} from '../utils/catalog'

defineOptions({ name: 'CatalogTable' })

const props = defineProps<{
  items: CatalogItemRow[]
  suppliers: Fornecedor[]
  catalogItems: CatalogItemRow[]
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
  <div class="overflow-x-auto rounded-lg border border-default">
    <table class="w-full text-sm">
      <thead class="border-b border-default bg-elevated/50 text-left text-xs uppercase tracking-wide text-muted">
        <tr>
          <th class="px-3 py-2 font-medium">
            Nome
          </th>
          <th class="px-3 py-2 font-medium">
            Tipo
          </th>
          <th class="px-3 py-2 font-medium text-right">
            Valor
          </th>
          <th class="px-3 py-2 font-medium text-right">
            Custo
          </th>
          <th class="px-3 py-2 font-medium">
            Fornecedor
          </th>
          <th class="px-3 py-2 font-medium text-right">
            Estoque
          </th>
          <th class="px-3 py-2 font-medium">
            Status
          </th>
          <th class="px-3 py-2 w-28" />
        </tr>
      </thead>
      <tbody class="divide-y divide-default">
        <template
          v-for="item in items"
          :key="item.id"
        >
          <tr :class="!item.ativo ? 'opacity-60' : ''">
            <td class="px-3 py-2 align-top">
              <UInput
                v-if="editingId === item.id"
                v-model="editDraft.nome"
                size="sm"
                class="w-full min-w-40"
              />
              <div
                v-else
                class="space-y-1"
              >
                <span class="text-highlighted">{{ item.nome }}</span>
                <p
                  v-if="item.tipo === 'kit' && item.catalogo_kit_itens?.length"
                  class="text-xs text-muted"
                >
                  {{ item.catalogo_kit_itens.length }} item(ns) no kit
                </p>
              </div>
            </td>
            <td class="px-3 py-2 align-top">
              <USelect
                v-if="editingId === item.id"
                v-model="editDraft.tipo"
                :items="[...ORDEM_ITEM_TIPO_SELECT_ITEMS]"
                size="sm"
                class="min-w-28"
              />
              <span
                v-else
                class="text-muted"
              >{{ ORDEM_ITEM_TIPO_LABEL[item.tipo as OrdemItemTipo] }}</span>
            </td>
            <td class="px-3 py-2 text-right font-mono tabular-nums align-top">
              <UInput
                v-if="editingId === item.id"
                v-model.number="editDraft.valor_padrao"
                type="number"
                size="sm"
                class="w-28 ml-auto font-mono"
                min="0"
                step="0.01"
              />
              <span v-else>{{ formatMoney(Number(item.valor_padrao)) }}</span>
            </td>
            <td class="px-3 py-2 text-right font-mono tabular-nums align-top">
              <UInput
                v-if="editingId === item.id"
                v-model.number="editDraft.custo"
                type="number"
                size="sm"
                class="w-28 ml-auto font-mono"
                min="0"
                step="0.01"
              />
              <span v-else>{{ formatMoney(Number(item.custo)) }}</span>
            </td>
            <td class="px-3 py-2 align-top">
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
              >{{ item.fornecedores?.nome || '—' }}</span>
            </td>
            <td class="px-3 py-2 text-right font-mono tabular-nums align-top">
              <template v-if="editingId === item.id">
                <UInput
                  v-if="editDraft.tipo !== 'servico'"
                  v-model.number="editDraft.estoque"
                  type="number"
                  size="sm"
                  class="w-24 ml-auto font-mono"
                  min="0"
                  step="1"
                />
                <span
                  v-else
                  class="text-muted"
                >—</span>
              </template>
              <span v-else-if="item.tipo === 'servico'">—</span>
              <span v-else>{{ item.estoque ?? 0 }}</span>
            </td>
            <td class="px-3 py-2 align-top">
              <UBadge
                :color="item.ativo ? 'success' : 'neutral'"
                variant="subtle"
                size="sm"
              >
                {{ item.ativo ? 'Ativo' : 'Inativo' }}
              </UBadge>
            </td>
            <td class="px-3 py-2 align-top">
              <div class="flex justify-end gap-1">
                <template v-if="editingId === item.id">
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
                  <UButton
                    icon="i-lucide-x"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    :disabled="savingId === item.id"
                    aria-label="Cancelar"
                    @click="cancelEdit"
                  />
                </template>
                <template v-else>
                  <UButton
                    icon="i-lucide-pencil"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    aria-label="Editar"
                    @click="startEdit(item)"
                  />
                  <UButton
                    :icon="item.ativo ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                    :color="item.ativo ? 'warning' : 'success'"
                    variant="ghost"
                    size="xs"
                    :loading="togglingId === item.id"
                    :aria-label="item.ativo ? 'Desativar' : 'Reativar'"
                    @click="emit('toggleAtivo', { id: item.id, ativo: !item.ativo })"
                  />
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
                  <p class="text-xs font-semibold uppercase tracking-wide text-muted">
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
                    class="w-24 font-mono"
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
</template>
