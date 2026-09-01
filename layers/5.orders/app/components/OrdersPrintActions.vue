<script setup lang="ts">
defineOptions({ name: 'OrdersPrintActions' })

const props = defineProps<{
  printTo: string
  whatsappUrl?: string | null
  printLabel?: string
}>()
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <UButton
      :to="printTo"
      target="_blank"
      :label="printLabel || 'Imprimir'"
      icon="i-lucide-printer"
      color="neutral"
      variant="soft"
      size="sm"
    />
    <UButton
      v-if="whatsappUrl"
      :href="whatsappUrl"
      target="_blank"
      rel="noopener noreferrer"
      label="WhatsApp"
      icon="i-simple-icons-whatsapp"
      color="success"
      variant="soft"
      size="sm"
    />
  </div>
</template>
