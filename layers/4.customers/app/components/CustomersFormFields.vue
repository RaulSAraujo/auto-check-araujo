<script setup lang="ts">
import type { CustomerFormState } from '../utils/customer-form'
import {
  formatDocumento,
  formatPhoneBr
} from '../utils/customer-form'

defineOptions({ name: 'CustomersFormFields' })

const state = defineModel<CustomerFormState>({ required: true })

const { disabled = false, bare = false } = defineProps<{
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

const phoneCount = computed(() => Math.max(1, state.value.telefones.length))
const emailCount = computed(() => Math.max(1, state.value.emails.length))

const canAddPhone = computed(() =>
  Boolean(contactAt(state.value.telefones, phoneCount.value - 1).trim())
)
const canAddEmail = computed(() =>
  Boolean(contactAt(state.value.emails, emailCount.value - 1).trim())
)

function contactAt(list: string[], index: number): string {
  return list[index] ?? ''
}

function setContact(key: 'telefones' | 'emails', index: number, value: string) {
  const next = [...state.value[key]]
  while (next.length <= index) next.push('')
  next[index] = value
  state.value[key] = next
}

function addContact(key: 'telefones' | 'emails') {
  const next = [...state.value[key]]
  if (next.length === 0) next.push('')
  next.push('')
  state.value[key] = next
}

function removeContact(key: 'telefones' | 'emails', index: number) {
  if (index <= 0) return
  const next = [...state.value[key]]
  next.splice(index, 1)
  state.value[key] = next
}

function setPhone(index: number, value: string) {
  setContact('telefones', index, formatPhoneBr(value))
}

function setEmail(index: number, value: string) {
  setContact('emails', index, value)
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
        label="Nome"
        name="nome"
        required
      >
        <UInput
          v-model="state.nome"
          class="min-h-11 w-full [&>input]:min-h-11"
          placeholder="Maria Silva…"
          autocomplete="name"
          autocapitalize="words"
          enterkeyhint="next"
          name="nome"
          :disabled="disabled"
        />
      </UFormField>

      <div class="space-y-3">
        <UFormField
          v-for="index in phoneCount"
          :key="`phone-${index - 1}`"
          :label="index === 1 ? 'Telefone' : `Telefone ${index}`"
          :name="index === 1 ? 'telefones' : `telefones.${index - 1}`"
          :hint="index === 1 ? 'Recomendado' : undefined"
        >
          <div class="flex items-start gap-2">
            <UInput
              :model-value="contactAt(state.telefones, index - 1)"
              type="tel"
              inputmode="tel"
              autocomplete="tel"
              enterkeyhint="next"
              spellcheck="false"
              class="min-h-11 min-w-0 w-full [&>input]:min-h-11"
              placeholder="(16) 99999-9999…"
              :name="index === 1 ? 'telefones' : `telefones.${index - 1}`"
              :disabled="disabled"
              @update:model-value="setPhone(index - 1, $event)"
            />
            <UButton
              v-if="index > 1"
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              square
              :aria-label="`Remover telefone ${index}`"
              :disabled="disabled"
              class="size-11 shrink-0 touch-manipulation"
              @click="removeContact('telefones', index - 1)"
            />
          </div>
        </UFormField>

        <UButton
          v-if="canAddPhone && !disabled"
          label="Outro telefone"
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-lucide-plus"
          class="min-h-11 touch-manipulation"
          @click="addContact('telefones')"
        />
      </div>

      <div class="space-y-3">
        <UFormField
          v-for="index in emailCount"
          :key="`email-${index - 1}`"
          :label="index === 1 ? 'E-mail' : `E-mail ${index}`"
          :name="index === 1 ? 'emails' : `emails.${index - 1}`"
        >
          <div class="flex items-start gap-2">
            <UInput
              :model-value="contactAt(state.emails, index - 1)"
              type="email"
              inputmode="email"
              autocomplete="email"
              enterkeyhint="next"
              spellcheck="false"
              class="min-h-11 min-w-0 w-full [&>input]:min-h-11"
              placeholder="maria@email.com…"
              :name="index === 1 ? 'emails' : `emails.${index - 1}`"
              :disabled="disabled"
              @update:model-value="setEmail(index - 1, $event)"
            />
            <UButton
              v-if="index > 1"
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              square
              :aria-label="`Remover e-mail ${index}`"
              :disabled="disabled"
              class="size-11 shrink-0 touch-manipulation"
              @click="removeContact('emails', index - 1)"
            />
          </div>
        </UFormField>

        <UButton
          v-if="canAddEmail && !disabled"
          label="Outro e-mail"
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-lucide-plus"
          class="min-h-11 touch-manipulation"
          @click="addContact('emails')"
        />
      </div>

      <UFormField
        label="Documento"
        name="documento"
        hint="CPF ou CNPJ"
      >
        <UInput
          :model-value="state.documento"
          inputmode="numeric"
          autocomplete="off"
          spellcheck="false"
          enterkeyhint="done"
          name="documento"
          class="min-h-11 w-full font-mono tabular-nums [&>input]:min-h-11"
          placeholder="000.000.000-00…"
          :disabled="disabled"
          @update:model-value="state.documento = formatDocumento($event)"
        />
      </UFormField>
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
        aria-controls="customer-notes-field"
        :disabled="disabled"
        class="min-h-11 touch-manipulation"
        @click="showNotes = true"
      />

      <div
        v-else
        id="customer-notes-field"
      >
        <UFormField
          label="Observações"
          name="observacoes"
        >
          <UTextarea
            v-model="state.observacoes"
            class="w-full [&>textarea]:min-h-24"
            :rows="2"
            autoresize
            :maxrows="6"
            placeholder="Prefere WhatsApp, busca o carro depois das 17h…"
            autocomplete="off"
            name="observacoes"
            :disabled="disabled"
          />
        </UFormField>
      </div>
    </div>

    <div
      v-if="$slots.actions"
      class="mt-6 border-t border-default pt-4"
    >
      <slot name="actions" />
    </div>
  </component>
</template>
