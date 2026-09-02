<script setup lang="ts">
import {
  AGENDAMENTO_STATUS_SELECT_ITEMS,
  emptyAppointmentDraft,
  PATIO_SLOT_ITEMS,
  type AppointmentDraft
} from '../utils/scheduling'

defineOptions({ name: 'SchedulingFormModal' })

const open = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  day: Date
  saving?: boolean
}>()

const emit = defineEmits<{
  submit: [draft: AppointmentDraft]
}>()

const { veiculoItems } = await useSchedulingVehicleOptions()

const draft = reactive(emptyAppointmentDraft(props.day))

watch(open, (isOpen) => {
  if (isOpen) Object.assign(draft, emptyAppointmentDraft(props.day))
})

function onSubmit() {
  emit('submit', { ...draft })
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Novo agendamento"
    description="Reserve horário e, se precisar, uma vaga do pátio."
  >
    <template #body>
      <UForm
        :state="draft"
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
            :items="veiculoItems"
            value-key="value"
            placeholder="Buscar placa ou cliente…"
            class="w-full"
            searchable
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
            placeholder="ex.: Revisão preventiva"
          />
        </UFormField>

        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField
            label="Status"
            name="status"
          >
            <USelect
              v-model="draft.status"
              :items="AGENDAMENTO_STATUS_SELECT_ITEMS"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Vaga do pátio"
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
            placeholder="Detalhes para a recepção…"
          />
        </UFormField>

        <div class="flex justify-end gap-2 pt-2">
          <UButton
            color="neutral"
            variant="ghost"
            label="Cancelar"
            :disabled="saving"
            @click="open = false"
          />
          <UButton
            type="submit"
            label="Salvar agendamento"
            :loading="saving"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
