<script setup lang="ts">
import type { FormError, FormErrorEvent } from '@nuxt/ui'
import type { OrderVehicleSelectItem } from '../composables/useOrderVehicleOptions'
import type { OrderFormState } from '../utils/order-form'
import { validateOrderForm } from '../utils/order-form'
import { ORDER_ROUTES } from '../utils/order-routes'

defineOptions({ name: 'OrdersNewForm' })

const state = defineModel<OrderFormState>({ required: true })

const {
  veiculoItems,
  selectedVehicle,
  loading,
  vehiclesPending = false,
  vehiclesError = false,
  cancelTo = ORDER_ROUTES.list
} = defineProps<{
  veiculoItems: OrderVehicleSelectItem[]
  selectedVehicle: OrderVehicleSelectItem | null
  loading: boolean
  vehiclesPending?: boolean
  vehiclesError?: boolean
  /** Fallback when there is no in-app history (e.g. cold open). */
  cancelTo?: string
}>()

const vehicleSearchTerm = defineModel<string>('vehicleSearchTerm', { default: '' })

const emit = defineEmits<{
  submit: []
  retryVehicles: []
}>()

const { back: cancel } = useSmartBack(() => cancelTo)

const showNotes = ref(Boolean(state.value.observacoes.trim()))
const isDesktop = ref(false)

onMounted(() => {
  isDesktop.value = window.matchMedia('(min-width: 768px)').matches
})

function validate(formState: Partial<OrderFormState>): FormError[] {
  return validateOrderForm(formState)
}

