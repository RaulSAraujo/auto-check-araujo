<script setup lang="ts">
defineOptions({ name: 'OrdersPrintActions' })

const props = defineProps<{
  printTo?: string
  publicUrl?: string | null
  whatsappUrl?: string | null
  printLabel?: string
  pdfLabel?: string
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
  <div class="flex flex-wrap gap-2">
    <UButton
      v-if="printTo"
      :to="printTo"
      target="_blank"
      :label="printLabel || 'Imprimir'"
      icon="i-lucide-printer"
      color="neutral"
      variant="soft"
      size="sm"
    />
    <UButton
      v-if="showPdf"
      :label="pdfLabel || 'Baixar PDF'"
      icon="i-lucide-file-down"
      color="neutral"
      variant="soft"
      size="sm"
      :loading="pdfLoading"
      @click="emit('downloadPdf')"
    />
    <UButton
      v-if="publicUrl"
      label="Copiar link"
      icon="i-lucide-link"
      color="neutral"
      variant="soft"
      size="sm"
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
      size="sm"
    />
  </div>
</template>
