<script setup lang="ts">
import {
  formatDayHeading,
  isSameLocalDay,
  SCHEDULING_STATUS_FILTER_ITEMS,
  SCHEDULING_VIEW_ITEMS,
  startOfLocalDay,
  type AppointmentDraft,
  type SchedulingView
} from '../utils/scheduling'
import { downloadSchedulingDayPdf } from '../utils/pdf'

defineOptions({ name: 'SchedulingIndexPage' })

definePageMeta({
  path: '/agendamentos',
  layout: 'app'
})

const { can } = usePermissions()
const canWrite = computed(() => can('scheduling.write'))

const view = ref<SchedulingView>('daily')
const formOpen = ref(false)
const saving = ref(false)
const markingId = ref<string | null>(null)

const {
  selectedDate,
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
  markNoShow,
  markHandledNoShow
} = useSchedulingMutations()

const isToday = computed(() => isSameLocalDay(selectedDate.value, new Date()))

async function onCreate(draft: AppointmentDraft) {
  saving.value = true
  try {
    const { error: createError } = await createAppointment(draft)
    if (!createError) {
      formOpen.value = false
      await refresh()
    }
  } finally {
    saving.value = false
  }
}

async function onMarkNoShow(id: string) {
  markingId.value = id
  try {
    const { error: updateError } = await markNoShow(id)
    if (!updateError) await refresh()
  } finally {
    markingId.value = null
  }
}

async function onHandleNoShow(id: string) {
  markingId.value = id
  try {
    const { error: updateError } = await markHandledNoShow(id)
    if (!updateError) await refresh()
  } finally {
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
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Agendamentos">
        <template #leading>
          <UDashboardSidebarToggle />
        </template>
        <template #right>
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
          <UButton
            v-if="canWrite"
            icon="i-lucide-plus"
            label="Novo agendamento"
            @click="formOpen = true"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex h-full min-h-0 flex-col gap-4 p-4 sm:p-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 class="text-lg font-semibold tracking-tight text-highlighted text-balance sm:text-xl">
              Agenda da oficina
            </h1>
            <p class="mt-0.5 text-sm text-muted">
              Horários, pátio e não comparecimento em um painel.
            </p>
          </div>

          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Buscar cliente ou placa…"
            autocomplete="off"
            class="sm:hidden"
          />
        </div>

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
              aria-label="Dia anterior"
              @click="shiftDay(-1)"
            />
            <span class="min-w-40 text-center text-sm font-medium text-highlighted">
              {{ formatDayHeading(selectedDate) }}
            </span>
            <UButton
              icon="i-lucide-chevron-right"
              color="neutral"
              variant="ghost"
              size="sm"
              aria-label="Próximo dia"
              @click="shiftDay(1)"
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
            @create="formOpen = true"
            @mark-no-show="onMarkNoShow"
          />

          <div class="space-y-4">
            <SchedulingPatioPanel
              :slots="patioSlots"
              :pending="pending"
            />
            <SchedulingNoShowList
              :items="noShows"
              :pending="pending"
              :can-write="canWrite"
              @handle="onHandleNoShow"
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

      <SchedulingFormModal
        v-if="canWrite"
        v-model:open="formOpen"
        :day="selectedDate"
        :saving="saving"
        @submit="onCreate"
      />
    </template>
  </UDashboardPanel>
</template>
