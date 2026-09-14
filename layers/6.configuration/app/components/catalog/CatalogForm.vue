<script setup lang="ts">
import type { Fornecedor } from '~~/shared/types/database'
import type { OrdemItemTipo } from '~~/shared/types/oficina'
import { ORDEM_ITEM_TIPO_SELECT_ITEMS } from '#layers/orders/app/utils/budget-select-items'
import { formatMoney } from '~~/shared/utils/money'
import {
  applyServiceSuggestedPrice,
  clearServicePriceManual,
  isCatalogItemDraftValid,
  markServicePriceManual,
  type CatalogItemDraft,
  type CatalogItemRow
} from '../../utils/catalog'
import {
  SERVICE_TECHNICAL_LEVEL_ITEMS,
  calcServiceSuggestedPrice,
  calcSuggestedHourlyRate,
  emptyPricingDraft,
  pricingDraftFromRow,
  serviceTechnicalFactor,
  type PricingParamsRow
} from '../../utils/pricing'

defineOptions({ name: 'CatalogForm' })

const props = withDefaults(defineProps<{
  saving: boolean
  mode?: 'create' | 'edit'
  excludeItemId?: string | null
  suppliers: Fornecedor[]
  catalogItems: Pick<CatalogItemRow, 'id' | 'nome' | 'tipo' | 'ativo'>[]
}>(), {
  mode: 'create',
  excludeItemId: null
})

const emit = defineEmits<{
  submit: []
}>()

const draftModel = defineModel<CatalogItemDraft>('draft', { required: true })

const { params } = usePricingParams()

const pricingDraft = computed(() => {
  const row = params.value as PricingParamsRow | null
  return row ? pricingDraftFromRow(row) : emptyPricingDraft()
})
const hourlyRate = computed(() => calcSuggestedHourlyRate(pricingDraft.value))
const suggestedPrice = computed(() => {
  const hours = Number(draftModel.value.horas_estimadas)
  if (!hours || hours <= 0) return null
  return calcServiceSuggestedPrice({
    hours,
    hourlyRate: hourlyRate.value,
    minimumServicePrice: pricingDraft.value.valor_minimo_servico,
    technicalFactor: serviceTechnicalFactor(pricingDraft.value, draftModel.value.nivel_tecnico)
  })
})

const supplierItems = computed(() => [
  { label: 'Sem fornecedor', value: '__none__' },
  ...props.suppliers
    .filter(s => s.ativo || s.id === draftModel.value.fornecedor_id)
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
    .filter(item =>
      item.ativo
      && item.tipo !== 'kit'
      && item.id !== props.excludeItemId
    )
    .map(item => ({
      label: `${item.nome} (${item.tipo === 'peca' ? 'Peça' : 'Serviço'})`,
      value: item.id
    }))
)

const showStock = computed(() => draftModel.value.tipo !== 'servico')
const showKitBuilder = computed(() => draftModel.value.tipo === 'kit')
const showServiceHours = computed(() => draftModel.value.tipo === 'servico')
const isEdit = computed(() => props.mode === 'edit')

watch(suggestedPrice, (value) => {
  if (value != null) applyServiceSuggestedPrice(draftModel.value, value)
})

watch(() => draftModel.value.tipo, (tipo: OrdemItemTipo) => {
  if (tipo === 'servico') {
    draftModel.value.estoque = null
    draftModel.value.custo = 0
    draftModel.value.kit_itens = []
  } else {
    draftModel.value.horas_estimadas = null
    draftModel.value.preco_manual = false
    if (draftModel.value.estoque == null) {
      draftModel.value.estoque = 0
    }
  }
  if (tipo !== 'kit') {
    draftModel.value.kit_itens = []
  }
})

function onHoursUpdate(value: number | null) {
  draftModel.value.horas_estimadas = value == null || Number.isNaN(Number(value))
    ? null
    : Number(value)
}

function onValorPadraoUpdate(value: number | undefined) {
  markServicePriceManual(draftModel.value, value ?? 0, suggestedPrice.value ?? 0)
}

function onUseSuggestedPrice() {
  if (suggestedPrice.value != null) {
    clearServicePriceManual(draftModel.value, suggestedPrice.value)
  }
}

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
  if (!isCatalogItemDraftValid(draftModel.value) || props.saving) return
  emit('submit')
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

    <div
      v-if="showServiceHours"
      class="space-y-3 rounded-md border border-default bg-elevated/40 p-3"
    >
      <UFormField
        label="Horas estimadas"
        name="horas_estimadas"
        hint="Base para a sugestão de preço e para planejar a agenda"
      >
        <UInput
          :model-value="draftModel.horas_estimadas ?? undefined"
          name="horas_estimadas"
          type="number"
          inputmode="decimal"
          min="0"
          step="0.25"
          class="w-full font-mono tabular-nums"
          placeholder="Ex.: 1,5"
          @update:model-value="onHoursUpdate(Number($event))"
        />
      </UFormField>
      <UFormField
        label="Nível técnico"
        name="nivel_tecnico"
        hint="Considera especialização, risco e ferramentas necessárias"
      >
        <USelect
          v-model="draftModel.nivel_tecnico"
          name="nivel_tecnico"
          :items="[...SERVICE_TECHNICAL_LEVEL_ITEMS]"
          class="w-full"
        />
      </UFormField>
      <p
        v-if="suggestedPrice != null"
        class="font-mono text-xs tabular-nums text-muted"
      >
        {{ draftModel.horas_estimadas }} h × {{ formatMoney(hourlyRate) }}
        × {{ serviceTechnicalFactor(pricingDraft, draftModel.nivel_tecnico) }}
        → {{ formatMoney(suggestedPrice) }}
      </p>
      <UButton
        v-if="draftModel.preco_manual && suggestedPrice != null"
        type="button"
        size="xs"
        color="neutral"
        variant="soft"
        label="Usar preço sugerido"
        @click="onUseSuggestedPrice"
      />
    </div>

    <div
      class="grid gap-3"
      :class="showStock ? 'grid-cols-2' : 'grid-cols-1'"
    >
      <UFormField
        label="Valor padrão"
        name="valor_padrao"
        :hint="draftModel.preco_manual && showServiceHours ? 'Preço manual' : undefined"
      >
        <BaseCurrencyInput
          :model-value="draftModel.valor_padrao"
          empty-as-zero
          @update:model-value="onValorPadraoUpdate"
        />
      </UFormField>

      <UFormField
        v-if="showStock"
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
      :label="isEdit ? 'Salvar alterações' : 'Adicionar item'"
      :icon="isEdit ? 'i-lucide-check' : 'i-lucide-plus'"
      block
      class="min-h-11 touch-manipulation active:scale-[0.98]"
      :loading="saving"
      :disabled="!isCatalogItemDraftValid(draftModel)"
    />
  </form>
</template>
