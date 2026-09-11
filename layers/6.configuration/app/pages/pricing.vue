<script setup lang="ts">
import {
  emptyPricingDraft,
  isPricingDraftValid,
  type PricingParamsDraft
} from '../utils/pricing'

defineOptions({ name: 'PricingIndexPage' })

definePageMeta({
  path: '/configuracao/precificacao'
})

useSeoMeta({
  title: 'Precificação',
  description: 'Configuração de parâmetros de mão de obra e peças.'
})

useRequirePermission('catalog.manage')

const { draftDefaults, pending, error, refresh } = await usePricingParams()
const { savePricingParams } = usePricingMutations()

const draft = ref<PricingParamsDraft>(emptyPricingDraft())
const saving = ref(false)
const hydrated = ref(false)

watch(
  draftDefaults,
  (value) => {
    draft.value = { ...value }
    hydrated.value = true
  },
  { immediate: true }
)

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
          description="Configure parâmetros de mão de obra e peças para orçamentos."
        >
          <template #title-trailing>
            <UBadge
              color="neutral"
              variant="subtle"
              size="sm"
            >
              Configuração
            </UBadge>
          </template>
          <template #actions>
            <UButton
              icon="i-lucide-refresh-cw"
              color="neutral"
              variant="ghost"
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
