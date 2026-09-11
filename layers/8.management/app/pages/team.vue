<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import type { ColaboradorPapel } from '~~/shared/types/oficina'
import {
  currentTeamMonthValue,
  isTeamTab,
  TEAM_TAB_DEFAULT,
  TEAM_TAB_EMPTY,
  TEAM_TAB_ICON,
  TEAM_TAB_LABEL,
  TEAM_TABS,
  type TeamTab
} from '../utils/team'

defineOptions({ name: 'TeamIndexPage' })

definePageMeta({
  path: '/gestao/equipe'
})

useSeoMeta({
  title: 'Equipe',
  description: 'Gestão de desempenho e produtividade da equipe.'
})

useRequirePermission('collaborators.manage')

const route = useRoute()
const router = useRouter()

const user = useSupabaseUser()
const currentUserId = computed(() => user.value?.id)

const selectedMonth = ref(currentTeamMonthValue())
const selectedCollaboratorId = ref<string | 'all'>('all')

const { collaborators, pending, refresh } = await useCollaboratorsList()
const { updatePapel } = useCollaboratorMutations()

const {
  rows: presenceRows,
  pending: presencePending,
  refresh: refreshPresence
} = useTeamPresences(selectedMonth, selectedCollaboratorId)

const {
  rows: absenceRows,
  pending: absencePending,
  refresh: refreshAbsences
} = useTeamAbsences(selectedMonth, selectedCollaboratorId)

const {
  rows: incidentRows,
  pending: incidentPending,
  refresh: refreshIncidents
} = useTeamIncidents(selectedMonth, selectedCollaboratorId)

const {
  indicators,
  pending: indicatorsPending,
  refresh: refreshIndicators
} = useTeamIndicators(selectedMonth)

const updatingId = ref<string | null>(null)

const tabItems = TEAM_TABS.map(value => ({
  label: TEAM_TAB_LABEL[value],
  value,
  icon: TEAM_TAB_ICON[value]
})) satisfies TabsItem[]

const tab = computed({
  get(): TeamTab {
    return isTeamTab(route.query.tab) ? route.query.tab : TEAM_TAB_DEFAULT
  },
  set(next: string | number) {
    const value = isTeamTab(next) ? next : TEAM_TAB_DEFAULT
    const query = { ...route.query }
    if (value === TEAM_TAB_DEFAULT) {
      delete query.tab
    } else {
      query.tab = value
    }
    router.replace({ query })
  }
})

const showPeriodFilters = computed(() => tab.value !== 'colaboradores')

const emptyState = computed(() => {
  if (tab.value === 'colaboradores') return null
  return TEAM_TAB_EMPTY[tab.value]
})

const collaboratorItems = computed(() =>
  (collaborators.value || []).map(row => ({
    label: row.nome,
    value: row.id
  }))
)

const collaboratorFilterItems = computed(() => [
  { label: 'Todos', value: 'all' },
  ...collaboratorItems.value
])

async function onUpdatePapel(payload: { id: string, papel: ColaboradorPapel }) {
  updatingId.value = payload.id
  try {
    const { error } = await updatePapel(payload.id, payload.papel)
    if (!error) await refresh()
  } finally {
    updatingId.value = null
  }
}

async function onPresenceChanged() {
  await Promise.all([refreshPresence(), refreshIndicators()])
}

async function onAbsenceChanged() {
  await Promise.all([refreshAbsences(), refreshIndicators()])
}

async function onIncidentChanged() {
  await refreshIncidents()
}
</script>

<template>
  <UDashboardPanel>
    <template #body>
      <div class="p-4 sm:p-6 space-y-6 max-w-6xl">
        <BasePageHeader
          title="Equipe"
          description="Controle de desempenho e produtividade."
        >
          <template #title-trailing>
            <UBadge
              color="neutral"
              variant="subtle"
              size="sm"
            >
              Gestão
            </UBadge>
          </template>
        </BasePageHeader>

        <UTabs
          v-model="tab"
          :items="tabItems"
          :content="false"
          variant="link"
          class="w-full"
        />

        <div
          v-if="showPeriodFilters"
          class="flex flex-wrap items-end gap-3"
        >
          <UFormField label="Período">
            <UInput
              v-model="selectedMonth"
              type="month"
              class="w-44"
            />
          </UFormField>

          <UFormField
            v-if="tab !== 'indicadores' && tab !== 'tempo-medio' && tab !== 'avaliacoes'"
            label="Colaborador"
          >
            <USelect
              v-model="selectedCollaboratorId"
              :items="collaboratorFilterItems"
              value-key="value"
              class="min-w-44"
            />
          </UFormField>
        </div>

        <div
          v-if="tab === 'colaboradores'"
          class="space-y-6 lg:grid lg:grid-cols-3 lg:items-start lg:gap-6 lg:space-y-0"
        >
          <TeamCollaboratorsCreateForm
            class="lg:col-span-1"
            @created="refresh"
          />

          <section class="space-y-4 lg:col-span-2">
            <h2 class="text-lg font-semibold text-highlighted">
              Equipe
            </h2>

            <div
              v-if="pending && !collaborators?.length"
              class="space-y-2"
            >
              <USkeleton class="h-10 w-full" />
              <USkeleton class="h-10 w-full" />
            </div>

            <TeamCollaboratorsTable
              v-else-if="collaborators?.length"
              :collaborators="collaborators"
              :current-user-id="currentUserId"
              :updating-id="updatingId"
              @update:papel="onUpdatePapel"
            />

            <BaseEmptyState
              v-else
              icon="i-lucide-user-plus"
            >
              Nenhum colaborador.
            </BaseEmptyState>
          </section>
        </div>

        <TeamPresenceSection
          v-else-if="tab === 'presenca'"
          :rows="presenceRows || []"
          :pending="presencePending"
          :collaborator-items="collaboratorItems"
          @saved="onPresenceChanged"
          @deleted="onPresenceChanged"
        />

        <TeamAbsencesSection
          v-else-if="tab === 'faltas'"
          :rows="absenceRows || []"
          :pending="absencePending"
          :collaborator-items="collaboratorItems"
          @saved="onAbsenceChanged"
          @deleted="onAbsenceChanged"
        />

        <TeamIndicatorsSection
          v-else-if="tab === 'indicadores'"
          :indicators="indicators ?? null"
          :pending="indicatorsPending"
        />

        <TeamIncidentsSection
          v-else-if="tab === 'ocorrencias'"
          :rows="incidentRows || []"
          :pending="incidentPending"
          :collaborator-items="collaboratorItems"
          @saved="onIncidentChanged"
          @deleted="onIncidentChanged"
        />

        <BaseEmptyState
          v-else-if="emptyState"
          :icon="emptyState.icon"
        >
          {{ emptyState.message }}
        </BaseEmptyState>
      </div>
    </template>
  </UDashboardPanel>
</template>
