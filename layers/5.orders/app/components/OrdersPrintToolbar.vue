<script setup lang="ts">
defineOptions({ name: 'OrdersPrintToolbar' })

defineProps<{
  backTo: string
  backLabel?: string
  whatsappUrl?: string | null
  showPdf?: boolean
  pdfLoading?: boolean
}>()

const emit = defineEmits<{
  downloadPdf: []
  printPdf: []
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
        v-if="showPdf"
        label="Baixar PDF"
        icon="i-lucide-file-down"
        color="neutral"
        variant="soft"
        :loading="pdfLoading"
        @click="emit('downloadPdf')"
      />
      <UButton
        label="Imprimir"
        icon="i-lucide-printer"
        @click="emit('printPdf')"
      />
    </div>
  </div>
</template>
