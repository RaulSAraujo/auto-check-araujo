<script setup lang="ts">
import type { VehicleFormState } from '../utils/vehicle-form'
import { formatPlacaInput } from '../utils/vehicle-form'

defineOptions({ name: 'VehiclesFormFields' })

const state = defineModel<VehicleFormState>({ required: true })

const {
  clienteItems,
  disabled = false,
  bare = false
} = defineProps<{
  clienteItems: { label: string, value: string }[]
  disabled?: boolean
  /** When true, skip the bordered panel (parent supplies chrome). */
  bare?: boolean
}>()

const showNotes = ref(Boolean(state.value.observacoes.trim()))

watch(
  () => state.value.observacoes,
  (value) => {
    if (value.trim()) showNotes.value = true
  }
)

function setPlaca(value: string) {
  state.value.placa = formatPlacaInput(value)
}
</script>

<template>
  <component
    :is="bare ? 'div' : 'section'"
    :class="bare
      ? undefined
      : 'scroll-mt-28 rounded-lg border border-default bg-default p-4 shadow-sm dark:shadow-none sm:p-5'"
  >
    <div class="space-y-4">
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
        hint="Mercosul ou antiga"
      >
        <UInput
          :model-value="state.placa"
          class="w-full font-mono uppercase"
          placeholder="ABC-1D23"
          maxlength="8"
          spellcheck="false"
          autocomplete="off"
          autocapitalize="characters"
          enterkeyhint="next"
          name="placa"
          :disabled="disabled"
          @update:model-value="setPlaca"
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
            placeholder="Fiat…"
            autocomplete="off"
            enterkeyhint="next"
            name="marca"
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
            placeholder="Argo…"
            autocomplete="off"
            enterkeyhint="next"
            name="modelo"
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
            inputmode="numeric"
            class="w-full font-mono tabular-nums"
            placeholder="2020"
            enterkeyhint="next"
            name="ano"
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
            placeholder="Prata…"
            autocomplete="off"
            enterkeyhint="next"
            name="cor"
            :disabled="disabled"
          />
        </UFormField>

        <UFormField
          label="KM atual"
          name="km_atual"
          class="sm:col-span-2"
        >
          <UInput
            v-model.number="state.km_atual"
            type="number"
            inputmode="numeric"
            min="0"
            class="w-full font-mono tabular-nums"
            placeholder="45000"
            enterkeyhint="done"
            name="km_atual"
            :disabled="disabled"
          />
        </UFormField>
      </div>
    </div>

    <div class="mt-6 border-t border-default pt-4">
      <UButton
        v-if="!showNotes"
        label="Adicionar observação"
        color="neutral"
        variant="ghost"
        size="sm"
        icon="i-lucide-plus"
        :aria-expanded="false"
        aria-controls="vehicle-notes-field"
        :disabled="disabled"
        class="min-h-11 touch-manipulation"
        @click="showNotes = true"
      />

      <div
        v-else
        id="vehicle-notes-field"
      >
        <UFormField
          label="Observações"
          name="observacoes"
        >
          <UTextarea
            v-model="state.observacoes"
            class="w-full"
            :rows="2"
            autoresize
            :maxrows="6"
            placeholder="Chave reserva, adesivo no para-brisa…"
            autocomplete="off"
            name="observacoes"
            :disabled="disabled"
          />
        </UFormField>
      </div>
    </div>
  </component>
</template>
