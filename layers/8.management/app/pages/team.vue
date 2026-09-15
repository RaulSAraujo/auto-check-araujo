<script setup lang="ts">
import type { ColaboradorPapel } from '~~/shared/types/oficina'
import type { CollaboratorRow } from '#layers/auth/app/composables/useCollaborators'
import { settingsHubBreadcrumb } from '#layers/configuration/app/utils/settings-hub'

defineOptions({ name: 'TeamIndexPage' })

definePageMeta({
  path: '/gestao/equipe'
})

useSeoMeta({
  title: 'Equipe',
  description: 'Colaboradores e papéis de acesso.'
})

useRequirePermission('collaborators.manage')

const breadcrumbItems = settingsHubBreadcrumb('Equipe')
const user = useSupabaseUser()
const currentUserId = computed(() => user.value?.id)

const { collaborators, pending, refresh } = useCollaboratorsList()
const { updatePapel, resetCollaboratorPassword, deleteCollaborator } = useCollaboratorMutations()

const createOpen = ref(false)
const passwordOpen = ref(false)
const deleteOpen = ref(false)
const passwordTarget = ref<CollaboratorRow | null>(null)
const deleteTarget = ref<CollaboratorRow | null>(null)
const updatingId = ref<string | null>(null)
const resettingPassword = ref(false)
const deleting = ref(false)

const countLabel = computed(() => {
  const n = collaborators.value?.length ?? 0
  if (pending.value && !n) return null
  return n === 1 ? '1 colaborador' : `${n} colaboradores`
})

async function onUpdatePapel(payload: { id: string, papel: ColaboradorPapel }) {
  if (payload.id === currentUserId.value) return
  updatingId.value = payload.id
  try {
    await updatePapel(payload.id, payload.papel)
    await refresh()
  } finally {
    updatingId.value = null
  }
}

function onResetPassword(row: CollaboratorRow) {
  passwordTarget.value = row
  passwordOpen.value = true
}

function onDelete(row: CollaboratorRow) {
  if (row.id === currentUserId.value) return
  deleteTarget.value = row
  deleteOpen.value = true
}

async function onConfirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    const { error } = await deleteCollaborator(deleteTarget.value.id)
    if (!error) {
      deleteOpen.value = false
      deleteTarget.value = null
      await refresh()
    }
  } finally {
    deleting.value = false
  }
}

async function onConfirmPassword(password: string) {
  if (!passwordTarget.value) return
  resettingPassword.value = true
  try {
    const { error } = await resetCollaboratorPassword(passwordTarget.value.id, password)
    if (!error) passwordOpen.value = false
  } finally {
    resettingPassword.value = false
  }
}

async function onCreated() {
  createOpen.value = false
  await refresh()
}
</script>

<template>
  <UDashboardPanel>
    <template #body>
      <div class="bg-muted p-4 sm:p-6">
        <div class="w-full space-y-6">
          <BasePageHeader
            title="Equipe"
            description="Quem entra no sistema e com qual papel."
          >
            <template #breadcrumb>
              <UBreadcrumb :items="breadcrumbItems" />
            </template>

            <template
              v-if="countLabel"
              #below
            >
              <p class="text-xs tabular-nums text-muted">
                {{ countLabel }}
              </p>
            </template>

            <template #actions>
              <UButton
                label="Novo colaborador"
                icon="i-lucide-user-plus"
                class="w-full justify-center sm:w-auto"
                @click="createOpen = true"
              />
            </template>
          </BasePageHeader>

          <TeamCollaboratorsTable
            :collaborators="collaborators || []"
            :loading="pending"
            :current-user-id="currentUserId"
            :updating-id="updatingId"
            :deleting-id="deleting ? deleteTarget?.id : null"
            @update:papel="onUpdatePapel"
            @reset-password="onResetPassword"
            @delete="onDelete"
            @create="createOpen = true"
          />

          <USlideover
            v-model:open="createOpen"
            title="Novo colaborador"
            description="Cria login e define o papel de acesso."
            :ui="{ content: 'overscroll-contain' }"
          >
            <template #body>
              <TeamCollaboratorsCreateForm @created="onCreated" />
            </template>
          </USlideover>

          <TeamCollaboratorsPasswordModal
            v-model:open="passwordOpen"
            :collaborator="passwordTarget"
            :loading="resettingPassword"
            @confirm="onConfirmPassword"
          />

          <TeamCollaboratorsDeleteModal
            v-model:open="deleteOpen"
            :collaborator="deleteTarget"
            :loading="deleting"
            @confirm="onConfirmDelete"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
