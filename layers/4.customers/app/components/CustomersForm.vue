<script setup lang="ts">
import type { CustomerFormState } from '../utils/customer-form'

defineOptions({ name: 'CustomersForm' })

const state = defineModel<CustomerFormState>({ required: true })

defineProps<{
  disabled?: boolean
  compact?: boolean
}>()

defineEmits<{
  submit: []
  cancel: []
}>()
</script>

<template>
  <UForm
    :state="state"
    class="space-y-4"
    @submit="$emit('submit')"
  >
    <div :class="compact ? 'space-y-4' : 'grid gap-4 sm:grid-cols-2'">
      <UFormField
        label="Nome"
        name="nome"
        required
        :class="{ 'sm:col-span-2': !compact }"
      >
        <UInput
          v-model="state.nome"
          class="w-full"
          placeholder="Nome completo ou razão social"
          :disabled="disabled"
        />
      </UFormField>

      <UFormField
        label="Telefones"
        name="telefones"
        hint="Enter para adicionar"
        :class="{ 'sm:col-span-2': !compact }"
      >
        <UInputTags
          v-model="state.telefones"
          class="w-full"
          placeholder="(16) 99999-9999"
          :disabled="disabled"
          add-on-blur
        />
      </UFormField>

      <UFormField
        label="E-mails"
        name="emails"
        hint="Enter para adicionar"
        :class="{ 'sm:col-span-2': !compact }"
      >
        <UInputTags
          v-model="state.emails"
          class="w-full"
          placeholder="email@exemplo.com"
          :disabled="disabled"
          add-on-blur
        />
      </UFormField>

      <UFormField
        label="Documento"
        name="documento"
        :hint="compact ? 'CPF ou CNPJ' : undefined"
        :class="{ 'sm:col-span-2': !compact }"
      >
        <UInput
          v-model="state.documento"
          class="w-full"
          placeholder="CPF ou CNPJ"
          :disabled="disabled"
        />
      </UFormField>

      <UFormField
        label="Status"
        name="ativo"
      >
        <USelect
          v-model="state.ativo"
          class="w-full"
          :disabled="disabled"
          :items="[
            { label: 'Ativo', value: true },
            { label: 'Inativo', value: false }
          ]"
        />
      </UFormField>

      <UFormField
        label="Observações"
        name="observacoes"
        :class="{ 'sm:col-span-2': !compact }"
      >
        <UTextarea
          v-model="state.observacoes"
          class="w-full"
          :rows="3"
          :disabled="disabled"
        />
      </UFormField>
    </div>

    <slot />
  </UForm>
</template>
