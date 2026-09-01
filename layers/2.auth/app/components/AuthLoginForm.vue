<script setup lang="ts">
defineOptions({ name: 'AuthLoginForm' })

const state = defineModel<{ email: string, password: string }>({ required: true })

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
      label="E-mail"
      name="email"
      required
    >
      <UInput
        v-model="state.email"
        type="email"
        autocomplete="username"
        placeholder="voce@oficina.com"
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
        class="w-full"
      />
    </UFormField>

    <UButton
      type="submit"
      label="Entrar"
      block
      :loading="loading"
    />
  </UForm>
</template>
