<script setup lang="ts">
import type { VehicleFormState } from '../utils/vehicle-form'

defineOptions({ name: 'VehiclesForm' })

const state = defineModel<VehicleFormState>({ required: true })

defineProps<{
  clienteItems: { label: string, value: string }[]
  disabled?: boolean
  compact?: boolean
}>()

defineEmits<{
  submit: []
}>()
</script>

<template>
  <UForm
    :state="state"
    class="space-y-4"
    @submit="$emit('submit')"
  >
    <UFormField
      label="Proprietário"
      name="cliente_id"
      required
    >
      <USelect
        v-model="state.cliente_id"
        :items="clienteItems"
        placeholder="Selecione o proprietário"
        class="w-full"
        :disabled="disabled"
      />
    </UFormField>

    <UFormField
      label="Placa"
      name="placa"
      required
      :hint="compact ? 'Mercosul ou antiga, com ou sem hífen' : undefined"
    >
      <UInput
        v-model="state.placa"
        class="w-full font-mono uppercase"
        placeholder="ABC1D23"
        maxlength="8"
        :disabled="disabled"
      />
    </UFormField>

    <div class="grid gap-4 sm:grid-cols-2">
      <UFormField
        label="Marca"
        name="marca"
      >
        <UInput
          v-model="state.marca"
          class="w-full"
          :disabled="disabled"
        />
      </UFormField>

      <UFormField
        label="Modelo"
        name="modelo"
      >
        <UInput
          v-model="state.modelo"
          class="w-full"
          :disabled="disabled"
        />
      </UFormField>

      <UFormField
        label="Ano"
        name="ano"
      >
        <UInput
          v-model.number="state.ano"
          type="number"
          class="w-full"
          placeholder="2020"
          :disabled="disabled"
        />
      </UFormField>

      <UFormField
        label="Cor"
        name="cor"
      >
        <UInput
          v-model="state.cor"
          class="w-full"
          :disabled="disabled"
        />
      </UFormField>

      <UFormField
        label="KM Atual"
        name="km_atual"
      >
        <UInput
          v-model.number="state.km_atual"
          type="number"
          min="0"
          class="w-full font-mono tabular-nums"
          placeholder="ex.: 45000"
          :disabled="disabled"
        />
      </UFormField>
    </div>

    <UFormField
      label="Observações"
      name="observacoes"
    >
      <UTextarea
        v-model="state.observacoes"
        class="w-full"
        :rows="3"
        :disabled="disabled"
      />
    </UFormField>

    <slot />
  </UForm>
</template>
