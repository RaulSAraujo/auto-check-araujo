<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import type { SchedulingAppointment } from '../composables/useSchedulingBoard'
import { ORDER_ROUTES } from '#layers/orders/app/utils/order-routes'
import { useVehicleOptions } from '#layers/vehicles/app/composables/useVehicleOptions'
import {
  appointmentToDraft,
  emptyAppointmentDraft,
  validateAppointmentDraft,
  type AppointmentCreatePrefill,
  type AppointmentDraft
} from '../utils/scheduling'
import { toSentenceCase } from '~~/shared/utils/text-case'

defineOptions({ name: 'SchedulingFormSlideover' })

const open = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  day: Date
  appointment?: SchedulingAppointment | null
  prefill?: AppointmentCreatePrefill | null
  saving?: boolean
  canCreateOrder?: boolean
}>()

const emit = defineEmits<{
  submit: [draft: AppointmentDraft]
}>()

const preferredVeiculoId = computed(
  () => props.appointment?.veiculo_id || undefined
)

const {
  veiculos,
  searchTerm: vehicleSearchTerm,
  pending: vehiclesPending
} = await useVehicleOptions({
  preferredId: preferredVeiculoId,
  key: 'scheduling-veiculos-options'
})

const veiculoItems = computed(() =>
  (veiculos.value || []).map((v) => {
    const cliente = Array.isArray(v.clientes) ? v.clientes[0] : v.clientes
    return {
      label: `${formatPlaca(v.placa)}${v.marca || v.modelo ? ` — ${[v.marca, v.modelo].filter(Boolean).join(' ')}` : ''}${cliente?.nome ? ` (${cliente.nome})` : ''}`,
      value: v.id
    }
  })
)

const vehicleSearchInput = computed(() => ({
  placeholder: 'Buscar…',
  loading: vehiclesPending.value
}))

const draft = reactive(emptyAppointmentDraft(props.day))
const snapshot = ref('')
const discardOpen = ref(false)
const isEdit = computed(() => !!props.appointment)
const isDirty = computed(() => JSON.stringify(draft) !== snapshot.value)
const orderHref = computed(() =>
  props.appointment?.ordem_servico_id
    ? ORDER_ROUTES.detail(props.appointment.ordem_servico_id)
    : null
)

const openOrderHref = computed(() => {
  if (!props.canCreateOrder || !props.appointment || props.appointment.ordem_servico_id) return null
  return ORDER_ROUTES.newFromAppointment(props.appointment.veiculo_id, props.appointment.id)
})

function resetDraft() {
  if (props.appointment) Object.assign(draft, appointmentToDraft(props.appointment))
  else Object.assign(draft, emptyAppointmentDraft(props.day, props.prefill ?? undefined))
  snapshot.value = JSON.stringify({ ...draft })
}

watch(open, (isOpen) => {
  if (!isOpen) {
    discardOpen.value = false
    return
  }
  resetDraft()
})

function onOpenChange(value: boolean) {
  if (value) {
    open.value = true
    return
  }
  requestClose()
}

function requestClose() {
  if (props.saving) return
  if (isDirty.value) {
    discardOpen.value = true
    return
  }
  open.value = false
}

function discardChanges() {
  discardOpen.value = false
  open.value = false
}

function validate(state: Partial<AppointmentDraft>): FormError[] {
  return validateAppointmentDraft(state as AppointmentDraft)
}

function onSubmit(_event: FormSubmitEvent<AppointmentDraft>) {
  emit('submit', { ...draft })
}
</script>

<template>
  <USlideover
    :open="open"
    :title="isEdit ? 'Editar agendamento' : 'Novo agendamento'"
    :dismissible="!saving && !isDirty"
    :ui="{ content: 'overscroll-contain' }"
    @update:open="onOpenChange"
    @close:prevent="requestClose"
  >
    <template #body>
      <UForm
        id="scheduling-appointment-form"
        :state="draft"
        :validate="validate"
        :disabled="saving"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Veículo"
          name="veiculo_id"
          required
        >
          <USelectMenu
            v-model="draft.veiculo_id"
            v-model:search-term="vehicleSearchTerm"
            :items="veiculoItems"
            value-key="value"
            placeholder="Placa ou cliente…"
            class="w-full"
            ignore-filter
            :loading="vehiclesPending"
            :search-input="vehicleSearchInput"
          />
        </UFormField>

        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField
            label="Data"
            name="date"
            required
          >
            <UInput
              v-model="draft.date"
              type="date"
              autocomplete="off"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Horário aproximado"
            name="startTime"
            required
          >
            <UInput
              v-model="draft.startTime"
              type="time"
              autocomplete="off"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField
          label="Problema relatado"
          name="problema"
        >
          <UTextarea
            v-model="draft.problema"
            class="w-full"
            :rows="3"
            autoresize
            :maxrows="8"
            placeholder="Barulho no freio, revisão, etc…"
            @blur="draft.problema = toSentenceCase(draft.problema)"
          />
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <div class="flex flex-wrap items-center justify-end gap-2">
        <UButton
          v-if="orderHref"
          color="neutral"
          variant="outline"
          icon="i-lucide-wrench"
          label="Ver OS"
          :to="orderHref"
        />
        <UButton
          v-else-if="openOrderHref"
          color="neutral"
          variant="outline"
          icon="i-lucide-plus"
          label="Abrir OS"
          :to="openOrderHref"
        />
        <UButton
          color="neutral"
          variant="ghost"
          label="Cancelar"
          :disabled="saving"
          @click="requestClose"
        />
        <UButton
          type="submit"
          form="scheduling-appointment-form"
          label="Salvar"
          :loading="saving"
        />
      </div>
    </template>
  </USlideover>

  <UModal
    v-model:open="discardOpen"
    title="Descartar alterações?"
    description="O que você digitou não será salvo."
    :ui="{ content: 'overscroll-contain', footer: 'justify-end' }"
  >
    <template #footer>
      <UButton
        color="neutral"
        variant="outline"
        label="Continuar editando"
        @click="discardOpen = false"
      />
      <UButton
        color="error"
        label="Descartar"
        @click="discardChanges"
      />
    </template>
  </UModal>
</template>
