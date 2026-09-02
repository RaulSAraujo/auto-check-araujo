<script setup lang="ts">
import type { OrcamentoStatus } from '~~/shared/types/oficina'
import type { PublicBudget } from '../composables/usePublicBudget'
import { ORCAMENTO_STATUS_LABEL, ORDEM_ITEM_TIPO_LABEL } from '~~/shared/types/oficina'
import { calcItemSubtotal, formatMoney } from '../utils/budget'
import { WORKSHOP_NAME } from '../utils/print'

defineOptions({ name: 'OrdersPublicBudgetDocument' })

const props = defineProps<{
  budget: PublicBudget
}>()

const budgetStatus = computed(
  () => props.budget.orcamento_status as OrcamentoStatus
)

const total = computed(() => Number(props.budget.valor_total || 0))
</script>

<template>
  <article class="print-document">
    <header class="print-header">
      <div>
        <p class="print-title">
          {{ WORKSHOP_NAME }}
        </p>
        <p class="print-subtitle">
          Orçamento - {{ budget.numero }}
        </p>
      </div>
      <div class="text-right text-sm">
        <p>{{ formatDateTime(budget.aberta_em) }}</p>
        <p class="text-muted mt-1">
          {{ ORCAMENTO_STATUS_LABEL[budgetStatus] }}
        </p>
      </div>
    </header>

    <dl class="print-meta-grid">
      <div>
        <dt>Cliente</dt>
        <dd>{{ budget.cliente.nome }}</dd>
      </div>
      <div>
        <dt>Veículo</dt>
        <dd>{{ formatPlaca(budget.veiculo.placa) }}</dd>
      </div>
      <div>
        <dt>Modelo</dt>
        <dd>
          {{ [budget.veiculo.marca, budget.veiculo.modelo].filter(Boolean).join(' ') || '-' }}
        </dd>
      </div>
      <div>
        <dt>Km de entrada</dt>
        <dd>{{ budget.km_entrada?.toLocaleString('pt-BR') ?? '-' }}</dd>
      </div>
    </dl>

    <div v-if="budget.reclamacao">
      <p class="print-section-title">
        Reclamação
      </p>
      <p class="text-sm whitespace-pre-wrap">
        {{ budget.reclamacao }}
      </p>
    </div>

    <p class="print-section-title">
      Itens do orçamento
    </p>

    <table
      v-if="budget.itens.length > 0"
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
          v-for="item in budget.itens"
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
