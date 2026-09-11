<script setup lang="ts">
import type { ColaboradorPapel } from '~~/shared/types/oficina'
import { COLABORADOR_PAPEL_LABEL } from '~~/shared/types/oficina'
import { isValidCollaboratorPassword, isValidUsername, normalizeUsername } from '~~/shared/utils/username'

defineOptions({ name: 'TeamCollaboratorsCreateForm' })

const emit = defineEmits<{
  created: []
}>()

const { createCollaborator } = useCollaboratorMutations()

const username = ref('')
const password = ref('')
const nome = ref('')
const papel = ref<ColaboradorPapel>('recepcao')
const creating = ref(false)
const showPassword = ref(false)
const passwordInputId = useId()

const papelItems = computed(() =>
  (Object.keys(COLABORADOR_PAPEL_LABEL) as ColaboradorPapel[]).map(value => ({
    label: COLABORADOR_PAPEL_LABEL[value],
    value
  }))
)

const canSubmit = computed(() =>
  isValidUsername(normalizeUsername(username.value))
  && isValidCollaboratorPassword(password.value)
  && nome.value.trim().length > 0
)

function onUsernameBlur() {
  username.value = normalizeUsername(username.value)
}

async function onSubmit() {
  creating.value = true
  try {
    const { error } = await createCollaborator({
      username: normalizeUsername(username.value),
      password: password.value,
      nome: nome.value.trim(),
      papel: papel.value
    })
    if (!error) {
      username.value = ''
      password.value = ''
      nome.value = ''
      papel.value = 'recepcao'
      showPassword.value = false
      emit('created')
    }
  } finally {
    creating.value = false
  }
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
        v-model="nome"
        name="nome"
        autocomplete="name"
        placeholder="Nome completo"
        required
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Usuário"
      name="username"
      required
      description="Letras minúsculas, números, _ ou -"
    >
      <UInput
        v-model="username"
        name="username"
        autocomplete="off"
        :spellcheck="false"
        placeholder="joao.silva"
        required
        class="w-full"
        @blur="onUsernameBlur"
      />
    </UFormField>

    <UFormField
      label="Senha inicial"
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

    <UFormField
      label="Papel"
      name="papel"
      required
    >
      <USelect
        v-model="papel"
        :items="papelItems"
        value-key="value"
        class="w-full"
      />
    </UFormField>

    <UButton
      type="submit"
      label="Criar colaborador"
      icon="i-lucide-user-plus"
      block
      :loading="creating"
      :disabled="!canSubmit"
    />
  </form>
</template>
