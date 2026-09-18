<script setup lang="ts">
import type { FormErrorEvent } from '@nuxt/ui'
import type { VehicleFormState } from '../utils/vehicle-form'
import { validateVehicleForm } from '../utils/vehicle-form'
import { VEHICLE_ROUTES } from '../utils/vehicle-routes'

defineOptions({ name: 'VehiclesNewForm' })

const state = defineModel<VehicleFormState>({ required: true })

const {
  clienteItems,
  loading,
  clientesPending = false,
  cancelTo = VEHICLE_ROUTES.list
} = defineProps<{
  clienteItems: { label: string, value: string }[]
  loading: boolean
  clientesPending?: boolean
  /** Fallback when there is no in-app history (e.g. cold open). */
  cancelTo?: string
}>()

const clienteSearchTerm = defineModel<string>('clienteSearchTerm', { default: '' })

const emit = defineEmits<{
  submit: []
}>()

const { back: cancel } = useSmartBack(() => cancelTo)

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
    @submit="onSubmit"
    @error="onError"
  >
    <div class="vehicles-new-panel">
      <VehiclesFormFields
        v-model="state"
        v-model:cliente-search-term="clienteSearchTerm"
        :cliente-items="clienteItems"
        :clientes-pending="clientesPending"
        :disabled="loading"
      >
        <template #actions>
          <div class="flex items-center gap-2 sm:justify-between">
            <UButton
              color="neutral"
              variant="ghost"
              label="Cancelar"
              :disabled="loading"
              class="min-h-11 shrink-0 justify-center touch-manipulation transition-transform motion-safe:active:scale-[0.98] sm:justify-start"
              style="transition-duration: var(--duration-press)"
              @click="cancel"
            />
            <UButton
              type="submit"
              :label="loading ? 'Salvando…' : 'Salvar veículo'"
              icon="i-lucide-car"
              :loading="loading"
              class="min-h-11 flex-1 justify-center touch-manipulation transition-transform motion-safe:active:scale-[0.98] sm:min-w-44 sm:flex-none"
              style="transition-duration: var(--duration-press)"
            />
          </div>
          <p
            class="sr-only"
            aria-live="polite"
          >
            {{ loading ? 'Salvando veículo…' : '' }}
          </p>
        </template>
      </VehiclesFormFields>
    </div>
  </UForm>
</template>

<style scoped>
.vehicles-new-panel {
  animation: vehicles-new-rise 280ms var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1)) both;
}

@keyframes vehicles-new-rise {
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
  .vehicles-new-panel {
    animation: none;
  }
}
</style>
