<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { SchedulingAppointment } from '../composables/useSchedulingBoard'
import {
  formatBoardDate,
  formatMonthHeading,
  isSameLocalDay,
  SCHEDULING_STATUS_FILTER_ITEMS,
  SCHEDULING_VIEW_ITEMS,
  startOfLocalDay,
  TIMELINE_END_HOUR,
  TIMELINE_START_HOUR,
  type AppointmentCreatePrefill,
  type AppointmentDraft
} from '../utils/scheduling'
import { downloadSchedulingDayPdf } from '../utils/pdf'

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
const pendingConfirm = ref<{
  kind: 'no-show' | 'handle-no-show'
  id: string
  label: string
} | null>(null)

const {
  selectedDate,
  view,
  search,
  statusFilter,
  dayAppointments,
  dayHasAppointments,
  hasActiveFilters,
  patioSlots,
  noShows,
  monthCounts,
  pending,
  error,
  refresh,
  goToday,
  shiftDay,
  shiftMonth
} = await useSchedulingBoard()

const {
  createAppointment,
  updateAppointment,
  markNoShow,
  markHandledNoShow,
  undoNoShow
} = useSchedulingMutations()

const toast = useToast()

const isToday = computed(() => isSameLocalDay(selectedDate.value, new Date()))
const isCalendarView = computed(() => view.value === 'calendar')
const boardDate = computed(() => formatBoardDate(selectedDate.value))

const confirmTitle = computed(() =>
  pendingConfirm.value?.kind === 'handle-no-show'
    ? 'Marcar como tratado?'
    : 'Marcar não comparecimento?'
)

const confirmDescription = computed(() => {
  const name = pendingConfirm.value?.label || 'este agendamento'
  if (pendingConfirm.value?.kind === 'handle-no-show') {
    return `${name} sai da lista.`
  }
  return `${name} será marcado como não compareceu.`
})

const confirmLabel = computed(() =>
  pendingConfirm.value?.kind === 'handle-no-show' ? 'Marcar tratado' : 'Não compareceu'
)

const moreMenuItems = computed<DropdownMenuItem[][]>(() => [[
  {
    label: 'Atualizar',
    icon: 'i-lucide-refresh-cw',
    onSelect: () => { refresh() }
  },
  {
    label: 'Exportar PDF',
    icon: 'i-lucide-file-down',
    onSelect: () => onExportPdf()
  }
]])

function openCreate(prefill?: AppointmentCreatePrefill) {
  const next: AppointmentCreatePrefill = { ...prefill }
  if (next.hour == null && isSameLocalDay(selectedDate.value, new Date())) {
    const hour = new Date().getHours()
    if (hour >= TIMELINE_START_HOUR && hour <= TIMELINE_END_HOUR) next.hour = hour
  }
  editingAppointment.value = null
  createPrefill.value = next
  formOpen.value = true
}

function openEdit(appointment: SchedulingAppointment) {
  createPrefill.value = null
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
    || noShows.value.find(item => item.id === id)
  pendingConfirm.value = {
    kind: 'no-show',
    id,
    label: row?.clientes?.nome?.trim() || 'Este agendamento'
  }
  confirmOpen.value = true
}

function requestHandleNoShow(id: string) {
  const row = noShows.value.find(item => item.id === id)
  pendingConfirm.value = {
    kind: 'handle-no-show',
    id,
    label: row?.clientes?.nome?.trim() || 'Este agendamento'
  }
  confirmOpen.value = true
}

