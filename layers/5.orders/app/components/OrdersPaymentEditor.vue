<script setup lang="ts">
import type { OrderDetail } from '../types/orders'
import {
  FORMA_PAGAMENTO_LABEL,
  FORMA_PAGAMENTO_SELECT_ITEMS,
  type FormaPagamento
} from '~~/shared/types/oficina'
import { formatMoney } from '../utils/budget'
import type { PaymentFormState } from '../utils/payment'
import { paymentFormFromOrder } from '../utils/payment'

defineOptions({ name: 'OrdersPaymentEditor' })

const props = defineProps<{
  ordem: OrderDetail
  canEdit: boolean
  saving: boolean
}>()

const state = defineModel<PaymentFormState>({ required: true })

const emit = defineEmits<{
  save: []
}>()

const baseline = computed(() => paymentFormFromOrder(props.ordem))

const isDirty = computed(() =>
  state.value.pago !== baseline.value.pago
  || state.value.forma_pagamento !== baseline.value.forma_pagamento
)

const formaLabel = computed(() => {
  const value = props.ordem.forma_pagamento as FormaPagamento | null
  if (!value) return null
  return FORMA_PAGAMENTO_LABEL[value] || value
})

const canSave = computed(() => {
  if (!props.canEdit || props.saving || !isDirty.value) return false
  if (state.value.pago && !state.value.forma_pagamento) return false
  return true
})

watch(() => state.value.pago, (pago) => {
  if (!pago) {
    state.value.forma_pagamento = undefined
  }
})

function onSave() {
  if (state.value.pago && !state.value.forma_pagamento) return
  emit('save')
}
</script>

<template>
  <section
    class="space-y-3"
    aria-labelledby="os-payment-heading"
  >
    <!-- Linha 1: título + status + marcar pago + valor -->
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

    <!-- Linha 2: select + salvar — só quando marcado como pago -->
    <div
      v-if="ordem.valor_total != null && canEdit && state.pago"
      class="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <UFormField
        label="Forma de pagamento"
        name="forma_pagamento"
        class="min-w-0 w-full sm:max-w-sm"
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

      <UButton
        :label="saving ? 'Salvando…' : 'Salvar pagamento'"
        icon="i-lucide-banknote"
        color="primary"
        class="shrink-0 sm:ms-auto"
        :loading="saving"
        :disabled="!canSave"
        @click="onSave"
      />
    </div>
  </section>
</template>
