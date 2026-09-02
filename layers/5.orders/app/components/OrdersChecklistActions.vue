<script setup lang="ts">
import type { OrderDetail } from '../types/orders'
import { ORDER_ROUTES } from '../utils/order-routes'

defineProps<{
  ordem: OrderDetail
  ordemId: string
  startingChecklist: boolean
}>()

const emit = defineEmits<{
  startChecklist: []
}>()
</script>

<template>
  <section class="space-y-3">
    <h2 class="text-lg font-semibold text-highlighted">
      Checklist
    </h2>
    <div class="flex flex-wrap gap-2">
      <UButton
        v-if="ordem.checklists"
        :to="ORDER_ROUTES.checklist(ordemId)"
        :label="ordem.checklists.status === 'concluida' ? 'Ver checklist' : 'Continuar checklist'"
        icon="i-lucide-clipboard-check"
      />
      <UButton
        v-else
        label="Iniciar checklist"
        icon="i-lucide-clipboard-list"
        :loading="startingChecklist"
        @click="emit('startChecklist')"
      />
      <UBadge
        v-if="ordem.checklists"
        :color="ordem.checklists.status === 'concluida' ? 'success' : 'warning'"
        variant="subtle"
      >
        {{ ordem.checklists.status === 'concluida' ? 'Checklist concluída' : 'Em preenchimento' }}
      </UBadge>
    </div>
  </section>
</template>
