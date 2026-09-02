<script setup lang="ts">
import type { FinanceiroCategoria, Fornecedor } from '~~/shared/types/database'
import {
  isFinanceAccountDraftValid,
  type FinanceAccountDraft
} from '../utils/accounts-payable'

defineOptions({ name: 'FinanceAccountForm' })

const props = defineProps<{
  adding: boolean
  categories: FinanceiroCategoria[]
  suppliers: Fornecedor[]
}>()

const emit = defineEmits<{
  add: []
}>()

const draftModel = defineModel<FinanceAccountDraft>('draft', { required: true })

const categoryItems = computed(() =>
  props.categories
    .filter(c => c.ativo)
    .map(c => ({ label: c.nome, value: c.id }))
)

const supplierItems = computed(() => [
  { label: 'Sem fornecedor', value: '' },
  ...props.suppliers
    .filter(s => s.ativo)
    .map(s => ({ label: s.nome, value: s.id }))
])
</script>

<template>
  <BasePanel title="Nova conta">
    <div class="space-y-3">
      <UFormField
        label="Descrição"
        required
      >
        <UInput
          v-model="draftModel.descricao"
          class="w-full"
          placeholder="Ex.: Conta de luz — setembro"
        />
      </UFormField>

      <div class="grid gap-3 sm:grid-cols-2">
        <UFormField
          label="Categoria"
          required
        >
          <USelect
            v-model="draftModel.categoria_id"
            :items="categoryItems"
            class="w-full"
            placeholder="Selecione"
          />
        </UFormField>

        <UFormField label="Fornecedor">
          <USelect
            v-model="draftModel.fornecedor_id"
            :items="supplierItems"
            class="w-full"
            placeholder="Opcional"
          />
        </UFormField>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <UFormField
          label="Valor"
          required
        >
          <UInput
            v-model.number="draftModel.valor"
            type="number"
            min="0"
            step="0.01"
            class="w-full"
            placeholder="0,00"
          />
        </UFormField>

        <UFormField
          label="Vencimento"
          required
        >
          <UInput
            v-model="draftModel.vencimento"
            type="date"
            class="w-full"
          />
        </UFormField>
      </div>

      <UFormField label="Observações">
        <UTextarea
          v-model="draftModel.observacoes"
          class="w-full"
          :rows="2"
        />
      </UFormField>

      <UButton
        label="Adicionar conta"
        icon="i-lucide-plus"
        :loading="adding"
        :disabled="!isFinanceAccountDraftValid(draftModel)"
        @click="emit('add')"
      />
    </div>
  </BasePanel>
</template>
