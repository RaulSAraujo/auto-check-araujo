<script setup lang="ts">
import { formatMoney } from '~~/shared/utils/money'
import {
  PRICING_EXAMPLE_PART_COST,
  PRICING_EXAMPLE_SALE,
  PRICING_FIELD_HELP,
  applyMarkup,
  calcChargeToNet,
  calcNetAfterFee,
  calcSuggestedHourlyRate,
  isPricingDraftValid,
  type PricingParamsDraft
} from '../../utils/pricing'
import PricingHelpIcon from './PricingHelpIcon.vue'

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
const canSave = computed(() => isPricingDraftValid(draft.value))
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
        <UFormField name="valor_hora">
          <template #label>
            <span class="inline-flex items-center gap-1 whitespace-nowrap">
              <PricingHelpIcon
                label="Custo da hora"
                :text="PRICING_FIELD_HELP.valor_hora"
              />
              Custo da hora
            </span>
          </template>
          <BaseCurrencyInput
            v-model="draft.valor_hora"
            name="valor_hora"
            empty-as-zero
            size="lg"
          />
        </UFormField>

        <UFormField name="custo_fixo_mensal">
          <template #label>
            <span class="inline-flex items-center gap-1 whitespace-nowrap">
              <PricingHelpIcon
                label="Custo fixo mensal"
                :text="PRICING_FIELD_HELP.custo_fixo_mensal"
              />
              Custo fixo mensal
            </span>
          </template>
          <BaseCurrencyInput
            v-model="draft.custo_fixo_mensal"
            name="custo_fixo_mensal"
            empty-as-zero
            size="lg"
          />
        </UFormField>

        <UFormField name="margem_alvo">
          <template #label>
            <span class="inline-flex items-center gap-1 whitespace-nowrap">
              <PricingHelpIcon
                label="Lucro alvo (%)"
                :text="PRICING_FIELD_HELP.margem_alvo"
              />
              Lucro alvo (%)
            </span>
          </template>
          <UInput
            v-model.number="draft.margem_alvo"
            type="number"
            inputmode="decimal"
            autocomplete="off"
            min="0"
            max="100"
            step="0.1"
            class="min-h-11 w-full font-mono tabular-nums"
          />
        </UFormField>

        <UFormField name="horas_produtivas_mes">
          <template #label>
            <span class="inline-flex items-center gap-1 whitespace-nowrap">
              <PricingHelpIcon
                label="Horas/mês"
                :text="PRICING_FIELD_HELP.horas_produtivas_mes"
              />
              Horas/mês
            </span>
          </template>
          <UInput
            v-model.number="draft.horas_produtivas_mes"
            type="number"
            inputmode="numeric"
            autocomplete="off"
            min="1"
            step="1"
            class="min-h-11 w-full font-mono tabular-nums"
          />
        </UFormField>
      </div>

      <div class="mt-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="inline-flex items-center gap-1 text-sm font-medium text-highlighted whitespace-nowrap">
              <PricingHelpIcon
                label="Hora cobrada sugerida"
                :text="PRICING_FIELD_HELP.hora_cobrada"
              />
              Hora cobrada sugerida
            </p>
            <p class="mt-1 font-mono text-xs leading-5 tabular-nums text-muted">
              ({{ formatMoney(draft.valor_hora) }}
              + {{ formatMoney(draft.custo_fixo_mensal) }}
              ÷ {{ draft.horas_produtivas_mes }} h)
              × (1 + {{ draft.margem_alvo }}%)
            </p>
          </div>
          <p class="font-mono text-2xl font-semibold tabular-nums text-primary sm:text-right">
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
        <UFormField name="markup_pecas">
          <template #label>
            <span class="inline-flex items-center gap-1 whitespace-nowrap">
              <PricingHelpIcon
                label="Acréscimo (%)"
                :text="PRICING_FIELD_HELP.markup_pecas"
              />
              Acréscimo (%)
            </span>
          </template>
          <UInput
            v-model.number="draft.markup_pecas"
            type="number"
            inputmode="decimal"
            autocomplete="off"
            min="0"
            step="0.1"
            class="min-h-11 w-full font-mono tabular-nums"
          />
        </UFormField>

        <UFormField name="precificacao_automatica">
          <template #label>
            <span class="inline-flex items-center gap-1 whitespace-nowrap">
              <PricingHelpIcon
                label="Preço automático"
                :text="PRICING_FIELD_HELP.precificacao_automatica"
              />
              Preço automático
            </span>
          </template>
          <div class="flex min-h-11 items-center rounded-md border border-default px-3">
            <USwitch
              v-model="draft.precificacao_automatica"
              aria-label="Preço automático"
            />
          </div>
        </UFormField>
      </div>

      <div class="mt-4 rounded-lg border border-default bg-elevated/50 px-4 py-3">
        <p class="text-sm text-muted">
          Exemplo: custo {{ formatMoney(PRICING_EXAMPLE_PART_COST) }}
          → preço sugerido
          <span class="font-mono font-semibold tabular-nums text-highlighted">{{ formatMoney(suggestedPartPrice) }}</span>
        </p>
      </div>
    </BasePanel>

    <BasePanel>
      <template #header>
        <p class="text-xs font-semibold uppercase tracking-wide text-muted">
          Taxas de cartão
        </p>
      </template>

      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField name="taxa_cartao_debito">
          <template #label>
            <span class="inline-flex items-center gap-1 whitespace-nowrap">
              <PricingHelpIcon
                label="Taxa no débito (%)"
                :text="PRICING_FIELD_HELP.taxa_cartao_debito"
              />
              Taxa no débito (%)
            </span>
          </template>
          <UInput
            v-model.number="draft.taxa_cartao_debito"
            type="number"
            inputmode="decimal"
            autocomplete="off"
            min="0"
            max="99.99"
            step="0.01"
            class="min-h-11 w-full font-mono tabular-nums"
          />
        </UFormField>

        <UFormField name="taxa_cartao_credito">
          <template #label>
            <span class="inline-flex items-center gap-1 whitespace-nowrap">
              <PricingHelpIcon
                label="Taxa no crédito (%)"
                :text="PRICING_FIELD_HELP.taxa_cartao_credito"
              />
              Taxa no crédito (%)
            </span>
          </template>
          <UInput
            v-model.number="draft.taxa_cartao_credito"
            type="number"
            inputmode="decimal"
            autocomplete="off"
            min="0"
            max="99.99"
            step="0.01"
            class="min-h-11 w-full font-mono tabular-nums"
          />
        </UFormField>
      </div>

      <div class="mt-4 grid gap-3 rounded-lg border border-default bg-elevated/50 px-4 py-3 text-sm sm:grid-cols-2">
        <div class="space-y-1">
          <p class="text-muted">
            Na venda de {{ formatMoney(PRICING_EXAMPLE_SALE) }}, você recebe:
          </p>
          <p class="font-mono tabular-nums text-highlighted">
            Débito {{ formatMoney(debitNet) }}<br>
            Crédito {{ formatMoney(creditNet) }}
          </p>
        </div>
        <div class="space-y-1">
          <p class="text-muted">
            Para receber {{ formatMoney(PRICING_EXAMPLE_SALE) }} líquidos, cobre:
          </p>
          <p class="font-mono tabular-nums text-highlighted">
            Débito {{ formatMoney(debitCharge) }}<br>
            Crédito {{ formatMoney(creditCharge) }}
          </p>
        </div>
      </div>
    </BasePanel>

    <div class="sm:hidden">
      <UButton
        label="Salvar parâmetros"
        icon="i-lucide-save"
        :loading="saving"
        :disabled="!canSave"
        block
        class="min-h-11 touch-manipulation"
        @click="emit('save')"
      />
    </div>
  </div>
</template>
