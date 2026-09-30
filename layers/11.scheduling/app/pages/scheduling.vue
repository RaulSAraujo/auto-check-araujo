<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { SchedulingAppointment } from '../composables/useSchedulingBoard'
import {
  combineLocalDateTime,
  formatBoardDate,
  formatWeekHeading,
  isSameLocalDay,
  SCHEDULING_STATUS_FILTER_ITEMS,
  SCHEDULING_VIEW_ITEMS,
  TIMELINE_END_HOUR,
  TIMELINE_START_HOUR,
  type AppointmentCreatePrefill,
  type AppointmentDraft
} from '../utils/scheduling'

defineOptions({ name: 'SchedulingIndexPage' })

definePageMeta({
  path: '/agendamentos'
})

const { can } = usePermissions()
const canWrite = computed(() => can('scheduling.write'))
const canCreateOrder = computed(() => can('orders.create'))

const formOpen = ref(false)
const saving = ref(false)
const markingId = ref<string | null>(null)
const editingAppointment = ref<SchedulingAppointment | null>(null)
const createPrefill = ref<AppointmentCreatePrefill | null>(null)

const confirmOpen = ref(false)
const confirmLoading = ref(false)
const pendingNoShowId = ref<string | null>(null)
const pendingNoShowLabel = ref('')

const {
  selectedDate,
  view,
  search,
  statusFilter,
  dayAppointments,
  dayHasAppointments,
  hasActiveFilters,
  weekCounts,
  pending,
  error,
  refresh,
  goToday,
  shiftDay,
  shiftWeek,
  selectDay
} = await useSchedulingBoard()

const {
  createAppointment,
  updateAppointment,
  markNoShow,
  undoNoShow
} = useSchedulingMutations()

const toast = useToast()

const isToday = computed(() => isSameLocalDay(selectedDate.value, new Date()))
const isWeekView = computed(() => view.value === 'week')
const boardDate = computed(() => formatBoardDate(selectedDate.value))

const moreMenuItems = computed<DropdownMenuItem[][]>(() => [[
  {
    label: 'Atualizar',
    icon: 'i-lucide-refresh-cw',
    onSelect: () => { refresh() }
  }
]])

function openCreate(prefill?: AppointmentCreatePrefill) {
  const next: AppointmentCreatePrefill = { ...prefill }
  const day = next.date ? combineLocalDateTime(next.date, '00:00') : selectedDate.value
  if (next.hour == null && !next.startTime && isSameLocalDay(day, new Date())) {
    const hour = new Date().getHours()
    if (hour >= TIMELINE_START_HOUR && hour <= TIMELINE_END_HOUR) next.hour = hour
  }
  editingAppointment.value = null
  createPrefill.value = next
  formOpen.value = true
}

// Draft handlers can run outside the page's effect scope, so their watchers/timers are disposed by hand.
const appointmentLookups = new Set<() => void>()
onBeforeUnmount(() => appointmentLookups.forEach(dispose => dispose()))

function whenAppointmentLoaded(id: string, inicio: string, action: (appointment: SchedulingAppointment) => void) {
  selectDay(new Date(inicio))
  const loaded = dayAppointments.value.find(item => item.id === id)
  if (loaded) return action(loaded)
  const stop = watch(dayAppointments, (list) => {
    const found = list.find(item => item.id === id)
    if (!found) return
    dispose()
    action(found)
  })
  const timer = setTimeout(() => {
    dispose()
    toast.add({ title: 'Agendamento não encontrado na agenda.', color: 'warning' })
  }, 10_000)
  const dispose = () => {
    stop()
    clearTimeout(timer)
    appointmentLookups.delete(dispose)
  }
  appointmentLookups.add(dispose)
}

