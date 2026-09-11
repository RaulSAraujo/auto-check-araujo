<script setup lang="ts">
import { ORDER_ROUTES } from '../utils/order-routes'
import {
  buildBudgetWhatsAppMessage,
  buildWhatsAppUrl
} from '../utils/print'
import { downloadBudgetPdf } from '../utils/pdf'
import { primaryPhone } from '~~/shared/utils/contact'
import type { OrcamentoStatus } from '~~/shared/types/oficina'

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

const whatsappUrl = computed(() => {
  if (!ordem.value) return null
  const telefone = primaryPhone(ordem.value.veiculos?.clientes?.telefones)
  return buildWhatsAppUrl(telefone, buildBudgetWhatsAppMessage(ordem.value.numero))
})

useHead({
  title: computed(() => ordem.value ? `Orçamento ${ordem.value.numero}` : 'Orçamento')
})

const downloadingPdf = ref(false)

async function onDownloadBudgetPdf() {
  if (!ordem.value || !import.meta.client) return
  downloadingPdf.value = true
  try {
    const veiculo = ordem.value.veiculos
    await downloadBudgetPdf({
      numero: ordem.value.numero,
      abertaEm: formatDateTime(ordem.value.aberta_em),
      budgetStatus: budgetStatus.value,
      clienteNome: veiculo?.clientes?.nome ?? null,
      placa: veiculo?.placa ?? null,
      veiculoLabel: [veiculo?.marca, veiculo?.modelo].filter(Boolean).join(' ') || null,
      kmEntrada: ordem.value.km_entrada,
      reclamacao: ordem.value.reclamacao,
      diagnostico: ordem.value.diagnostico,
      items: items.value || []
    })
  } finally {
    downloadingPdf.value = false
  }
}
</script>

<template>
  <div class="print-root">
    <OrdersPrintToolbar
      :back-to="ORDER_ROUTES.detail(id)"
      back-label="Voltar à OS"
      :whatsapp-url="whatsappUrl"
      show-pdf
      :pdf-loading="downloadingPdf"
      @download-pdf="onDownloadBudgetPdf"
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
