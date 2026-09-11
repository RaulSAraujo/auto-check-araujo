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
</script>

<template>
  <BasePanel>
    <template #header>
      <h2 class="text-sm font-semibold uppercase tracking-widest text-muted">
        Novo fornecedor
      </h2>
    </template>

    <div class="space-y-3">
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
          placeholder="Ex.: Auto Peças Central"
        />
      </UFormField>

      <UFormField
        label="Telefone"
        name="telefone"
      >
        <UInput
          v-model="draftModel.telefone"
          name="telefone"
          autocomplete="tel"
          class="w-full"
          placeholder="(16) 99999-9999"
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
          class="w-full"
          placeholder="contato@fornecedor.com"
        />
      </UFormField>

      <div
        v-if="!showNotes && !draftModel.observacoes"
        class="pt-0.5"
      >
        <UButton
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
        label="Adicionar fornecedor"
        icon="i-lucide-plus"
        block
        class="active:scale-[0.98]"
        :loading="adding"
        :disabled="!isSupplierDraftValid(draftModel)"
        @click="emit('add')"
      />
    </div>
  </BasePanel>
</template>
