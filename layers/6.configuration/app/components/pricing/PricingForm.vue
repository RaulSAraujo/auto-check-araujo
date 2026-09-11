<script setup lang="ts">
import { formatMoney } from '~~/shared/utils/money'
import {
  PRICING_EXAMPLE_PART_COST,
  PRICING_EXAMPLE_SALE,
  applyMarkup,
  calcChargeToNet,
  calcNetAfterFee,
  calcSuggestedHourlyRate,
  type PricingParamsDraft
} from '../../utils/pricing'

defineOptions({ name: 'PricingForm' })

const draft = defineModel<PricingParamsDraft>({ required: true })

defineProps<{
  saving?: boolean
}>()

const emit = defineEmits<{
  save: []
}>()

const suggestedHourly = computed(() => calcSuggestedHourlyRate(draft.value))
const suggestedPartPrice = computed(() =>
  applyMarkup(PRICING_EXAMPLE_PART_COST, draft.value.markup_pecas)
)
const debitNet = computed(() =>
  calcNetAfterFee(PRICING_EXAMPLE_SALE, draft.value.taxa_cartao_debito)
)
const creditNet = computed(() =>
  calcNetAfterFee(PRICING_EXAMPLE_SALE, draft.value.taxa_cartao_credito)
)
const debitCharge = computed(() =>
  calcChargeToNet(PRICING_EXAMPLE_SALE, draft.value.taxa_cartao_debito)
)
const creditCharge = computed(() =>
  calcChargeToNet(PRICING_EXAMPLE_SALE, draft.value.taxa_cartao_credito)
)
</script>

<template>
  <div class="space-y-6">
    <BasePanel>
      <template #header>
        <p class="text-xs font-semibold uppercase tracking-wide text-muted">
          Mão de obra
        </p>
      </template>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <UFormField
          label="Valor/hora"
          name="valor_hora"
        >
          <BaseCurrencyInput
            v-model="draft.valor_hora"
            name="valor_hora"
            empty-as-zero
          />
        </UFormField>

        <UFormField
          label="Custo fixo mensal"
          name="custo_fixo_mensal"
        >
          <BaseCurrencyInput
            v-model="draft.custo_fixo_mensal"
            name="custo_fixo_mensal"
            empty-as-zero
          />
        </UFormField>

        <UFormField
          label="Margem alvo (%)"
          name="margem_alvo"
        >
          <UInput
            v-model.number="draft.margem_alvo"
            type="number"
            min="0"
            max="100"
            step="0.1"
            class="w-full font-mono tabular-nums"
          />
        </UFormField>

        <UFormField
          label="Horas produtivas / mês"
          name="horas_produtivas_mes"
          hint="Para ratear o custo fixo"
        >
          <UInput
            v-model.number="draft.horas_produtivas_mes"
            type="number"
            min="1"
            step="1"
            class="w-full font-mono tabular-nums"
          />
        </UFormField>
      </div>

      <div class="mt-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
        <div class="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="text-sm font-medium text-highlighted">
              Hora cobrada sugerida
            </p>
            <p class="text-xs text-muted">
              Usada ao precificar serviços no orçamento.
            </p>
          </div>
          <p class="font-mono text-2xl font-semibold tabular-nums text-primary">
            {{ formatMoney(suggestedHourly) }}
          </p>
        </div>
      </div>
    </BasePanel>

    <BasePanel>
      <template #header>
        <p class="text-xs font-semibold uppercase tracking-wide text-muted">
          Peças
        </p>
      </template>

      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField
          label="Markup padrão (%)"
          name="markup_pecas"
        >
          <UInput
            v-model.number="draft.markup_pecas"
            type="number"
            min="0"
            step="0.1"
            class="w-full font-mono tabular-nums"
          />
        </UFormField>

        <UFormField
          label="Precificação automática"
          name="precificacao_automatica"
        >
          <div class="flex min-h-9 items-center">
            <USwitch
              v-model="draft.precificacao_automatica"
              label="Aplicar markup sobre custo do catálogo"
            />
          </div>
        </UFormField>
      </div>

      <div class="mt-4 rounded-lg border border-default bg-elevated/50 px-4 py-3">
        <p class="font-mono text-sm tabular-nums text-muted">
          Custo {{ formatMoney(PRICING_EXAMPLE_PART_COST) }}
          → Preço sugerido
          <span class="font-semibold text-highlighted">{{ formatMoney(suggestedPartPrice) }}</span>
        </p>
      </div>
    </BasePanel>

    <BasePanel>
      <template #header>
        <p class="text-xs font-semibold uppercase tracking-wide text-muted">
          Taxas e comissão
        </p>
      </template>

      <div class="grid gap-4 sm:grid-cols-3">
        <UFormField
          label="Taxa cartão débito (%)"
          name="taxa_cartao_debito"
        >
          <UInput
            v-model.number="draft.taxa_cartao_debito"
            type="number"
            min="0"
            max="99.99"
            step="0.01"
            class="w-full font-mono tabular-nums"
          />
        </UFormField>

        <UFormField
          label="Taxa cartão crédito (%)"
          name="taxa_cartao_credito"
        >
          <UInput
            v-model.number="draft.taxa_cartao_credito"
            type="number"
            min="0"
            max="99.99"
            step="0.01"
            class="w-full font-mono tabular-nums"
          />
        </UFormField>
      </div>

      <div class="mt-4 space-y-2 rounded-lg border border-default bg-elevated/50 px-4 py-3 text-sm">
        <p class="font-mono tabular-nums text-muted">
          Venda {{ formatMoney(PRICING_EXAMPLE_SALE) }}
          → líquido débito
          <span class="font-semibold text-highlighted">{{ formatMoney(debitNet) }}</span>
          · crédito
          <span class="font-semibold text-highlighted">{{ formatMoney(creditNet) }}</span>
        </p>
        <p class="font-mono tabular-nums text-muted">
          Para líquido {{ formatMoney(PRICING_EXAMPLE_SALE) }}
          → cobrar débito
          <span class="font-semibold text-highlighted">{{ formatMoney(debitCharge) }}</span>
          · crédito
          <span class="font-semibold text-highlighted">{{ formatMoney(creditCharge) }}</span>
        </p>
      </div>
    </BasePanel>

    <div class="flex justify-end sm:hidden">
      <UButton
        label="Salvar parâmetros"
        icon="i-lucide-save"
        :loading="saving"
        @click="emit('save')"
      />
    </div>
  </div>
</template>
