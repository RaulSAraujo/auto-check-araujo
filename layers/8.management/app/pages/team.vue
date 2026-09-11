<script setup lang="ts">
import type { ColaboradorPapel } from '~~/shared/types/oficina'
import type { CollaboratorRow } from '#layers/auth/app/composables/useCollaborators'

defineOptions({ name: 'TeamIndexPage' })

definePageMeta({
  path: '/gestao/equipe'
})

useSeoMeta({
  title: 'Equipe',
  description: 'Colaboradores e papéis de acesso.'
})

useRequirePermission('collaborators.manage')

const user = useSupabaseUser()
const currentUserId = computed(() => user.value?.id)

const { collaborators, pending, refresh } = await useCollaboratorsList()
const { updatePapel, resetCollaboratorPassword } = useCollaboratorMutations()

const createOpen = ref(false)
const passwordOpen = ref(false)
const passwordTarget = ref<CollaboratorRow | null>(null)
const updatingId = ref<string | null>(null)
const resettingPassword = ref(false)

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
      <div class="bg-muted p-4 sm:p-5">
        <div class="mx-auto w-full max-w-6xl space-y-5">
          <BasePageHeader
            title="Equipe"
            description="Quem entra no sistema e com qual papel."
          >
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
                @click="createOpen = true"
              />
            </template>
          </BasePageHeader>

          <BasePanel>
            <TeamCollaboratorsTable
              :collaborators="collaborators || []"
              :loading="pending"
              :current-user-id="currentUserId"
              :updating-id="updatingId"
              @update:papel="onUpdatePapel"
              @reset-password="onResetPassword"
              @create="createOpen = true"
            />
          </BasePanel>

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
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
