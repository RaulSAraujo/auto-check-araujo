<script setup lang="ts">
defineOptions({ name: 'OrdersPrintToolbar' })

defineProps<{
  backTo: string
  backLabel?: string
  whatsappUrl?: string | null
}>()
</script>

<template>
  <div class="print-toolbar no-print">
    <UButton
      :to="backTo"
      color="neutral"
      variant="ghost"
      icon="i-lucide-arrow-left"
      :label="backLabel || 'Voltar'"
    />

    <div class="flex flex-wrap gap-2">
      <UButton
        v-if="whatsappUrl"
        :href="whatsappUrl"
        target="_blank"
        rel="noopener noreferrer"
        label="WhatsApp"
        icon="i-simple-icons-whatsapp"
        color="success"
        variant="soft"
      />
      <UButton
        label="Imprimir / PDF"
        icon="i-lucide-printer"
        @click="printPage()"
      />
    </div>
  </div>
</template>
