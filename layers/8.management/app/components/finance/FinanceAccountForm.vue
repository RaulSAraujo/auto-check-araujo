<script setup lang="ts">
import type { FinanceiroCategoria, Fornecedor } from '~~/shared/types/database'
import {
  isFinanceAccountDraftValid,
  type FinanceAccountDraft
} from '../../utils/accounts-payable'
import { toSentenceCase } from '~~/shared/utils/text-case'

defineOptions({ name: 'FinanceAccountForm' })

const props = defineProps<{
  adding: boolean
  categories: FinanceiroCategoria[]
  suppliers: Fornecedor[]
  categoriesPending?: boolean
  suppliersPending?: boolean
}>()

const emit = defineEmits<{
  add: []
  openCategories: []
  openSuppliers: []
}>()

const draftModel = defineModel<FinanceAccountDraft>('draft', { required: true })
const showNotes = ref(false)

const activeCategories = computed(() => props.categories.filter(c => c.ativo))
const activeSuppliers = computed(() => props.suppliers.filter(s => s.ativo))

const categoryItems = computed(() =>
  activeCategories.value.map(c => ({ label: c.nome, value: c.id }))
)

/** Sentinel — empty string as Combobox value crashes Reka/Popper (parentNode null). */
const SUPPLIER_NONE = '__none__'

const supplierItems = computed(() => [
  { label: 'Sem fornecedor', value: SUPPLIER_NONE },
  ...activeSuppliers.value.map(s => ({ label: s.nome, value: s.id }))
])

const supplierModel = computed({
  get: () => draftModel.value.fornecedor_id || SUPPLIER_NONE,
  set: (value: string) => {
    draftModel.value.fornecedor_id = value === SUPPLIER_NONE ? undefined : value
  }
})

watch(() => props.adding, (adding) => {
  if (!adding) showNotes.value = false
})

watch(
  () => [
    draftModel.value.descricao,
    draftModel.value.categoria_id,
    draftModel.value.observacoes
  ].join('\0'),
  (combined) => {
    if (!combined.replaceAll('\0', '')) showNotes.value = false
  }
)

function onSubmit() {
  if (!isFinanceAccountDraftValid(draftModel.value) || props.adding) return
  emit('add')
}
</script>

<template>
  <form
    class="space-y-4"
    autocomplete="off"
    @submit.prevent="onSubmit"
  >
    <UFormField
      label="Descrição"
      name="descricao"
      required
    >
      <UInput
        v-model="draftModel.descricao"
        name="descricao"
        autocomplete="off"
        class="w-full"
        placeholder="Conta de luz — setembro…"
        @blur="draftModel.descricao = toSentenceCase(draftModel.descricao)"
      />
    </UFormField>

    <UFormField
      label="Categoria"
      name="categoria_id"
      required
    >
      <div class="flex items-center gap-2">
        <USelectMenu
          v-model="draftModel.categoria_id"
          :items="categoryItems"
          value-key="value"
          class="min-w-0 flex-1"
          placeholder="Selecione…"
          :loading="categoriesPending"
          :disabled="!categoryItems.length"
        />
        <UButton
          type="button"
          icon="i-lucide-tags"
          color="neutral"
          variant="outline"
          square
          class="shrink-0"
          aria-label="Gerenciar categorias"
          @click="emit('openCategories')"
        />
      </div>
      <template
        v-if="!categoriesPending && !categoryItems.length"
        #help
      >
        <button
          type="button"
          class="text-primary underline-offset-2 hover:underline"
          @click="emit('openCategories')"
        >
          Cadastrar categoria
        </button>
      </template>
    </UFormField>

    <UFormField
      label="Fornecedor"
      name="fornecedor_id"
    >
      <div class="flex items-center gap-2">
        <USelectMenu
          v-model="supplierModel"
          :items="supplierItems"
          value-key="value"
          class="min-w-0 flex-1"
          placeholder="Opcional…"
          :loading="suppliersPending"
        />
        <UButton
          type="button"
          icon="i-lucide-truck"
          color="neutral"
          variant="outline"
          square
          class="shrink-0"
          aria-label="Gerenciar fornecedores"
          @click="emit('openSuppliers')"
        />
      </div>
      <template
        v-if="!suppliersPending && !activeSuppliers.length"
        #help
      >
        <button
          type="button"
          class="text-primary underline-offset-2 hover:underline"
          @click="emit('openSuppliers')"
        >
          Cadastrar fornecedor
        </button>
      </template>
    </UFormField>

    <div class="grid grid-cols-2 gap-3">
      <UFormField
        label="Valor"
        name="valor"
        required
        class="min-w-0"
      >
        <BaseCurrencyInput
          v-model="draftModel.valor"
          name="valor"
        />
      </UFormField>

      <UFormField
        label="Vencimento"
        name="vencimento"
        required
        class="min-w-0"
      >
        <UInput
          v-model="draftModel.vencimento"
          type="date"
          name="vencimento"
          class="w-full"
        />
      </UFormField>
    </div>

    <div class="space-y-1.5">
      <UButton
        type="button"
        :label="showNotes || draftModel.observacoes ? 'Ocultar observações' : 'Adicionar observações'"
        size="xs"
        color="neutral"
        variant="link"
        class="h-auto px-0"
        @click="showNotes = !showNotes"
      />
      <UTextarea
        v-if="showNotes || draftModel.observacoes"
        v-model="draftModel.observacoes"
        name="observacoes"
        class="w-full"
        :rows="2"
        placeholder="Número da fatura, referência…"
        @blur="draftModel.observacoes = toSentenceCase(draftModel.observacoes)"
      />
    </div>

    <UButton
      type="submit"
      label="Adicionar conta"
      icon="i-lucide-plus"
      block
      class="active:scale-[0.98]"
      :loading="adding"
      :disabled="!isFinanceAccountDraftValid(draftModel)"
    />
  </form>
</template>
