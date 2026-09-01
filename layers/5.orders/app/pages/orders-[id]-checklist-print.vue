<script setup lang="ts">
import { ORDER_ROUTES } from '../utils/order-routes'
import {
  absolutePrintUrl,
  buildChecklistWhatsAppMessage,
  buildWhatsAppUrl
} from '../utils/print'

defineOptions({ name: 'OrdersChecklistPrintPage' })

definePageMeta({
  path: '/ordens/:id/checklist/impressao',
  layout: false
})

const route = useRoute()
const id = computed(() => route.params.id as string)

const { data, pending } = await useChecklistPrintQuery(id)

const printPath = computed(() => ORDER_ROUTES.checklistPrint(id.value))

const whatsappUrl = computed(() => {
  if (!data.value?.ordem) return null
  const telefone = data.value.ordem.veiculos?.clientes?.telefone
  const message = buildChecklistWhatsAppMessage(
    data.value.ordem.numero,
    absolutePrintUrl(printPath.value)
  )
  return buildWhatsAppUrl(telefone, message)
})

useHead({
  title: computed(() => data.value?.ordem ? `Checklist ${data.value.ordem.numero}` : 'Checklist')
})
</script>

<template>
  <div class="print-root">
    <OrdersPrintToolbar
      :back-to="ORDER_ROUTES.checklist(id)"
      back-label="Voltar ao checklist"
      :whatsapp-url="whatsappUrl"
    />

    <div
      v-if="pending && !data"
      class="p-6"
    >
      <USkeleton class="h-64 w-full max-w-2xl mx-auto" />
    </div>

    <div
      v-else-if="data && !data.checklist"
      class="print-document text-center text-muted"
    >
      Checklist ainda não iniciado para esta OS.
    </div>

    <OrdersChecklistPrintDocument
      v-else-if="data?.ordem && data.checklist"
      :ordem="data.ordem"
      :checklist="data.checklist"
      :itens-by-categoria="data.itensByCategoria"
      :photos-by-item-id="data.photosByItemId"
    />
  </div>
</template>

<style src="../assets/css/print.css"></style>