useVoiceForm('appointment', {
  apply: (draft) => {
    if (!canWrite.value) return
    const { veiculo, date, startTime, problema } = draft.fields
    if (draft.op === 'create') {
      if (typeof date === 'string') selectDay(combineLocalDateTime(date, '00:00'))
      openCreate({
        veiculo_id: typeof veiculo === 'string' ? veiculo : undefined,
        date: typeof date === 'string' ? date : undefined,
        startTime: typeof startTime === 'string' ? startTime : undefined,
        problema: typeof problema === 'string' ? problema : undefined
      })
      return
    }
    const override = {
      ...(typeof date === 'string' ? { date } : {}),
      ...(typeof startTime === 'string' ? { startTime } : {})
    }
    // No plate spoken: the runtime used the appointment open in the slideover (no `inicio`).
    if (editingAppointment.value && draft.id === editingAppointment.value.id) return openEdit(editingAppointment.value, override)
    if (!draft.id || !draft.inicio) return
    whenAppointmentLoaded(draft.id, draft.inicio, appointment => openEdit(appointment, override))
  },
  actions: {
    faltou: (draft) => {
      if (!canWrite.value || !draft.id) return
      if (editingAppointment.value && draft.id === editingAppointment.value.id) return requestNoShow(draft.id)
      if (!draft.inicio) return
      whenAppointmentLoaded(draft.id, draft.inicio, appointment => requestNoShow(appointment.id))
    }
  },
  currentId: () => (formOpen.value ? editingAppointment.value?.id : undefined)
})

function openEdit(appointment: SchedulingAppointment, override?: Pick<AppointmentCreatePrefill, 'date' | 'startTime'>) {
  createPrefill.value = override ?? null
  editingAppointment.value = appointment
  formOpen.value = true
}

function clearFilters() {
  search.value = ''
  statusFilter.value = 'all'
}

async function onSave(draft: AppointmentDraft) {
  saving.value = true
  try {
    const result = editingAppointment.value
      ? await updateAppointment(editingAppointment.value.id, draft)
      : await createAppointment(draft)

    if (!result.error) {
      formOpen.value = false
      editingAppointment.value = null
      createPrefill.value = null
      await refresh()
    }
  } finally {
    saving.value = false
  }
}

function requestNoShow(id: string) {
  const row = dayAppointments.value.find(item => item.id === id)
  pendingNoShowId.value = id
  pendingNoShowLabel.value = row?.clientes?.nome?.trim() || 'Este agendamento'
  confirmOpen.value = true
}

async function onConfirmNoShow() {
  if (!pendingNoShowId.value) return
  const id = pendingNoShowId.value
  confirmLoading.value = true
  markingId.value = id
  try {
    const { error: updateError } = await markNoShow(id, { silent: true })
    if (!updateError) {
      confirmOpen.value = false
      pendingNoShowId.value = null
      await refresh()
      toast.add({
        title: 'Falta registrada',
        color: 'neutral',
        actions: [{
          label: 'Desfazer',
          color: 'neutral',
          variant: 'outline',
          onClick: async () => {
            markingId.value = id
            try {
              const { error: undoError } = await undoNoShow(id)
              if (!undoError) await refresh()
            } finally {
              markingId.value = null
            }
          }
        }]
      })
    }
  } finally {
    confirmLoading.value = false
    markingId.value = null
  }
}

async function onUndoNoShow(id: string) {
  markingId.value = id
  try {
    const { error: undoError } = await undoNoShow(id)
    if (!undoError) await refresh()
  } finally {
    markingId.value = null
  }
}

function onShiftPrev() {
  if (isWeekView.value) shiftWeek(-1)
  else shiftDay(-1)
}

function onShiftNext() {
  if (isWeekView.value) shiftWeek(1)
  else shiftDay(1)
}
</script>

