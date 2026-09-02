<script setup lang="ts">
import type { Fornecedor } from '~~/shared/types/database'
import type { OrdemItemTipo } from '~~/shared/types/oficina'
import { ORDEM_ITEM_TIPO_SELECT_ITEMS } from '#layers/orders/app/utils/budget-select-items'
import {
  isCatalogItemDraftValid,
  type CatalogItemDraft,
  type CatalogItemRow
} from '../utils/catalog'

defineOptions({ name: 'CatalogForm' })

const props = defineProps<{
  adding: boolean
  suppliers: Fornecedor[]
  catalogItems: CatalogItemRow[]
}>()

const emit = defineEmits<{
  add: []
}>()

const draftModel = defineModel<CatalogItemDraft>('draft', { required: true })

const supplierItems = computed(() => [
  { label: 'Sem fornecedor', value: '__none__' },
  ...props.suppliers
    .filter(s => s.ativo)
    .map(s => ({ label: s.nome, value: s.id }))
])

const supplierModel = computed({
  get: () => draftModel.value.fornecedor_id || '__none__',
  set: (value: string) => {
    draftModel.value.fornecedor_id = value === '__none__' ? undefined : value
  }
})

const kitComponentOptions = computed(() =>
  props.catalogItems
    .filter(item => item.ativo && item.tipo !== 'kit')
    .map(item => ({
      label: `${item.nome} (${item.tipo === 'peca' ? 'Peça' : 'Serviço'})`,
      value: item.id
    }))
)

const showStock = computed(() => draftModel.value.tipo !== 'servico')
const showKitBuilder = computed(() => draftModel.value.tipo === 'kit')

watch(() => draftModel.value.tipo, (tipo: OrdemItemTipo) => {
  if (tipo === 'servico') {
    draftModel.value.estoque = null
    draftModel.value.kit_itens = []
  } else if (draftModel.value.estoque == null) {
    draftModel.value.estoque = 0
  }
  if (tipo !== 'kit') {
    draftModel.value.kit_itens = []
  }
})

function addKitLine() {
  const first = kitComponentOptions.value[0]
  if (!first) return
  draftModel.value.kit_itens.push({
    item_id: first.value,
    quantidade: 1
  })
}

function removeKitLine(index: number) {
  draftModel.value.kit_itens.splice(index, 1)
}
</script>

<template>
  <BasePanel title="Adicionar ao catálogo">
    <div class="space-y-3">
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <UFormField
          label="Nome"
          required
        >
          <UInput
            v-model="draftModel.nome"
            class="w-full"
            placeholder="Ex.: Troca de óleo"
          />
        </UFormField>

        <UFormField label="Tipo">
          <USelect
            v-model="draftModel.tipo"
            :items="[...ORDEM_ITEM_TIPO_SELECT_ITEMS]"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Valor padrão (R$)">
          <UInput
            v-model.number="draftModel.valor_padrao"
            type="number"
            class="w-full font-mono"
            min="0"
            step="0.01"
          />
        </UFormField>

        <UFormField label="Custo (R$)">
          <UInput
            v-model.number="draftModel.custo"
            type="number"
            class="w-full font-mono"
            min="0"
            step="0.01"
          />
        </UFormField>

        <UFormField
          v-if="showStock"
          label="Estoque"
        >
          <UInput
            v-model.number="draftModel.estoque"
            type="number"
            class="w-full font-mono"
            min="0"
            step="1"
          />
        </UFormField>

        <UFormField label="Fornecedor">
          <USelect
            v-model="supplierModel"
            :items="supplierItems"
            class="w-full"
          />
        </UFormField>
      </div>

      <div
        v-if="showKitBuilder"
        class="space-y-2 rounded-md border border-default p-3"
      >
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

        <p
          v-if="!kitComponentOptions.length"
          class="text-sm text-muted"
        >
          Cadastre serviços ou peças antes de montar um kit.
        </p>

        <div
          v-for="(line, index) in draftModel.kit_itens"
          :key="`${line.item_id}-${index}`"
          class="flex flex-col gap-2 sm:flex-row sm:items-end"
        >
          <UFormField
            label="Item"
            class="flex-1"
          >
            <USelect
              v-model="line.item_id"
              :items="kitComponentOptions"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Qtd"
            class="sm:w-24"
          >
            <UInput
              v-model.number="line.quantidade"
              type="number"
              min="0.01"
              step="0.01"
              class="w-full font-mono"
            />
          </UFormField>
          <UButton
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            size="sm"
            aria-label="Remover item do kit"
            @click="removeKitLine(index)"
          />
        </div>
      </div>

      <UButton
        label="Adicionar"
        icon="i-lucide-plus"
        :loading="adding"
        :disabled="!isCatalogItemDraftValid(draftModel)"
        @click="emit('add')"
      />
    </div>
  </BasePanel>
</template>
