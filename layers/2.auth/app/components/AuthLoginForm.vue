<script setup lang="ts">
defineOptions({ name: 'AuthLoginForm' })

const state = defineModel<{ username: string, password: string }>({ required: true })

defineProps<{
  loading?: boolean
}>()

defineEmits<{
  submit: []
}>()

const showPassword = ref(false)
const passwordInputId = useId()
</script>

<template>
  <UForm
    :state="state"
    class="flex flex-col gap-5"
    @submit="$emit('submit')"
  >
    <UFormField
      label="Usuário"
      name="username"
      required
      :ui="{
        label: 'text-sm font-semibold text-[#171717]'
      }"
    >
      <UInput
        v-model="state.username"
        name="username"
        autocomplete="username"
        placeholder="j.silva"
        icon="i-lucide-user"
        size="lg"
        :spellcheck="false"
        class="w-full"
        :ui="{
          base: 'rounded-[6px] border-[#E5E5E5] bg-white text-[#171717] caret-[#171717] font-medium placeholder:text-[#a3a3a3]'
        }"
      />
    </UFormField>

    <UFormField
      label="Senha"
      name="password"
      required
      :ui="{
        label: 'text-sm font-semibold text-[#171717]'
      }"
    >
      <UInput
        :id="passwordInputId"
        v-model="state.password"
        name="password"
        :type="showPassword ? 'text' : 'password'"
        autocomplete="current-password"
        placeholder="••••••••"
        icon="i-lucide-lock"
        size="lg"
        class="w-full"
        :ui="{
          base: 'rounded-[6px] border-[#E5E5E5] bg-white text-[#171717] caret-[#171717] font-medium placeholder:text-[#a3a3a3]',
          trailing: 'pe-1'
        }"
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

    <UButton
      type="submit"
      label="Entrar"
      trailing-icon="i-lucide-arrow-right"
      size="lg"
      block
      class="auth-login-form__submit mt-4 font-bold shadow-sm"
      :ui="{
        base: 'rounded-[6px] py-3'
      }"
      :loading="loading"
      :disabled="loading"
    />
  </UForm>
</template>

<style scoped>
.auth-login-form__submit {
  transition:
    transform 160ms cubic-bezier(0.22, 1, 0.36, 1),
    background-color 160ms ease;
}

.auth-login-form__submit:active:not(:disabled) {
  transform: scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .auth-login-form__submit {
    transition: none;
  }

  .auth-login-form__submit:active:not(:disabled) {
    transform: none;
  }
}

/* Esconde o reveal nativo do Edge */
:deep(::-ms-reveal) {
  display: none;
}
</style>
