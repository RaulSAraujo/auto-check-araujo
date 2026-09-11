<script setup lang="ts">
import type { FaltaTipo } from '~~/shared/types/oficina'
import { FALTA_TIPO_LABEL } from '~~/shared/types/oficina'
import type { TeamAbsenceRow } from '../../composables/useTeamHr'
import { formatTeamDate, todayTeamDateValue } from '../../utils/team'

defineOptions({ name: 'TeamAbsencesSection' })

const props = defineProps<{
  rows: TeamAbsenceRow[]
  pending?: boolean
  collaboratorItems: { label: string, value: string }[]
}>()

const emit = defineEmits<{
  saved: []
  deleted: []
}>()

const { createAbsence, deleteAbsence } = useTeamHrMutations()

const colaboradorId = ref(props.collaboratorItems[0]?.value || '')
const data = ref(todayTeamDateValue())
const tipo = ref<FaltaTipo>('injustificada')
const observacao = ref('')
const saving = ref(false)
const deletingId = ref<string | null>(null)

const tipoItems = (Object.keys(FALTA_TIPO_LABEL) as FaltaTipo[]).map(value => ({
  label: FALTA_TIPO_LABEL[value],
  value
}))

watch(
  () => props.collaboratorItems,
  (items) => {
    if (!items.some(item => item.value === colaboradorId.value)) {
      colaboradorId.value = items[0]?.value || ''
    }
  },
  { immediate: true }
)

const canSubmit = computed(() =>
  Boolean(colaboradorId.value && data.value && tipo.value)
)

async function onSubmit() {
  if (!canSubmit.value) return
  saving.value = true
  try {
    const { error } = await createAbsence({
      colaborador_id: colaboradorId.value,
      data: data.value,
      tipo: tipo.value,
      observacao: observacao.value
    })
    if (!error) {
      observacao.value = ''
      emit('saved')
    }
  } finally {
    saving.value = false
  }
}

async function onDelete(id: string) {
  deletingId.value = id
  try {
    const { error } = await deleteAbsence(id)
    if (!error) emit('deleted')
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <div class="space-y-6 lg:grid lg:grid-cols-3 lg:items-start lg:gap-6 lg:space-y-0">
    <BasePanel
      title="Registrar falta"
      class="lg:col-span-1"
    >
      <form
        class="space-y-4"
        @submit.prevent="onSubmit"
      >
        <UFormField
          label="Colaborador"
          required
        >
          <USelect
            v-model="colaboradorId"
            :items="collaboratorItems"
            value-key="value"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Data"
          required
        >
          <UInput
            v-model="data"
            type="date"
            required
          />
        </UFormField>

        <UFormField
          label="Tipo"
          required
        >
          <USelect
            v-model="tipo"
            :items="tipoItems"
            value-key="value"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Observação">
          <UInput
            v-model="observacao"
            placeholder="Opcional"
          />
        </UFormField>

        <UButton
          type="submit"
          label="Registrar falta"
          icon="i-lucide-user-x"
          :loading="saving"
          :disabled="!canSubmit"
        />
      </form>
    </BasePanel>

    <section class="space-y-4 lg:col-span-2">
      <h2 class="text-lg font-semibold text-highlighted">
        Faltas
      </h2>

      <div
        v-if="pending && !rows.length"
        class="space-y-2"
      >
        <USkeleton class="h-10 w-full" />
        <USkeleton class="h-10 w-full" />
      </div>

      <div
        v-else-if="rows.length"
        class="overflow-x-auto rounded-lg border border-default"
      >
        <table class="w-full text-sm">
          <thead class="border-b border-default bg-elevated/50 text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th class="px-3 py-2 font-medium">
                Data
              </th>
              <th class="px-3 py-2 font-medium">
                Colaborador
              </th>
              <th class="px-3 py-2 font-medium">
                Tipo
              </th>
              <th class="px-3 py-2 font-medium">
                Obs.
              </th>
              <th class="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in rows"
              :key="row.id"
              class="border-b border-default last:border-0"
            >
              <td class="px-3 py-2 font-mono text-xs tabular-nums">
                {{ formatTeamDate(row.data) }}
              </td>
              <td class="px-3 py-2">
                {{ row.profiles?.nome || '—' }}
              </td>
              <td class="px-3 py-2">
                <UBadge
                  :color="row.tipo === 'justificada' ? 'warning' : 'error'"
                  variant="subtle"
                  size="sm"
                >
                  {{ FALTA_TIPO_LABEL[row.tipo as FaltaTipo] || row.tipo }}
                </UBadge>
              </td>
              <td class="px-3 py-2 text-muted">
                {{ row.observacao || '—' }}
              </td>
              <td class="px-3 py-2 text-right">
                <UButton
                  type="button"
                  icon="i-lucide-trash-2"
                  color="error"
                  variant="ghost"
                  size="xs"
                  :loading="deletingId === row.id"
                  @click="onDelete(row.id)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <BaseEmptyState
        v-else
        icon="i-lucide-user-x"
      >
        Nenhuma falta no período.
      </BaseEmptyState>
    </section>
  </div>
</template>
