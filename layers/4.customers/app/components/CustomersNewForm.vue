<script setup lang="ts">
import type { FormErrorEvent } from '@nuxt/ui'
import type { CustomerFormState } from '../utils/customer-form'
import { validateCustomerForm } from '../utils/customer-form'
import { CUSTOMER_ROUTES } from '../utils/customer-routes'

defineOptions({ name: 'CustomersNewForm' })

const state = defineModel<CustomerFormState>({ required: true })

const { loading } = defineProps<{
  loading: boolean
}>()

const emit = defineEmits<{
  submit: []
}>()

onMounted(() => {
  const desktop = window.matchMedia('(min-width: 768px)').matches
  if (!desktop) return
  nextTick(() => {
    document.querySelector<HTMLInputElement>('input[name="nome"]')?.focus()
  })
})

function validate(formState: Partial<CustomerFormState>) {
  return validateCustomerForm(formState)
}

function onError(event: FormErrorEvent) {
  const firstId = event.errors?.[0]?.id
  if (!firstId) return
  const element = document.getElementById(firstId)
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  element?.focus()
  element?.scrollIntoView({
    behavior: reduceMotion ? 'auto' : 'smooth',
    block: 'center'
  })
}

function onSubmit() {
  emit('submit')
}
</script>

<template>
  <UForm
    :state="state"
    :validate="validate"
    :validate-on="['blur', 'change']"
    autocomplete="off"
    class="space-y-6"
    @submit="onSubmit"
    @error="onError"
  >
    <div class="customers-new-panel">
      <CustomersFormFields
        v-model="state"
        :disabled="loading"
      >
        <template #actions>
          <div class="flex items-center gap-2 sm:justify-between">
            <UButton
              :to="CUSTOMER_ROUTES.list"
              color="neutral"
              variant="ghost"
              label="Cancelar"
              :disabled="loading"
              class="min-h-11 shrink-0 justify-center touch-manipulation transition-transform motion-safe:active:scale-[0.98] sm:justify-start"
              style="transition-duration: var(--duration-press)"
            />
            <UButton
              type="submit"
              :label="loading ? 'Salvando…' : 'Salvar cliente'"
              icon="i-lucide-user-plus"
              :loading="loading"
              class="min-h-11 flex-1 justify-center touch-manipulation transition-transform motion-safe:active:scale-[0.98] sm:min-w-44 sm:flex-none"
              style="transition-duration: var(--duration-press)"
            />
          </div>
          <p
            class="sr-only"
            aria-live="polite"
          >
            {{ loading ? 'Salvando cliente…' : '' }}
          </p>
        </template>
      </CustomersFormFields>
    </div>
  </UForm>
</template>

<style scoped>
.customers-new-panel {
  animation: customers-new-rise 280ms var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1)) both;
}

@keyframes customers-new-rise {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .customers-new-panel {
    animation: none;
  }
}
</style>
