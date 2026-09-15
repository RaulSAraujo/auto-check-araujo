<script setup lang="ts">
import type { OrderDetail } from '../types/orders'
import {
  FORMA_PAGAMENTO_LABEL,
  FORMA_PAGAMENTO_SELECT_ITEMS,
  type FormaPagamento
} from '~~/shared/types/oficina'
import { formatMoney } from '../utils/budget'
import type { PaymentFormState } from '../utils/payment'

defineOptions({ name: 'OrdersPaymentEditor' })

const props = defineProps<{
  ordem: OrderDetail
  canEdit: boolean
  suggestedCharge: number
  suggestedFee: number | null
}>()

const emit = defineEmits<{
  'apply-suggested': []
  'charge-touch': []
}>()

const state = defineModel<PaymentFormState>({ required: true })

const installmentItems = Array.from({ length: 12 }, (_, index) => ({
  label: `${index + 1}x`,
  value: index + 1
}))
const selectedInstallments = computed({
  get: () => state.value.parcelas ?? undefined,
  set: (value: number | undefined) => {
    state.value.parcelas = value ?? null
  }
})

const formaLabel = computed(() => {
  const value = props.ordem.forma_pagamento as FormaPagamento | null
  if (!value) return null
  return FORMA_PAGAMENTO_LABEL[value] || value
})

const budgetTotal = computed(() => Number(props.ordem.valor_total) || 0)

const chargeDiffers = computed(() => {
  if (state.value.valor_cobrado == null) return false
  return Number(state.value.valor_cobrado) !== Number(props.suggestedCharge)
})
const formattedSuggestedFee = computed(() => props.suggestedFee == null
  ? null
  : `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(props.suggestedFee)}%`
)

function onChargeInput(value: number | undefined) {
  state.value.valor_cobrado = value ?? 0
  emit('charge-touch')
}
</script>

<template>
  <section
    class="space-y-3"
    aria-labelledby="os-payment-heading"
  >
    <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
      <div class="flex min-w-0 flex-wrap items-center gap-2.5">
        <h2
          id="os-payment-heading"
          class="text-lg font-semibold text-highlighted"
        >
          Pagamento
        </h2>
        <UBadge
          :color="ordem.pago ? 'success' : 'warning'"
          variant="subtle"
          size="sm"
        >
          {{ ordem.pago ? 'Pago' : 'Pendente' }}
        </UBadge>
      </div>

      <UCheckbox
        v-if="ordem.valor_total != null && canEdit"
        v-model="state.pago"
        label="Marcar como pago"
        name="pago"
      />

      <p
        v-else-if="ordem.valor_total == null"
        class="text-sm text-muted"
      >
        Aprove o orçamento para liberar o valor.
      </p>

      <p
        v-else-if="!canEdit && ordem.status !== 'concluida'"
        class="text-sm text-muted"
      >
        Conclua a OS para registrar.
      </p>

      <p
        v-else-if="ordem.pago && formaLabel"
        class="text-sm text-muted"
      >
        {{ formaLabel }}
        <span v-if="ordem.pago_em">
          · {{ formatDateTime(ordem.pago_em) }}
        </span>
      </p>

      <p
        v-if="ordem.valor_total != null"
        class="ms-auto shrink-0 font-mono text-xl font-semibold tabular-nums text-highlighted sm:text-2xl"
      >
        {{ formatMoney(budgetTotal) }}
      </p>
    </div>

    <div
      v-if="ordem.valor_total != null && canEdit && state.pago"
      class="grid gap-3 sm:max-w-3xl sm:grid-cols-3"
    >
      <UFormField
        label="Forma de pagamento"
        name="forma_pagamento"
        class="w-full"
      >
        <USelect
          v-model="state.forma_pagamento"
          :items="[...FORMA_PAGAMENTO_SELECT_ITEMS]"
          placeholder="Selecionar…"
          class="w-full"
          autocomplete="off"
          aria-label="Forma de pagamento"
        />
      </UFormField>

      <UFormField
        v-if="state.forma_pagamento === 'cartao_credito'"
        label="Parcelas"
        name="parcelas"
      >
        <USelect
          v-model="selectedInstallments"
          :items="installmentItems"
          class="w-full"
          autocomplete="off"
          aria-label="Quantidade de parcelas"
        />
      </UFormField>

      <UFormField
        label="Valor cobrado"
        name="valor_cobrado"
      >
        <div class="relative">
          <BaseCurrencyInput
            :model-value="state.valor_cobrado ?? 0"
            empty-as-zero
            name="valor_cobrado"
            @update:model-value="onChargeInput"
          />
          <UTooltip :text="state.forma_pagamento?.startsWith('cartao') ? 'A sugestão já inclui a taxa do cartão.' : 'O valor pode diferir do total do orçamento.'">
            <UIcon
              name="i-lucide-info"
              class="absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted"
              aria-label="Informação sobre o valor cobrado"
            />
          </UTooltip>
        </div>
      </UFormField>

      <div class="flex flex-wrap items-center gap-2 sm:col-span-3">
        <p class="whitespace-nowrap font-mono text-xs tabular-nums text-muted">
          <span class="sm:hidden">
            {{ formatMoney(budgetTotal) }}
            <template v-if="state.forma_pagamento">
              <template v-if="formattedSuggestedFee"> · taxa {{ formattedSuggestedFee }}</template>
              → {{ formatMoney(suggestedCharge) }}
            </template>
          </span>
          <span class="hidden sm:inline">
            Orçamento {{ formatMoney(budgetTotal) }}
            <template v-if="state.forma_pagamento">
              <template v-if="formattedSuggestedFee"> · taxa {{ formattedSuggestedFee }}</template>
              · sugerido {{ formatMoney(suggestedCharge) }}
            </template>
          </span>
        </p>
        <UButton
          v-if="chargeDiffers && state.forma_pagamento"
          type="button"
          size="xs"
          color="neutral"
          variant="soft"
          label="Usar sugestão"
          @click="emit('apply-suggested')"
        />
      </div>
    </div>

    <p
      v-else-if="ordem.pago && ordem.valor_cobrado != null"
      class="text-sm text-muted"
    >
      Cobrado
      <span class="font-mono font-medium tabular-nums text-highlighted">
        {{ formatMoney(Number(ordem.valor_cobrado)) }}
      </span>
      <template v-if="Number(ordem.valor_cobrado) !== budgetTotal">
        · orçamento {{ formatMoney(budgetTotal) }}
      </template>
      <template v-if="ordem.forma_pagamento === 'cartao_credito' && ordem.parcelas">
        · {{ ordem.parcelas }}x
      </template>
    </p>
  </section>
</template>
