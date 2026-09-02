<script setup lang="ts">
import { isSupplierDraftValid, type SupplierDraft } from '../utils/catalog'

defineOptions({ name: 'CatalogSuppliersForm' })

defineProps<{
  adding: boolean
}>()

const emit = defineEmits<{
  add: []
}>()

const draftModel = defineModel<SupplierDraft>('draft', { required: true })
</script>

<template>
  <BasePanel title="Adicionar fornecedor">
    <div class="space-y-3">
      <UFormField
        label="Nome"
        required
      >
        <UInput
          v-model="draftModel.nome"
          class="w-full"
          placeholder="Ex.: Auto Peças Central"
        />
      </UFormField>

      <UFormField label="Telefone">
        <UInput
          v-model="draftModel.telefone"
          class="w-full"
          placeholder="(16) 99999-9999"
        />
      </UFormField>

      <UFormField label="E-mail">
        <UInput
          v-model="draftModel.email"
          type="email"
          class="w-full"
          placeholder="contato@fornecedor.com"
        />
      </UFormField>

      <UFormField label="Observações">
        <UTextarea
          v-model="draftModel.observacoes"
          class="w-full"
          :rows="2"
        />
      </UFormField>

      <UButton
        label="Adicionar"
        icon="i-lucide-plus"
        :loading="adding"
        :disabled="!isSupplierDraftValid(draftModel)"
        @click="emit('add')"
      />
    </div>
  </BasePanel>
</template>
