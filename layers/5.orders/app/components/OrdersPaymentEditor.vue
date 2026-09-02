<script setup lang="ts">
import type { OrderDetail } from '../types/orders'
import { FORMA_PAGAMENTO_SELECT_ITEMS } from '~~/shared/types/oficina'
import { formatMoney } from '../utils/budget'
import type { PaymentFormState } from '../utils/payment'

defineOptions({ name: 'OrdersPaymentEditor' })

defineProps<{
  ordem: OrderDetail
  canEdit: boolean
  saving: boolean
}>()

const state = defineModel<PaymentFormState>({ required: true })

const emit = defineEmits<{
  save: []
}>()
</script>

<template>
  <section class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-lg font-semibold text-highlighted">
        Pagamento
      </h2>
      <UBadge
        :color="ordem.pago ? 'success' : 'warning'"
        variant="subtle"
        size="lg"
      >
        {{ ordem.pago ? 'Pago' : 'Pendente' }}
      </UBadge>
    </div>

    <div
      v-if="ordem.valor_total == null"
      class="rounded-md border border-dashed border-default px-4 py-3 text-sm text-muted"
    >
      Valor total indisponível. Aprove o orçamento para liberar o faturamento.
    </div>

    <template v-else>
      <div class="grid gap-3 sm:grid-cols-2 text-sm">
        <div>
          <p class="text-muted">
            Valor total
          </p>
          <p class="text-xl font-semibold font-mono tabular-nums text-highlighted">
            {{ formatMoney(Number(ordem.valor_total)) }}
          </p>
        </div>
        <div v-if="ordem.pago_em">
          <p class="text-muted">
            Pago em
          </p>
          <p class="font-mono tabular-nums text-highlighted">
            {{ formatDateTime(ordem.pago_em) }}
          </p>
        </div>
      </div>

      <div
        v-if="canEdit"
        class="space-y-3 rounded-md border border-default p-4"
      >
        <UCheckbox
          v-model="state.pago"
          label="Marcar como pago"
        />

        <UFormField
          v-if="state.pago"
          label="Forma de pagamento"
          name="forma_pagamento"
          required
        >
          <USelect
            v-model="state.forma_pagamento"
            :items="[...FORMA_PAGAMENTO_SELECT_ITEMS]"
            placeholder="Selecione"
            class="w-full sm:max-w-xs"
          />
        </UFormField>

        <UButton
          label="Salvar pagamento"
          icon="i-lucide-banknote"
          :loading="saving"
          @click="emit('save')"
        />
      </div>

      <p
        v-else-if="ordem.status !== 'concluida'"
        class="text-sm text-muted"
      >
        Pagamento disponível após concluir a OS.
      </p>
    </template>
  </section>
</template>
