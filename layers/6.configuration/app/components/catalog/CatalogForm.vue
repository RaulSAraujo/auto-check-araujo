<script setup lang="ts">
import type { Fornecedor } from '~~/shared/types/database'
import type { OrdemItemTipo } from '~~/shared/types/oficina'
import { ORDEM_ITEM_TIPO_SELECT_ITEMS } from '#layers/orders/app/utils/budget-select-items'
import {
  isCatalogItemDraftValid,
  type CatalogItemDraft,
  type CatalogItemRow
} from '../../utils/catalog'

defineOptions({ name: 'CatalogForm' })

const props = defineProps<{
  adding: boolean
  suppliers: Fornecedor[]
  catalogItems: Pick<CatalogItemRow, 'id' | 'nome' | 'tipo' | 'ativo'>[]
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

function onSubmit() {
  if (!isCatalogItemDraftValid(draftModel.value) || props.adding) return
  emit('add')
}
</script>

<template>
  <form
    class="space-y-4"
    autocomplete="off"
    @submit.prevent="onSubmit"
  >
    <UFormField
      label="Nome"
      name="nome"
      required
    >
      <UInput
        v-model="draftModel.nome"
        name="nome"
        autocomplete="off"
        class="w-full"
        placeholder="Ex.: Troca de óleo…"
      />
    </UFormField>

    <UFormField
      label="Tipo"
      name="tipo"
    >
      <USelect
        v-model="draftModel.tipo"
        name="tipo"
        :items="[...ORDEM_ITEM_TIPO_SELECT_ITEMS]"
        class="w-full"
      />
    </UFormField>

    <div class="grid grid-cols-2 gap-3">
      <UFormField
        label="Valor padrão"
        name="valor_padrao"
      >
        <BaseCurrencyInput
          v-model="draftModel.valor_padrao"
          empty-as-zero
        />
      </UFormField>

      <UFormField
        label="Custo"
        name="custo"
      >
        <BaseCurrencyInput
          v-model="draftModel.custo"
          empty-as-zero
        />
      </UFormField>
    </div>

    <UFormField
      v-if="showStock"
      label="Estoque"
      name="estoque"
    >
      <UInput
        v-model.number="draftModel.estoque"
        name="estoque"
        type="number"
        inputmode="numeric"
        class="w-full font-mono tabular-nums"
        min="0"
        step="1"
      />
    </UFormField>

    <UFormField
      label="Fornecedor"
      name="fornecedor"
    >
      <USelect
        v-model="supplierModel"
        name="fornecedor"
        :items="supplierItems"
        class="w-full"
      />
    </UFormField>

    <div
      v-if="showKitBuilder"
      class="space-y-2 rounded-md border border-default bg-elevated/40 p-3"
    >
      <div class="flex items-center justify-between gap-2">
        <p class="text-xs font-medium text-muted">
          Itens do kit
        </p>
        <UButton
          type="button"
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
          :label="`Item ${index + 1}`"
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
            inputmode="decimal"
            min="0.01"
            step="0.01"
            class="w-full font-mono tabular-nums"
          />
        </UFormField>
        <UButton
          type="button"
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
      type="submit"
      label="Adicionar item"
      icon="i-lucide-plus"
      block
      class="active:scale-[0.98]"
      :loading="adding"
      :disabled="!isCatalogItemDraftValid(draftModel)"
    />
  </form>
</template>
