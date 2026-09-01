<script setup lang="ts">
import type { OrderFormState } from '../utils/order-form'
import { ORDER_ROUTES } from '../utils/order-routes'

defineProps<{
  state: OrderFormState
  veiculoItems: { label: string, value: string }[]
  loading: boolean
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
      label="Veículo"
      name="veiculo_id"
      required
    >
      <USelect
        v-model="state.veiculo_id"
        :items="veiculoItems"
        placeholder="Selecione pela placa"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Reclamação / motivo"
      name="reclamacao"
    >
      <UTextarea
        v-model="state.reclamacao"
        class="w-full"
        :rows="3"
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
        placeholder="Ex.: 45000"
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
      />
    </UFormField>

    <div class="flex gap-2">
      <UButton
        type="submit"
        label="Abrir OS"
        :loading="loading"
      />
      <UButton
        :to="ORDER_ROUTES.list"
        label="Cancelar"
        color="neutral"
        variant="ghost"
      />
    </div>
  </UForm>
</template>
