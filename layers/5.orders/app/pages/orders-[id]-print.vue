<script setup lang="ts">
import type { OrcamentoStatus } from '~~/shared/types/oficina'
import { ORDER_ROUTES } from '../utils/order-routes'
import {
  absolutePrintUrl,
  buildBudgetWhatsAppMessage,
  buildWhatsAppUrl
} from '../utils/print'

defineOptions({ name: 'OrdersPrintPage' })

definePageMeta({
  path: '/ordens/:id/impressao',
  layout: false
})

const route = useRoute()
const id = computed(() => route.params.id as string)

const { data: ordem, pending } = await useOrderQuery(id)
const { data: items } = await useOrderItemsQuery(id)

const budgetStatus = computed(
  () => (ordem.value?.orcamento_status || 'rascunho') as OrcamentoStatus
)

const printPath = computed(() => ORDER_ROUTES.print(id.value))

const whatsappUrl = computed(() => {
  if (!ordem.value) return null
  const telefone = ordem.value.veiculos?.clientes?.telefone
  const message = buildBudgetWhatsAppMessage(
    ordem.value.numero,
    absolutePrintUrl(printPath.value)
  )
  return buildWhatsAppUrl(telefone, message)
})

useHead({
  title: computed(() => ordem.value ? `Orçamento ${ordem.value.numero}` : 'Orçamento')
})
</script>

<template>
  <div class="print-root">
    <OrdersPrintToolbar
      :back-to="ORDER_ROUTES.detail(id)"
      back-label="Voltar à OS"
      :whatsapp-url="whatsappUrl"
    />

    <div
      v-if="pending && !ordem"
      class="p-6"
    >
      <USkeleton class="h-64 w-full max-w-2xl mx-auto" />
    </div>

    <OrdersBudgetPrintDocument
      v-else-if="ordem"
      :ordem="ordem"
      :items="items || []"
      :budget-status="budgetStatus"
    />
  </div>
</template>

<style src="../assets/css/print.css"></style>
