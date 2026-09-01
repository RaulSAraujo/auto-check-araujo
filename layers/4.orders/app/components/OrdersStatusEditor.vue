<script setup lang="ts">
import type { OrderDetail } from '../types/orders'

defineProps<{
  ordem: OrderDetail
  selectedStatus: string
  statusItems: readonly { label: string, value: string }[]
  savingStatus: boolean
}>()

const emit = defineEmits<{
  'update:selectedStatus': [value: string]
  'save': []
}>()
</script>

<template>
  <section class="space-y-3">
    <h2 class="text-lg font-semibold text-highlighted">
      Status
    </h2>
    <div class="flex flex-col sm:flex-row gap-3 items-start">
      <USelect
        :model-value="selectedStatus"
        :items="[...statusItems]"
        class="sm:w-56"
        :disabled="savingStatus"
        @update:model-value="emit('update:selectedStatus', $event)"
      />
      <UButton
        label="Salvar status"
        :loading="savingStatus"
        :disabled="selectedStatus === ordem.status"
        @click="emit('save')"
      />
    </div>
  </section>
</template>
