<script setup lang="ts">
import {
  emptyPricingDraft,
  isPricingDraftValid,
  type PricingParamsDraft
} from '../utils/pricing'
import { settingsHubBreadcrumb } from '../utils/settings-hub'
import { applyVoiceFields } from '#layers/base/app/utils/voice/apply'
import { VOICE_CATALOG } from '#layers/base/app/utils/voice/catalog'

defineOptions({ name: 'PricingIndexPage' })

definePageMeta({
  path: '/configuracao/precificacao'
})

useSeoMeta({
  title: 'Precificação',
  description: 'Configuração de parâmetros de mão de obra e peças.'
})

useRequirePermission('catalog.manage')

const breadcrumbItems = settingsHubBreadcrumb('Precificação')
const { params, draftDefaults, pending, error, refresh } = usePricingParams()
const { savePricingParams } = usePricingMutations()

const draft = ref<PricingParamsDraft>(emptyPricingDraft())
const saving = ref(false)
const hydrated = ref(false)

watch(
  draftDefaults,
  (value) => {
    if (value) {
      draft.value = { ...value }
    } else {
      draft.value = emptyPricingDraft()
    }
    hydrated.value = true
  },
  { immediate: true }
)

useVoiceForm('pricing', {
  ops: ['edit'],
  apply: (voice) => {
    if (!params.value) {
      useToast().add({ title: 'Não foi possível carregar a precificação.', color: 'warning' })
      return
    }
    const next = { ...draft.value } as unknown as Record<string, unknown>
    applyVoiceFields(next, voice.fields, VOICE_CATALOG.pricing)
    draft.value = next as unknown as PricingParamsDraft
  },
  ready: () => !pending.value && (!!params.value || !!error.value)
})

async function onSave() {
  if (!isPricingDraftValid(draft.value) || saving.value) return
  saving.value = true
  try {
    await savePricingParams({ ...draft.value })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UDashboardPanel>
    <template #body>
      <div class="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
        <BasePageHeader
          title="Precificação"
          description="Parâmetros de mão de obra e peças para orçamentos, e taxas de cartão no pagamento."
        >
          <template #breadcrumb>
            <UBreadcrumb :items="breadcrumbItems" />
          </template>
          <template #actions>
            <UButton
              icon="i-lucide-refresh-cw"
              color="neutral"
              variant="ghost"
              class="ml-auto"
              aria-label="Atualizar parâmetros"
              :loading="pending"
              @click="refresh()"
            />
            <UButton
              icon="i-lucide-save"
              label="Salvar parâmetros"
              :loading="saving"
              :disabled="!hydrated || !isPricingDraftValid(draft)"
              class="hidden sm:inline-flex"
              @click="onSave"
            />
          </template>
        </BasePageHeader>

        <UAlert
          v-if="error"
          color="error"
          variant="subtle"
          title="Não foi possível carregar os parâmetros"
          :description="error.message"
        />

        <div
          v-else-if="pending && !hydrated"
          class="space-y-4"
        >
          <USkeleton class="h-48 w-full" />
          <USkeleton class="h-36 w-full" />
          <USkeleton class="h-40 w-full" />
        </div>

        <PricingForm
          v-else
          v-model="draft"
          :saving="saving"
          @save="onSave"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
