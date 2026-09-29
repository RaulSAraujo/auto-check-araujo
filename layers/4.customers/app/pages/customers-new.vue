<script setup lang="ts">
import {
  emptyCustomerForm,
  formatDocumento,
  formatPhoneBr,
  isCustomerFormDirty
} from '../utils/customer-form'
import { CUSTOMER_ROUTES } from '../utils/customer-routes'
import { normalizeContactList } from '~~/shared/utils/contact'

defineOptions({ name: 'CustomersNewPage' })

definePageMeta({
  path: '/clientes/novo'
})

useSeoMeta({
  title: 'Novo cliente',
  description: 'Cadastrar cliente da oficina.'
})

const router = useRouter()
useRequirePermission('customers.write')
const { state } = useCustomerForm()
const { createCustomer } = useCustomerMutations()

const initialState = emptyCustomerForm()
const loading = ref(false)
const allowLeave = ref(false)

const isDirty = computed(() => isCustomerFormDirty(state, initialState))

const { onVoiceDraft } = useVoiceDraft()
onVoiceDraft('customer.create', (draft) => {
  if (draft.nome) state.nome = draft.nome
  if (draft.telefones?.length) state.telefones = normalizeContactList(draft.telefones.map(formatPhoneBr))
  if (draft.emails?.length) state.emails = normalizeContactList(draft.emails)
  if (draft.documento) state.documento = formatDocumento(draft.documento)
  if (draft.observacoes) state.observacoes = draft.observacoes
})

async function onSubmit() {
  loading.value = true
  try {
    const { data } = await createCustomer(state)
    if (data) {
      allowLeave.value = true
      await router.push(CUSTOMER_ROUTES.detail(data.id))
    }
  } finally {
    loading.value = false
  }
}

onBeforeRouteLeave((_to, _from, next) => {
  if (allowLeave.value || loading.value || !isDirty.value) {
    next()
    return
  }

  const confirmed = window.confirm(
    'Há alterações não salvas. Sair sem cadastrar o cliente?'
  )
  next(confirmed)
})

onMounted(() => {
  const onBeforeUnload = (event: BeforeUnloadEvent) => {
    if (!isDirty.value || allowLeave.value || loading.value) return
    event.preventDefault()
    event.returnValue = ''
  }

  window.addEventListener('beforeunload', onBeforeUnload)
  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', onBeforeUnload)
  })
})
</script>

<template>
  <UDashboardPanel>
    <template #body>
      <div class="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-6">
        <BasePageHeader
          title="Novo cliente"
          description="Nome e um telefone para ligar."
        >
          <template #actions>
            <UButton
              :to="CUSTOMER_ROUTES.list"
              color="neutral"
              variant="ghost"
              label="Voltar"
              icon="i-lucide-arrow-left"
            />
          </template>
        </BasePageHeader>

        <CustomersNewForm
          v-model="state"
          :loading="loading"
          @submit="onSubmit"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