function onError(event: FormErrorEvent) {
  const firstId = event.errors?.[0]?.id
  if (!firstId) return
  const element = document.getElementById(firstId)
  element?.focus()
  element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function onSubmit() {
  emit('submit')
}

const vehicleLabel = computed(() => {
  const vehicle = selectedVehicle
  if (!vehicle) return null
  const model = [vehicle.marca, vehicle.modelo].filter(Boolean).join(' ')
  return {
    placa: vehicle.label,
    model: model || 'Modelo não informado',
    cliente: vehicle.clienteNome?.trim() || 'Cliente não informado'
  }
})
</script>

<template>
  <UForm
    :state="state"
    :validate="validate"
    :validate-on="['blur', 'change']"
    class="space-y-6"
    @submit="onSubmit"
    @error="onError"
  >
    <section
      class="rounded-lg border border-default bg-default p-4 shadow-sm dark:shadow-none sm:p-5"
      aria-labelledby="os-vehicle-heading"
    >
      <div class="mb-4">
        <p
          id="os-vehicle-heading"
          class="text-sm font-semibold uppercase tracking-widest text-muted"
        >
          Veículo
        </p>
        <p class="mt-1 text-sm text-pretty text-muted">
          Busque pela placa, modelo ou nome do cliente.
        </p>
      </div>

      <UAlert
        v-if="vehiclesError"
        color="error"
        variant="subtle"
        icon="i-lucide-circle-alert"
        title="Não foi possível carregar os veículos"
        description="Verifique a conexão e tente de novo."
        class="mb-4"
        :actions="[{
          label: 'Tentar de novo',
          color: 'neutral',
          variant: 'outline',
          onClick: () => emit('retryVehicles')
        }]"
      />

      <UFormField
        v-else
        label="Placa"
        name="veiculo_id"
        required
        hint="Obrigatório"
      >
        <USelectMenu
          v-model="state.veiculo_id"
          v-model:search-term="vehicleSearchTerm"
          :items="veiculoItems"
          value-key="value"
          label-key="label"
          description-key="description"
          :loading="vehiclesPending"
          :disabled="vehiclesPending"
          :autofocus="isDesktop && !state.veiculo_id"
          icon="i-lucide-search"
          placeholder="Buscar placa, modelo ou cliente…"
          class="w-full"
          ignore-filter
          :search-input="{ placeholder: 'Buscar…', loading: vehiclesPending }"
          :virtualize="veiculoItems.length > 50"
          autocomplete="off"
          name="veiculo_id"
        >
          <template #empty>
            <div class="px-2 py-3 text-center text-sm text-muted">
              <p>Nenhum veículo encontrado.</p>
              <UButton
                to="/veiculos/novo"
                color="primary"
                variant="link"
                size="sm"
                label="Cadastrar veículo"
                class="mt-1"
              />
            </div>
          </template>
        </USelectMenu>
      </UFormField>

      <div
        v-if="!vehiclesError && !vehiclesPending && !veiculoItems.length"
        class="mt-3 rounded-lg border border-dashed border-default bg-muted/40 px-4 py-6 text-center"
        role="status"
      >
        <UIcon
          name="i-lucide-car"
          class="mx-auto size-8 text-dimmed"
          aria-hidden="true"
        />
        <p class="mt-2 text-sm font-medium text-highlighted">
          Nenhum veículo cadastrado
        </p>
        <p class="mt-1 text-sm text-pretty text-muted">
          Cadastre o veículo antes de abrir a OS.
        </p>
        <UButton
          to="/veiculos/novo"
          color="primary"
          label="Cadastrar veículo"
          icon="i-lucide-plus"
          class="mt-4"
        />
      </div>

      <div
        v-else-if="vehicleLabel"
        class="orders-new-vehicle-preview mt-4 flex min-w-0 items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-3 dark:bg-primary/10"
        role="status"
        aria-live="polite"
      >
        <div
          class="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
          aria-hidden="true"
        >
          <UIcon
            name="i-lucide-car"
            class="size-5"
          />
        </div>
        <div class="min-w-0 flex-1">
          <p
            class="font-mono text-base font-semibold tabular-nums tracking-tight text-highlighted"
            translate="no"
          >
            {{ vehicleLabel.placa }}
          </p>
          <p class="mt-0.5 truncate text-sm text-muted">
            {{ vehicleLabel.model }}
          </p>
          <p class="truncate text-sm text-muted">
            {{ vehicleLabel.cliente }}
          </p>
        </div>
        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-lucide-x"
          aria-label="Trocar veículo"
          @click="state.veiculo_id = ''"
        />
      </div>
    </section>

    <section
      class="rounded-lg border border-default bg-default p-4 shadow-sm dark:shadow-none sm:p-5"
      aria-labelledby="os-visit-heading"
    >
      <div class="mb-4">
        <p
          id="os-visit-heading"
          class="text-sm font-semibold uppercase tracking-widest text-muted"
        >
          Motivo da visita
        </p>
        <p class="mt-1 text-sm text-pretty text-muted">
          O que o cliente pediu ou reclamou na recepção.
        </p>
      </div>

      <div class="space-y-4">
        <UFormField
          label="Reclamação"
          name="reclamacao"
          hint="Recomendado"
        >
          <UTextarea
            v-model="state.reclamacao"
            class="w-full"
            :rows="3"
            autoresize
            :maxrows="8"
            placeholder="Barulho na dianteira ao frear…"
            autocomplete="off"
            name="reclamacao"
          />
        </UFormField>

        <UFormField
          label="Km de entrada"
          name="km_entrada"
          hint="Opcional"
        >
          <UInput
            v-model.number="state.km_entrada"
            type="number"
            inputmode="numeric"
            min="0"
            step="1"
            class="w-full font-mono tabular-nums"
            placeholder="45000"
            autocomplete="off"
            name="km_entrada"
          />
        </UFormField>
      </div>
    </section>

    <section
      class="rounded-lg border border-default bg-default p-4 shadow-sm dark:shadow-none sm:p-5"
      aria-labelledby="os-notes-heading"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p
            id="os-notes-heading"
            class="text-sm font-semibold uppercase tracking-widest text-muted"
          >
            Observações internas
          </p>
          <p class="mt-1 text-sm text-pretty text-muted">
            Notas para a equipe — o cliente não vê.
          </p>
        </div>
        <UButton
          :label="showNotes ? 'Ocultar' : 'Adicionar'"
          color="neutral"
          variant="ghost"
          size="sm"
          :aria-expanded="showNotes"
          aria-controls="os-notes-field"
          @click="showNotes = !showNotes"
        />
      </div>

      <div
        v-if="showNotes"
        id="os-notes-field"
        class="mt-4"
      >
        <UFormField
          label="Observações"
          name="observacoes"
        >
          <UTextarea
            v-model="state.observacoes"
            class="w-full"
            :rows="2"
            autoresize
            :maxrows="6"
            placeholder="Peças sob encomenda, cliente aguarda ligação…"
            autocomplete="off"
            name="observacoes"
          />
        </UFormField>
      </div>
    </section>

    <div
      class="sticky bottom-0 z-10 -mx-4 border-t border-default bg-default/95 px-4 py-3 backdrop-blur-sm sm:mx-0 sm:rounded-lg sm:border sm:px-4 sm:shadow-sm dark:sm:shadow-none"
      style="padding-bottom: max(0.75rem, env(safe-area-inset-bottom))"
    >
      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <UButton
          color="neutral"
          variant="ghost"
          label="Cancelar"
          :disabled="loading"
          class="justify-center touch-manipulation sm:justify-start"
          @click="cancel"
        />
        <UButton
          type="submit"
          :label="loading ? 'Abrindo…' : 'Abrir OS'"
          icon="i-lucide-clipboard-plus"
          :loading="loading"
          :disabled="vehiclesPending || vehiclesError || !veiculoItems.length"
          class="justify-center sm:min-w-40"
        />
      </div>
      <p
        class="sr-only"
        aria-live="polite"
      >
        {{ loading ? 'Abrindo ordem de serviço…' : '' }}
      </p>
    </div>
  </UForm>
</template>

<style scoped>
.orders-new-vehicle-preview {
  animation: orders-new-rise 280ms var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1)) both;
}

@keyframes orders-new-rise {
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
  .orders-new-vehicle-preview {
    animation: none;
  }
}
</style>
