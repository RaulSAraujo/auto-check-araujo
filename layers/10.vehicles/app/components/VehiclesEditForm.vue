<script setup lang="ts">
import type { FormErrorEvent } from '@nuxt/ui'
import type { VehicleFormState } from '../utils/vehicle-form'
import { validateVehicleForm } from '../utils/vehicle-form'

defineOptions({ name: 'VehiclesEditForm' })

const state = defineModel<VehicleFormState>({ required: true })

const {
  clienteItems,
  loading,
  clientesPending = false,
  dirty = false
} = defineProps<{
  clienteItems: { label: string, value: string }[]
  loading: boolean
  clientesPending?: boolean
  dirty?: boolean
}>()

const clienteSearchTerm = defineModel<string>('clienteSearchTerm', { default: '' })

const emit = defineEmits<{
  submit: []
  cancel: []
}>()

onMounted(() => {
  const desktop = window.matchMedia('(min-width: 768px)').matches
  if (!desktop) return
  nextTick(() => {
    document.querySelector<HTMLInputElement>('input[name="placa"]')?.focus()
  })
})

function validate(formState: Partial<VehicleFormState>) {
  return validateVehicleForm(formState)
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
    aria-labelledby="vehicle-edit-heading"
    @submit="onSubmit"
    @error="onError"
  >
    <div class="vehicles-edit-panel">
      <section
        class="scroll-mt-28 rounded-lg border border-default bg-default p-4 shadow-sm dark:shadow-none sm:p-5"
        aria-labelledby="vehicle-edit-heading"
      >
        <h2
          id="vehicle-edit-heading"
          class="text-sm font-semibold uppercase tracking-widest text-muted"
        >
          Editar dados
        </h2>

        <div class="mt-4">
          <VehiclesFormFields
            v-model="state"
            v-model:cliente-search-term="clienteSearchTerm"
            :cliente-items="clienteItems"
            :clientes-pending="clientesPending"
            :disabled="loading"
            bare
          />
        </div>

        <div class="mt-6 border-t border-default pt-4">
          <div class="flex items-center gap-2 sm:justify-between">
            <div class="flex shrink-0 items-center sm:gap-3">
              <UButton
                color="neutral"
                variant="ghost"
                label="Cancelar"
                :disabled="loading"
                class="min-h-11 shrink-0 justify-center touch-manipulation transition-transform motion-safe:active:scale-[0.98] sm:justify-start"
                style="transition-duration: var(--duration-press)"
                @click="emit('cancel')"
              />
              <UBadge
                v-if="dirty && !loading"
                color="warning"
                variant="subtle"
                label="Alterações não salvas"
                class="hidden justify-center sm:flex sm:justify-start"
                aria-live="polite"
              />
            </div>
            <UButton
              type="submit"
              :label="loading ? 'Salvando…' : 'Salvar alterações'"
              icon="i-lucide-check"
              :loading="loading"
              class="min-h-11 flex-1 justify-center touch-manipulation transition-transform motion-safe:active:scale-[0.98] sm:min-w-44 sm:flex-none"
              style="transition-duration: var(--duration-press)"
            />
          </div>
          <UBadge
            v-if="dirty && !loading"
            color="warning"
            variant="subtle"
            label="Alterações não salvas"
            class="mt-2 justify-center sm:hidden"
            aria-live="polite"
          />
          <p class="sr-only" aria-live="polite">
            {{ loading ? 'Salvando alterações…' : dirty ? 'Há alterações não salvas' : '' }}
          </p>
        </div>
      </section>
    </div>
  </UForm>
</template>

<style scoped>
.vehicles-edit-panel {
  animation: vehicles-edit-rise 280ms var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1)) both;
}

@keyframes vehicles-edit-rise {
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
  .vehicles-edit-panel {
    animation: none;
  }

}
</style>
