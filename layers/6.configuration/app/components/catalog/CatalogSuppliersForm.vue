<script setup lang="ts">
import { isSupplierDraftValid, type SupplierDraft } from '../../utils/catalog'

defineOptions({ name: 'CatalogSuppliersForm' })

const props = defineProps<{
  adding: boolean
}>()

const emit = defineEmits<{
  add: []
}>()

const draftModel = defineModel<SupplierDraft>('draft', { required: true })
const showNotes = ref(false)

watch(() => props.adding, (adding) => {
  if (!adding) showNotes.value = false
})

watch(
  () => [
    draftModel.value.nome,
    draftModel.value.telefone,
    draftModel.value.email,
    draftModel.value.observacoes
  ].join('\0'),
  (combined) => {
    if (!combined.replaceAll('\0', '')) showNotes.value = false
  }
)

function onSubmit() {
  if (!isSupplierDraftValid(draftModel.value) || props.adding) return
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
      label="Nome"
      name="nome"
      required
    >
      <UInput
        v-model="draftModel.nome"
        name="nome"
        autocomplete="organization"
        class="w-full"
        placeholder="Ex.: Auto Peças Central…"
      />
    </UFormField>

    <UFormField
      label="Telefone"
      name="telefone"
    >
      <UInput
        v-model="draftModel.telefone"
        name="telefone"
        type="tel"
        autocomplete="tel"
        inputmode="tel"
        class="w-full"
        placeholder="(16) 99999-9999…"
      />
    </UFormField>

    <UFormField
      label="E-mail"
      name="email"
    >
      <UInput
        v-model="draftModel.email"
        name="email"
        type="email"
        autocomplete="email"
        spellcheck="false"
        class="w-full"
        placeholder="contato@fornecedor.com…"
      />
    </UFormField>

    <div
      v-if="!showNotes && !draftModel.observacoes"
      class="pt-0.5"
    >
      <UButton
        type="button"
        label="Observações"
        icon="i-lucide-plus"
        size="xs"
        color="neutral"
        variant="ghost"
        @click="showNotes = true"
      />
    </div>

    <UFormField
      v-else
      label="Observações"
      name="observacoes"
    >
      <UTextarea
        v-model="draftModel.observacoes"
        name="observacoes"
        class="w-full"
        :rows="2"
      />
    </UFormField>

    <UButton
      type="submit"
      label="Adicionar fornecedor"
      icon="i-lucide-plus"
      block
      class="active:scale-[0.98]"
      :loading="adding"
      :disabled="!isSupplierDraftValid(draftModel)"
    />
  </form>
</template>
