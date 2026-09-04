<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import type { SchedulingAppointment } from '../composables/useSchedulingBoard'
import { ORDER_ROUTES } from '#layers/orders/app/utils/order-routes'
import {
  AGENDAMENTO_STATUS_SELECT_ITEMS,
  appointmentToDraft,
  emptyAppointmentDraft,
  PATIO_SLOT_ITEMS,
  validateAppointmentDraft,
  type AppointmentCreatePrefill,
  type AppointmentDraft
} from '../utils/scheduling'

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

const { veiculoItems, searchTerm: vehicleSearchTerm, pending: vehiclesPending }
  = await useSchedulingVehicleOptions(preferredVeiculoId)

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
const statusItems = computed(() => {
  if (isEdit.value) return AGENDAMENTO_STATUS_SELECT_ITEMS
  return AGENDAMENTO_STATUS_SELECT_ITEMS.filter(item =>
    item.value === 'agendado'
    || item.value === 'confirmado'
    || item.value === 'em_atendimento'
  )
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
            :search-input="{ placeholder: 'Buscar…', loading: vehiclesPending }"
          />
        </UFormField>

        <div class="grid gap-4 sm:grid-cols-3">
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
            label="Início"
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
          <UFormField
            label="Fim"
            name="endTime"
            required
          >
            <UInput
              v-model="draft.endTime"
              type="time"
              autocomplete="off"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField
          label="Serviço"
          name="servico"
        >
          <UInput
            v-model="draft.servico"
            class="w-full"
            placeholder="Revisão preventiva…"
            autocomplete="off"
          />
        </UFormField>

        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField
            label="Status"
            name="status"
          >
            <USelect
              v-model="draft.status"
              :items="statusItems"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Vaga"
            name="patio_vaga"
          >
            <USelect
              :model-value="draft.patio_vaga ?? undefined"
              :items="PATIO_SLOT_ITEMS"
              placeholder="Sem reserva"
              class="w-full"
              @update:model-value="draft.patio_vaga = $event == null ? null : Number($event)"
            />
          </UFormField>
        </div>

        <UFormField
          label="Observações"
          name="observacoes"
        >
          <UTextarea
            v-model="draft.observacoes"
            class="w-full"
            :rows="2"
            autoresize
            :maxrows="6"
            placeholder="Detalhes para a recepção…"
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
