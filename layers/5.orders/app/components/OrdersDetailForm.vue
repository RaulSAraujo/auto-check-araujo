<script setup lang="ts">
import type { OrderEditState } from '../utils/order-form'

defineOptions({ name: 'OrdersDetailForm' })

const state = defineModel<OrderEditState>({ required: true })

defineProps<{
  disabled: boolean
}>()

const emit = defineEmits<{
  submit: []
}>()
</script>

<template>
  <UForm
    :state="state"
    class="space-y-4"
    @submit="emit('submit')"
  >
    <UFormField
      label="Reclamação / motivo"
      name="reclamacao"
    >
      <UTextarea
        v-model="state.reclamacao"
        class="w-full"
        :rows="3"
        :disabled="disabled"
        placeholder="O que o Cliente reportou"
      />
    </UFormField>

    <UFormField
      label="Km de entrada"
      name="km_entrada"
    >
      <UInput
        v-model.number="state.km_entrada"
        type="number"
        class="w-full"
        :disabled="disabled"
        placeholder="Ex.: 45000"
        min="0"
      />
    </UFormField>

    <UFormField
      label="Observações"
      name="observacoes"
    >
      <UTextarea
        v-model="state.observacoes"
        class="w-full"
        :rows="2"
        :disabled="disabled"
      />
    </UFormField>

    <slot />
  </UForm>
</template>
