<script setup lang="ts">
import type { FormError, FormErrorEvent } from '@nuxt/ui'
import type { OrderDetail } from '../types/orders'
import type { OrderEditState } from '../utils/order-form'
import { validateOrderEditForm } from '../utils/order-form'
import { EMPTY_VALUE } from '~~/shared/utils/empty'

defineOptions({ name: 'OrdersDetailResumoPanel' })

const state = defineModel<OrderEditState>({ required: true })

defineProps<{
  ordem: OrderDetail
  canEdit: boolean
}>()

const emit = defineEmits<{
  submit: []
}>()

function validate(formState: Partial<OrderEditState>): FormError[] {
  return validateOrderEditForm(formState)
}

function onError(event: FormErrorEvent) {
  const firstId = event.errors?.[0]?.id
  if (!firstId) return
  document.getElementById(firstId)?.focus()
}
</script>

<template>
  <UForm
    :state="state"
    :validate="validate"
    :validate-on="['blur', 'change']"
    class="space-y-5"
    @submit="emit('submit')"
    @error="onError"
  >
    <div class="space-y-2">
      <label
        for="os-reclamacao"
        class="flex items-center gap-2 text-sm font-semibold text-highlighted"
      >
        <UIcon
          name="i-lucide-message-square-text"
          class="size-4 text-muted"
          aria-hidden="true"
        />
        Reclamação do cliente
      </label>
      <UTextarea
        v-if="canEdit"
        id="os-reclamacao"
        v-model="state.reclamacao"
        class="w-full"
        variant="subtle"
        :rows="4"
        autoresize
        :maxrows="10"
        placeholder="Descreva o que o cliente reportou…"
        autocomplete="off"
        name="reclamacao"
      />
      <blockquote
        v-else
        class="rounded-lg border border-default bg-elevated/30 px-4 py-3 text-pretty leading-relaxed text-highlighted"
      >
        {{ ordem.reclamacao || EMPTY_VALUE }}
      </blockquote>
    </div>

    <UFormField
      label="Km de entrada"
      name="km_entrada"
    >
      <UInput
        v-if="canEdit"
        v-model.number="state.km_entrada"
        type="number"
        inputmode="numeric"
        min="0"
        step="1"
        variant="subtle"
        class="w-full font-mono tabular-nums"
        placeholder="Ex.: 45000"
        autocomplete="off"
        name="km_entrada"
      />
      <p
        v-else
        class="font-mono text-xl font-semibold tabular-nums text-highlighted"
      >
        {{ ordem.km_entrada != null ? new Intl.NumberFormat('pt-BR').format(ordem.km_entrada) : EMPTY_VALUE }}
      </p>
    </UFormField>

    <div class="space-y-2">
      <label
        for="os-observacoes"
        class="flex items-center gap-2 text-sm font-semibold text-highlighted"
      >
        <UIcon
          name="i-lucide-lock"
          class="size-4 text-muted"
          aria-hidden="true"
        />
        Observações internas
        <span class="text-xs font-normal text-muted">(equipe)</span>
      </label>
      <UTextarea
        v-if="canEdit"
        id="os-observacoes"
        v-model="state.observacoes"
        class="w-full"
        variant="subtle"
        :rows="2"
        autoresize
        :maxrows="6"
        placeholder="Notas que o cliente não vê…"
        autocomplete="off"
        name="observacoes"
      />
      <p
        v-else-if="ordem.observacoes"
        class="rounded-lg border border-dashed border-default px-4 py-3 text-sm text-pretty text-muted"
      >
        {{ ordem.observacoes }}
      </p>
      <p
        v-else
        class="text-sm text-muted"
      >
        {{ EMPTY_VALUE }}
      </p>
    </div>
  </UForm>
</template>
