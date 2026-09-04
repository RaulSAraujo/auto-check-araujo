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
      </section>
    </div>

    <div
      class="vehicles-edit-sticky sticky bottom-0 z-10 -mx-4 border-t border-default px-4 py-3 sm:mx-0 sm:rounded-lg sm:border"
      :class="{ 'vehicles-edit-sticky--dirty': dirty && !loading }"
    >
      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
          <UButton
            color="neutral"
            variant="ghost"
            label="Cancelar"
            :disabled="loading"
            class="min-h-11 justify-center touch-manipulation transition-transform motion-safe:active:scale-[0.98] sm:justify-start"
            style="transition-duration: var(--duration-press)"
            @click="emit('cancel')"
          />
          <UBadge
            v-if="dirty && !loading"
            color="warning"
            variant="subtle"
            label="Alterações não salvas"
            class="justify-center sm:justify-start"
            aria-live="polite"
          />
        </div>
        <UButton
          type="submit"
          :label="loading ? 'Salvando…' : 'Salvar alterações'"
          icon="i-lucide-check"
          :loading="loading"
          class="min-h-11 justify-center touch-manipulation transition-transform motion-safe:active:scale-[0.98] sm:min-w-44"
          style="transition-duration: var(--duration-press)"
        />
      </div>
      <p
        class="sr-only"
        aria-live="polite"
      >
        {{ loading ? 'Salvando alterações…' : dirty ? 'Há alterações não salvas' : '' }}
      </p>
    </div>
  </UForm>
</template>

<style scoped>
.vehicles-edit-panel {
  animation: vehicles-edit-rise 280ms var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1)) both;
}

.vehicles-edit-sticky {
  padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
  background: color-mix(in oklab, var(--ui-bg) 92%, transparent);
  backdrop-filter: blur(10px) saturate(1.2);
  -webkit-backdrop-filter: blur(10px) saturate(1.2);
  box-shadow:
    inset 0 1px 0 color-mix(in oklab, white 40%, transparent),
    0 -8px 24px color-mix(in oklab, var(--ui-text) 4%, transparent);
  transition: box-shadow var(--duration-ui) var(--ease-out);
}

.vehicles-edit-sticky--dirty {
  box-shadow:
    inset 0 1px 0 color-mix(in oklab, white 40%, transparent),
    0 -8px 28px color-mix(in oklab, var(--ui-warning, #d97706) 12%, transparent);
}

:global(.dark) .vehicles-edit-sticky {
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.06);
}

:global(.dark) .vehicles-edit-sticky--dirty {
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.06),
    0 -8px 28px color-mix(in oklab, var(--ui-warning, #d97706) 18%, transparent);
}

@media (prefers-reduced-transparency: reduce) {
  .vehicles-edit-sticky {
    background: var(--ui-bg);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
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

  .vehicles-edit-sticky {
    transition: none;
  }
}
</style>
