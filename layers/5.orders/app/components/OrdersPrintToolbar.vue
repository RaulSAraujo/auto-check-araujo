<script setup lang="ts">
defineOptions({ name: 'OrdersPrintToolbar' })

const props = defineProps<{
  backTo: string
  backLabel?: string
  publicUrl?: string | null
  whatsappUrl?: string | null
  showPdf?: boolean
  pdfLoading?: boolean
}>()

const emit = defineEmits<{
  downloadPdf: []
}>()

const toast = useToast()
const copying = ref(false)

async function copyPublicLink() {
  if (!props.publicUrl || !import.meta.client) return
  copying.value = true
  try {
    await navigator.clipboard.writeText(props.publicUrl)
    toast.add({ title: 'Link copiado', color: 'success' })
  } catch {
    toast.add({ title: 'Não foi possível copiar o link', color: 'error' })
  } finally {
    copying.value = false
  }
}
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
        v-if="publicUrl"
        label="Copiar link"
        icon="i-lucide-link"
        color="neutral"
        variant="soft"
        :loading="copying"
        @click="copyPublicLink"
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
        @click="printPage()"
      />
    </div>
  </div>
</template>
