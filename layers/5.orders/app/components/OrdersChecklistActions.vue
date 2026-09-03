<script setup lang="ts">
import type { OrderDetail } from '../types/orders'

defineOptions({ name: 'OrdersChecklistActions' })

defineProps<{
  ordem: OrderDetail
}>()

const emit = defineEmits<{
  open: []
}>()
</script>

<template>
  <div aria-labelledby="os-checklist-heading">
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
        @click="emit('open')"
      />
    </div>
  </div>
</template>