async function onConfirmAction() {
  if (!pendingConfirm.value) return
  const { kind, id } = pendingConfirm.value
  confirmLoading.value = true
  markingId.value = id
  try {
    const { error: updateError } = kind === 'no-show'
      ? await markNoShow(id, { silent: true })
      : await markHandledNoShow(id)

    if (!updateError) {
      confirmOpen.value = false
      pendingConfirm.value = null
      await refresh()

      if (kind === 'no-show') {
        toast.add({
          title: 'Não comparecimento registrado',
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
    }
  } finally {
    confirmLoading.value = false
    markingId.value = null
  }
}

function onExportPdf() {
  downloadSchedulingDayPdf(
    selectedDate.value,
    dayAppointments.value.map(row => ({
      inicio: row.inicio,
      fim: row.fim,
      clienteNome: row.clientes?.nome?.trim() || EMPTY_VALUE,
      placa: row.veiculos?.placa || '',
      servico: row.servico,
      patioVaga: row.patio_vaga,
      status: row.status
    }))
  )
}

function onSelectCalendarDay(day: Date) {
  selectedDate.value = startOfLocalDay(day)
  view.value = 'daily'
}

function onShiftPrev() {
  if (isCalendarView.value) shiftMonth(-1)
  else shiftDay(-1)
}

function onShiftNext() {
  if (isCalendarView.value) shiftMonth(1)
  else shiftDay(1)
}
</script>

<template>
  <UDashboardPanel>
    <template #body>
      <div class="mx-auto flex h-full min-h-0 w-full max-w-[1400px] flex-col gap-6 p-4 sm:p-6">
        <header class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div class="min-w-0">
            <p class="text-xs font-semibold uppercase tracking-widest text-muted">
              Agendamentos
            </p>
            <div class="mt-2 flex items-end gap-4">
              <p
                v-if="!isCalendarView"
                class="font-mono text-4xl font-bold leading-none tabular-nums tracking-tight text-highlighted sm:text-5xl"
              >
                {{ boardDate.day }}
              </p>
              <div class="min-w-0 pb-0.5">
                <p class="text-lg font-semibold text-pretty text-highlighted">
                  {{ isCalendarView ? formatMonthHeading(selectedDate) : boardDate.weekday }}
                </p>
                <p
                  v-if="!isCalendarView"
                  class="text-sm text-muted"
                >
                  {{ boardDate.monthYear }}
                </p>
              </div>
              <span
                v-if="isToday && !isCalendarView"
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
                :aria-label="isCalendarView ? 'Mês anterior' : 'Dia anterior'"
                class="motion-safe:active:scale-[0.98]"
                @click="onShiftPrev"
              />
              <UButton
                icon="i-lucide-chevron-right"
                color="neutral"
                variant="ghost"
                size="sm"
                :aria-label="isCalendarView ? 'Próximo mês' : 'Próximo dia'"
                class="motion-safe:active:scale-[0.98]"
                @click="onShiftNext"
              />
              <UButton
                color="neutral"
                :variant="isToday ? 'soft' : 'ghost'"
                size="sm"
                label="Hoje"
                :aria-current="isToday ? 'date' : undefined"
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

          <div class="flex flex-wrap items-center gap-2">
            <UInput
              v-model="search"
              icon="i-lucide-search"
              placeholder="Cliente ou placa…"
              aria-label="Buscar cliente ou placa"
              autocomplete="off"
              name="scheduling-search"
              class="w-full sm:w-56"
            />
            <USelect
              v-model="statusFilter"
              :items="SCHEDULING_STATUS_FILTER_ITEMS"
              size="md"
              class="w-36"
              aria-label="Filtrar por status"
            />
            <UButton
              v-if="canWrite"
              icon="i-lucide-plus"
              label="Novo agendamento"
              class="motion-safe:active:scale-[0.98]"
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
                aria-label="Mais ações"
              />
            </UDropdownMenu>
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

        <div
          v-if="view === 'daily'"
          class="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_19rem] xl:items-start"
        >
          <SchedulingDailyTimeline
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
          />

          <aside class="space-y-4">
            <SchedulingPatioPanel
              :slots="patioSlots"
              :pending="pending"
              :can-write="canWrite"
              @edit="openEdit"
              @create="openCreate({ patioVaga: $event })"
            />
            <SchedulingNoShowList
              :items="noShows"
              :pending="pending"
              :can-write="canWrite"
              :marking-id="markingId"
              @handle="requestHandleNoShow"
              @edit="openEdit"
            />
          </aside>
        </div>

        <SchedulingCalendar
          v-else
          :selected-date="selectedDate"
          :counts="monthCounts"
          :pending="pending"
          @select="onSelectCalendarDay"
        />
      </div>

      <SchedulingFormSlideover
        v-if="canWrite"
        v-model:open="formOpen"
        :day="selectedDate"
        :appointment="editingAppointment"
        :prefill="createPrefill"
        :saving="saving"
        :can-create-order="canCreateOrder"
        @submit="onSave"
      />

      <SchedulingConfirmDialog
        v-model:open="confirmOpen"
        :title="confirmTitle"
        :description="confirmDescription"
        :confirm-label="confirmLabel"
        :confirm-color="pendingConfirm?.kind === 'handle-no-show' ? 'neutral' : 'error'"
        :loading="confirmLoading"
        @confirm="onConfirmAction"
      />
    </template>
  </UDashboardPanel>
</template>
