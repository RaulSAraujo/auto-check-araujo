<script setup lang="ts">
import { isValidCollaboratorPassword } from '~~/shared/utils/username'
import type { CollaboratorRow } from '#layers/auth/app/composables/useCollaborators'

defineOptions({ name: 'TeamCollaboratorsPasswordModal' })

const open = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  collaborator: CollaboratorRow | null
  loading?: boolean
}>()

const emit = defineEmits<{
  confirm: [password: string]
}>()

const password = ref('')
const showPassword = ref(false)
const passwordInputId = useId()

const canSubmit = computed(() => isValidCollaboratorPassword(password.value))

watch(open, (value) => {
  if (!value) {
    password.value = ''
    showPassword.value = false
  }
})

function onConfirm() {
  if (!canSubmit.value || !props.collaborator) return
  emit('confirm', password.value)
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Redefinir senha"
    :description="collaborator
      ? `Nova senha para ${collaborator.nome} (${collaborator.username}).`
      : undefined"
  >
    <template #body>
      <UFormField
        label="Nova senha"
        name="password"
        required
        description="Mínimo de 6 caracteres"
      >
        <UInput
          :id="passwordInputId"
          v-model="password"
          name="password"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="new-password"
          placeholder="••••••••"
          required
          class="w-full"
          :ui="{ trailing: 'pe-1' }"
          @keydown.enter.prevent="onConfirm"
        >
          <template #trailing>
            <UButton
              type="button"
              color="neutral"
              variant="link"
              size="sm"
              :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
              :aria-pressed="showPassword"
              :aria-controls="passwordInputId"
              @click="showPassword = !showPassword"
            />
          </template>
        </UInput>
      </UFormField>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          label="Cancelar"
          color="neutral"
          variant="ghost"
          class="min-h-11 touch-manipulation"
          @click="open = false"
        />
        <UButton
          label="Salvar senha"
          icon="i-lucide-key-round"
          :loading="loading"
          :disabled="!canSubmit"
          class="min-h-11 touch-manipulation"
          @click="onConfirm"
        />
      </div>
    </template>
  </UModal>
</template>