<template>
  <UDashboardPanel>
    <template #body>
      <div class="mx-auto flex h-full min-h-0 w-full max-w-[1400px] flex-col gap-4 p-4 sm:gap-6 sm:p-6">
        <header class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div class="min-w-0">
            <p class="text-xs font-semibold uppercase tracking-widest text-muted">
              Agendamentos
            </p>
            <div class="mt-2 flex items-end gap-4">
              <p
                v-if="!isWeekView"
                class="font-mono text-4xl font-bold leading-none tabular-nums tracking-tight text-highlighted sm:text-5xl"
              >
                {{ boardDate.day }}
              </p>
              <div class="min-w-0 pb-0.5">
                <p class="text-lg font-semibold text-pretty text-highlighted">
                  {{ isWeekView ? formatWeekHeading(selectedDate) : boardDate.weekday }}
                </p>
                <p
                  v-if="!isWeekView"
                  class="text-sm text-muted"
                >
                  {{ boardDate.monthYear }}
                </p>
              </div>
              <span
                v-if="isToday && !isWeekView"
                class="mb-1 size-2 shrink-0 rounded-full bg-primary motion-safe:animate-pulse"
                aria-label="Hoje"
              />
            </div>

            <div class="mt-4 flex flex-wrap items-center gap-1">
              <UButton
                icon="i-lucide-chevron-left"
                color="neutral"
                variant="ghost"
                size="sm"
                :aria-label="isWeekView ? 'Semana anterior' : 'Dia anterior'"
                class="min-h-11 min-w-11 motion-safe:active:scale-[0.98]"
                @click="onShiftPrev"
              />
              <UButton
                icon="i-lucide-chevron-right"
                color="neutral"
                variant="ghost"
                size="sm"
                :aria-label="isWeekView ? 'Próxima semana' : 'Próximo dia'"
                class="min-h-11 min-w-11 motion-safe:active:scale-[0.98]"
                @click="onShiftNext"
              />
              <UButton
                color="neutral"
                :variant="isToday ? 'soft' : 'ghost'"
                size="sm"
                label="Hoje"
                :aria-current="isToday ? 'date' : undefined"
                class="min-h-11"
                @click="goToday"
              />
              <UTabs
                v-model="view"
                :items="SCHEDULING_VIEW_ITEMS"
                :content="false"
                variant="link"
                size="sm"
                class="ml-1 w-auto"
              />
            </div>
          </div>

          <div class="flex w-full flex-col gap-2 lg:w-auto lg:flex-row lg:flex-wrap lg:items-center">
            <UInput
              v-model="search"
              icon="i-lucide-search"
              placeholder="Cliente ou placa…"
              aria-label="Buscar cliente ou placa"
              autocomplete="off"
              name="scheduling-search"
              class="w-full lg:w-56"
            />
            <USelect
              v-model="statusFilter"
              :items="SCHEDULING_STATUS_FILTER_ITEMS"
              size="md"
              class="w-full lg:w-36"
              aria-label="Filtrar por status"
            />
            <div class="flex w-full items-center gap-2 lg:w-auto">
              <UButton
                v-if="canWrite"
                icon="i-lucide-plus"
                label="Novo agendamento"
                class="min-h-11 flex-1 justify-center motion-safe:active:scale-[0.98] lg:flex-none"
                @click="openCreate()"
              />
              <UDropdownMenu
                :items="moreMenuItems"
                :content="{ align: 'end' }"
              >
                <UButton
                  icon="i-lucide-ellipsis"
                  color="neutral"
                  variant="ghost"
                  class="min-h-11 min-w-11"
                  aria-label="Mais ações"
                />
              </UDropdownMenu>
            </div>
          </div>
        </header>

        <UAlert
          v-if="error"
          color="error"
          variant="subtle"
          title="Não foi possível carregar a agenda"
          :description="error.message"
        >
          <template #actions>
            <UButton
              label="Tentar de novo"
              color="neutral"
              variant="outline"
              size="xs"
              @click="refresh()"
            />
          </template>
        </UAlert>

        <SchedulingDailyTimeline
          v-if="view === 'daily'"
          :appointments="dayAppointments"
          :pending="pending"
          :can-write="canWrite"
          :can-create-order="canCreateOrder"
          :marking-id="markingId"
          :has-active-filters="hasActiveFilters"
          :day-has-appointments="dayHasAppointments"
          @create="openCreate"
          @clear-filters="clearFilters"
          @edit="openEdit"
          @mark-no-show="requestNoShow"
          @undo-no-show="onUndoNoShow"
        />

        <SchedulingCalendar
          v-else
          :selected-date="selectedDate"
          :counts="weekCounts"
          :pending="pending"
          @select="selectDay"
        />
      </div>

      <LazySchedulingFormSlideover
        v-if="canWrite"
        v-model:open="formOpen"
        :day="selectedDate"
        :appointment="editingAppointment"
        :prefill="createPrefill"
        :saving="saving"
        :can-create-order="canCreateOrder"
        @submit="onSave"
      />

      <UModal
        v-model:open="confirmOpen"
        title="Marcar como faltou?"
        :description="`${pendingNoShowLabel} será marcado como não compareceu.`"
        :ui="{ content: 'overscroll-contain', footer: 'justify-end' }"
      >
        <template #footer>
          <UButton
            color="neutral"
            variant="outline"
            label="Voltar"
            :disabled="confirmLoading"
            @click="confirmOpen = false"
          />
          <UButton
            color="error"
            label="Faltou"
            :loading="confirmLoading"
            @click="onConfirmNoShow"
          />
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
