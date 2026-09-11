<script setup lang="ts">
import type { OrdemItem } from '~~/shared/types/database'
import type { OrderDetail } from '../types/orders'
import type { OrcamentoStatus } from '~~/shared/types/oficina'
import { ORCAMENTO_STATUS_LABEL, ORDEM_ITEM_TIPO_LABEL } from '~~/shared/types/oficina'
import { calcItemSubtotal, calcItemsTotal, formatMoney } from '../utils/budget'
import { WORKSHOP_NAME } from '../utils/print'

defineOptions({ name: 'OrdersBudgetPrintDocument' })

const props = defineProps<{
  ordem: OrderDetail
  items: OrdemItem[]
  budgetStatus: OrcamentoStatus
}>()

const total = computed(() => calcItemsTotal(props.items))
</script>

<template>
  <article class="print-document">
    <header class="print-header">
      <div>
        <p class="print-title">
          {{ WORKSHOP_NAME }}
        </p>
        <p class="print-subtitle">
          Orçamento - {{ ordem.numero }}
        </p>
      </div>
      <div class="text-right text-sm">
        <p>{{ formatDateTime(ordem.aberta_em) }}</p>
        <p class="text-muted mt-1">
          {{ ORCAMENTO_STATUS_LABEL[budgetStatus] }}
        </p>
      </div>
    </header>

    <dl class="print-meta-grid">
      <div>
        <dt>Cliente</dt>
        <dd>{{ ordem.veiculos?.clientes?.nome || '-' }}</dd>
      </div>
      <div>
        <dt>Veículo</dt>
        <dd>
          <span v-if="ordem.veiculos">{{ formatPlaca(ordem.veiculos.placa) }}</span>
          <span v-else>-</span>
        </dd>
      </div>
      <div>
        <dt>Modelo</dt>
        <dd>
          {{ [ordem.veiculos?.marca, ordem.veiculos?.modelo].filter(Boolean).join(' ') || '-' }}
        </dd>
      </div>
      <div>
        <dt>Km de entrada</dt>
        <dd>{{ ordem.km_entrada?.toLocaleString('pt-BR') ?? '-' }}</dd>
      </div>
    </dl>

    <div v-if="ordem.reclamacao">
      <p class="print-section-title">
        Reclamação
      </p>
      <p class="text-sm whitespace-pre-wrap">
        {{ ordem.reclamacao }}
      </p>
    </div>

    <div v-if="ordem.diagnostico">
      <p class="print-section-title">
        Diagnóstico
      </p>
      <p class="text-sm whitespace-pre-wrap">
        {{ ordem.diagnostico }}
      </p>
    </div>

    <p class="print-section-title">
      Itens do orçamento
    </p>

    <table
      v-if="items.length > 0"
      class="print-table"
    >
      <thead>
        <tr>
          <th>Tipo</th>
          <th>Descrição</th>
          <th class="num">
            Qtd
          </th>
          <th class="num">
            Valor unit.
          </th>
          <th class="num">
            Subtotal
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in items"
          :key="item.id"
        >
          <td>{{ ORDEM_ITEM_TIPO_LABEL[item.tipo as keyof typeof ORDEM_ITEM_TIPO_LABEL] }}</td>
          <td>{{ item.descricao }}</td>
          <td class="num">
            {{ Number(item.quantidade).toLocaleString('pt-BR') }}
          </td>
          <td class="num">
            {{ formatMoney(Number(item.valor_unitario)) }}
          </td>
          <td class="num">
            {{ formatMoney(calcItemSubtotal(item)) }}
          </td>
        </tr>
        <tr class="print-total-row">
          <td
            colspan="4"
            class="num"
          >
            Total
          </td>
          <td class="num">
            {{ formatMoney(total) }}
          </td>
        </tr>
      </tbody>
    </table>

    <p
      v-else
      class="text-sm text-muted"
    >
      Nenhum item no orçamento.
    </p>

    <footer class="print-signature">
      <p class="text-sm text-muted">
        Valores sujeitos a alteração após diagnóstico. Validade do orçamento: 7 dias.
      </p>
      <div class="print-signature-line">
        Assinatura do cliente
      </div>
    </footer>
  </article>
</template>
