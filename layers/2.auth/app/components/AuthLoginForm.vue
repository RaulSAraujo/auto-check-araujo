<script setup lang="ts">
defineOptions({ name: 'AuthLoginForm' })

const state = defineModel<{ username: string, password: string }>({ required: true })

defineProps<{
  loading?: boolean
}>()

defineEmits<{
  submit: []
}>()
</script>

<template>
  <UForm
    :state="state"
    class="space-y-4"
    @submit="$emit('submit')"
  >
    <UFormField
      label="Usuário"
      name="username"
      required
    >
      <UInput
        v-model="state.username"
        autocomplete="username"
        placeholder="ex: j.silva"
        icon="i-lucide-user"
        size="lg"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Senha"
      name="password"
      required
    >
      <UInput
        v-model="state.password"
        type="password"
        autocomplete="current-password"
        placeholder="••••••••"
        icon="i-lucide-lock"
        size="lg"
        class="w-full"
      />
    </UFormField>

    <UButton
      type="submit"
      label="Entrar"
      trailing-icon="i-lucide-log-in"
      size="lg"
      block
      :loading="loading"
    />
  </UForm>
</template>
