<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

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

const moreItems = computed<DropdownMenuItem[][]>(() => {
  const items: DropdownMenuItem[] = []

  if (props.printTo) {
    items.push({
      label: props.printLabel || 'Imprimir',
      icon: 'i-lucide-printer',
      to: props.printTo,
      target: '_blank'
    })
  }

  if (props.showPdf) {
    items.push({
      label: props.pdfLoading ? 'Baixando…' : (props.pdfLabel || 'Baixar PDF'),
      icon: 'i-lucide-file-down',
      disabled: props.pdfLoading,
      onSelect: () => { emit('downloadPdf') }
    })
  }

  if (props.publicUrl) {
    items.push({
      label: copying.value ? 'Copiando…' : 'Copiar link',
      icon: 'i-lucide-link',
      disabled: copying.value,
      onSelect: () => { void copyPublicLink() }
    })
  }

  if (props.whatsappUrl) {
    items.push({
      label: 'WhatsApp',
      icon: 'i-simple-icons-whatsapp',
      to: props.whatsappUrl,
      target: '_blank'
    })
  }

  return items.length ? [items] : []
})

const hasActions = computed(() => moreItems.value[0]?.length)
</script>

<template>
  <UDropdownMenu
    v-if="hasActions"
    :items="moreItems"
    :content="{ align: 'end' }"
  >
    <UButton
      icon="i-lucide-ellipsis"
      color="neutral"
      variant="ghost"
      size="sm"
      aria-label="Mais ações do orçamento"
      class="min-h-9 min-w-9 touch-manipulation"
    />
  </UDropdownMenu>
</template>
