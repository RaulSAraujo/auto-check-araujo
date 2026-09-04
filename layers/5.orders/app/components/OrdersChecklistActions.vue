<script setup lang="ts">
import type { OrderDetail } from '../types/orders'
import { countFilledChecklistItens } from '../utils/checklist'

defineOptions({ name: 'OrdersChecklistActions' })

const props = defineProps<{
  ordem: OrderDetail
}>()

defineEmits<{
  open: []
}>()

const checklistItens = computed(() => props.ordem.checklists?.checklist_itens ?? [])
const totalCount = computed(() => checklistItens.value.length)
const filledCount = computed(() => countFilledChecklistItens(checklistItens.value))
const pendingCount = computed(() => Math.max(0, totalCount.value - filledCount.value))
const progress = computed(() =>
  totalCount.value ? Math.round((filledCount.value / totalCount.value) * 100) : 0
)
const showProgress = computed(() => Boolean(props.ordem.checklists) && totalCount.value > 0)
</script>

<template>
  <div
    class="space-y-3"
    aria-labelledby="os-checklist-heading"
  >
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2.5">
        <h2
          id="os-checklist-heading"
          class="text-lg font-semibold text-highlighted"
        >
          Checklist
        </h2>
        <UBadge
          v-if="ordem.checklists"
          :color="ordem.checklists.status === 'concluida' ? 'success' : 'warning'"
          variant="subtle"
        >
          {{ ordem.checklists.status === 'concluida' ? 'Concluída' : 'Em preenchimento' }}
        </UBadge>
      </div>

      <UButton
        :label="!ordem.checklists
          ? 'Iniciar checklist'
          : ordem.checklists.status === 'concluida'
            ? 'Ver checklist'
            : 'Continuar checklist'"
        :icon="ordem.checklists ? 'i-lucide-clipboard-check' : 'i-lucide-clipboard-list'"
        size="sm"
        color="neutral"
        variant="soft"
        class="touch-manipulation active:scale-[0.98]"
        @click="$emit('open')"
      />
    </div>

    <div
      v-if="showProgress"
      class="space-y-1.5"
    >
      <div class="flex items-center justify-between gap-2">
        <p class="font-mono text-sm tabular-nums text-muted">
          {{ filledCount }}/{{ totalCount }}
          <span
            v-if="pendingCount > 0 && ordem.checklists?.status !== 'concluida'"
            class="text-warning"
          >
            · {{ pendingCount }} pendente{{ pendingCount === 1 ? '' : 's' }}
          </span>
        </p>
        <p class="text-xs tabular-nums text-muted">
          {{ progress }}%
        </p>
      </div>
      <UProgress
        :model-value="progress"
        size="sm"
        class="w-full"
      />
      <p
        class="sr-only"
        aria-live="polite"
      >
        {{ filledCount }} de {{ totalCount }} itens preenchidos
      </p>
    </div>
  </div>
</template>
