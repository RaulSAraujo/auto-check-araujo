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
}>()

const state = defineModel<PaymentFormState>({ required: true })

const formaLabel = computed(() => {
  const value = props.ordem.forma_pagamento as FormaPagamento | null
  if (!value) return null
  return FORMA_PAGAMENTO_LABEL[value] || value
})

watch(() => state.value.pago, (pago) => {
  if (!pago) {
    state.value.forma_pagamento = undefined
  }
})
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
        {{ formatMoney(Number(ordem.valor_total)) }}
      </p>
    </div>

    <div
      v-if="ordem.valor_total != null && canEdit && state.pago"
      class="sm:max-w-sm"
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
    </div>
  </section>
</template>
