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
      emit('created')
    }
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <BasePanel title="Novo colaborador">
    <form
      class="space-y-4"
      @submit.prevent="onSubmit"
    >
      <UFormField
        label="Nome"
        required
      >
        <UInput
          v-model="nome"
          placeholder="Nome completo"
          required
        />
      </UFormField>

      <UFormField
        label="Usuário"
        required
        hint="Letras minúsculas, números, _ ou -"
      >
        <UInput
          v-model="username"
          placeholder="joao.silva"
          required
        />
      </UFormField>

      <UFormField
        label="Senha inicial"
        required
        hint="Mínimo de 6 caracteres"
      >
        <UInput
          v-model="password"
          type="password"
          placeholder="••••••••"
          required
        />
      </UFormField>

      <UFormField
        label="Papel"
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
        :loading="creating"
        :disabled="!canSubmit"
      />
    </form>
  </BasePanel>
</template>
