<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { SchedulingAppointment } from '../composables/useSchedulingBoard'
import {
  formatDayHeading,
  formatMonthHeading,
  isSameLocalDay,
  SCHEDULING_STATUS_FILTER_ITEMS,
  SCHEDULING_VIEW_ITEMS,
  startOfLocalDay,
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

const confirmTitle = computed(() =>
  pendingConfirm.value?.kind === 'handle-no-show'
    ? 'Marcar como tratado?'
    : 'Marcar não comparecimento?'
)

const confirmDescription = computed(() => {
  const name = pendingConfirm.value?.label || 'este agendamento'
  if (pendingConfirm.value?.kind === 'handle-no-show') {
    return `${name} sairá da lista de não comparecimentos. O status passará a Tratado.`
  }
  return `${name} será marcado como não compareceu.`
})

const confirmLabel = computed(() =>
  pendingConfirm.value?.kind === 'handle-no-show' ? 'Marcar tratado' : 'Não compareceu'
)

const moreMenuItems = computed<DropdownMenuItem[][]>(() => [[
  {
    label: 'Exportar PDF',
    icon: 'i-lucide-file-down',
    onSelect: () => onExportPdf()
  }
]])

function openCreate() {
  editingAppointment.value = null
  formOpen.value = true
}

function openEdit(appointment: SchedulingAppointment) {
  editingAppointment.value = appointment
  formOpen.value = true
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
      <div class="flex h-full min-h-0 flex-col gap-4 p-4 sm:p-6">
        <BasePageHeader
          title="Agendamentos"
          description="Horários, pátio e não comparecimento em um painel."
        >
          <template #actions>
            <div class="hidden min-w-56 max-w-xs sm:block">
              <UInput
                v-model="search"
                icon="i-lucide-search"
                placeholder="Buscar cliente ou placa…"
                autocomplete="off"
              />
            </div>
            <UButton
              icon="i-lucide-refresh-cw"
              color="neutral"
              variant="ghost"
              aria-label="Atualizar agenda"
              :loading="pending"
              @click="refresh()"
            />
            <UButton
              icon="i-lucide-file-down"
              color="neutral"
              variant="outline"
              label="Exportar PDF"
              class="hidden sm:inline-flex"
              @click="onExportPdf"
            />
            <UDropdownMenu
              :items="moreMenuItems"
              :content="{ align: 'end' }"
              class="sm:hidden"
            >
              <UButton
                icon="i-lucide-ellipsis"
                color="neutral"
                variant="outline"
                aria-label="Mais ações"
              />
            </UDropdownMenu>
            <UButton
              v-if="canWrite"
              icon="i-lucide-plus"
              label="Novo agendamento"
              @click="openCreate"
            />
          </template>
        </BasePageHeader>

        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Buscar cliente ou placa…"
          autocomplete="off"
          class="sm:hidden"
        />

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

        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <UTabs
            v-model="view"
            :items="SCHEDULING_VIEW_ITEMS"
            :content="false"
            class="w-full max-w-md"
          />

          <div class="flex flex-wrap items-center gap-2">
            <UButton
              color="neutral"
              variant="outline"
              size="sm"
              label="Hoje"
              :disabled="isToday"
              @click="goToday"
            />
            <UButton
              icon="i-lucide-chevron-left"
              color="neutral"
              variant="ghost"
              size="sm"
              :aria-label="isCalendarView ? 'Mês anterior' : 'Dia anterior'"
              @click="onShiftPrev"
            />
            <span class="min-w-40 text-center text-sm font-medium text-highlighted text-balance">
              {{ isCalendarView ? formatMonthHeading(selectedDate) : formatDayHeading(selectedDate) }}
            </span>
            <UButton
              icon="i-lucide-chevron-right"
              color="neutral"
              variant="ghost"
              size="sm"
              :aria-label="isCalendarView ? 'Próximo mês' : 'Próximo dia'"
              @click="onShiftNext"
            />
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="item in SCHEDULING_STATUS_FILTER_ITEMS"
            :key="item.value"
            size="sm"
            :color="statusFilter === item.value ? 'primary' : 'neutral'"
            :variant="statusFilter === item.value ? 'soft' : 'outline'"
            :label="item.label"
            @click="statusFilter = item.value"
          />
        </div>

        <div
          v-if="view === 'daily'"
          class="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(18rem,1fr)]"
        >
          <SchedulingDailyTimeline
            :appointments="dayAppointments"
            :pending="pending"
            :can-write="canWrite"
            :can-create-order="canCreateOrder"
            :marking-id="markingId"
            @create="openCreate"
            @edit="openEdit"
            @mark-no-show="requestNoShow"
          />

          <div class="space-y-4">
            <SchedulingPatioPanel
              :slots="patioSlots"
              :pending="pending"
              :can-write="canWrite"
              @edit="openEdit"
            />
            <SchedulingNoShowList
              :items="noShows"
              :pending="pending"
              :can-write="canWrite"
              :marking-id="markingId"
              @handle="requestHandleNoShow"
              @edit="openEdit"
            />
          </div>
        </div>

        <SchedulingCalendar
          v-else
          :selected-date="selectedDate"
          :counts="monthCounts"
          :pending="pending"
          @select="onSelectCalendarDay"
          @prev-month="shiftMonth(-1)"
          @next-month="shiftMonth(1)"
        />
      </div>

      <SchedulingFormSlideover
        v-if="canWrite"
        v-model:open="formOpen"
        :day="selectedDate"
        :appointment="editingAppointment"
        :saving="saving"
        :can-create-order="canCreateOrder"
        @submit="onSave"
      />

      <SchedulingConfirmDialog
        v-model:open="confirmOpen"
        :title="confirmTitle"
        :description="confirmDescription"
        :confirm-label="confirmLabel"
        :loading="confirmLoading"
        @confirm="onConfirmAction"
      />
    </template>
  </UDashboardPanel>
</template>
