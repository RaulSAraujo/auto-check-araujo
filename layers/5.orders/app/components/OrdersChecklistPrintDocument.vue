<script setup lang="ts">
import type { ChecklistItem } from '~~/shared/types/database'
import type { ChecklistWithItems } from '../types/orders'
import type { OrderDetail } from '../types/orders'
import type { ChecklistResultado } from '~~/shared/types/oficina'
import { CHECKLIST_RESULTADO_LABEL } from '~~/shared/types/oficina'
import type { ChecklistPrintPhoto } from '../composables/useChecklistPrintQuery'
import { WORKSHOP_NAME } from '../utils/print'

defineOptions({ name: 'OrdersChecklistPrintDocument' })

defineProps<{
  ordem: OrderDetail
  checklist: ChecklistWithItems
  itensByCategoria: [string, ChecklistItem[]][]
  photosByItemId: Record<string, ChecklistPrintPhoto[]>
}>()

function resultadoLabel(resultado: string | null): string {
  if (!resultado) return 'Pendente'
  return CHECKLIST_RESULTADO_LABEL[resultado as ChecklistResultado] || resultado
}
</script>

<template>
  <article class="print-document">
    <header class="print-header">
      <div>
        <p class="print-title">
          {{ WORKSHOP_NAME }}
        </p>
        <p class="print-subtitle">
          Checklist de inspeção — {{ ordem.numero }}
        </p>
      </div>
      <div class="text-right text-sm">
        <p>{{ formatDateTime(checklist.created_at) }}</p>
        <p class="text-muted mt-1">
          {{ checklist.status === 'concluida' ? 'Concluída' : 'Em preenchimento' }}
        </p>
      </div>
    </header>

    <dl class="print-meta-grid">
      <div>
        <dt>Cliente</dt>
        <dd>{{ ordem.veiculos?.clientes?.nome || '—' }}</dd>
      </div>
      <div>
        <dt>Veículo</dt>
        <dd>
          <span v-if="ordem.veiculos">{{ formatPlaca(ordem.veiculos.placa) }}</span>
          <span v-else>—</span>
        </dd>
      </div>
      <div>
        <dt>Modelo</dt>
        <dd>
          {{ [ordem.veiculos?.marca, ordem.veiculos?.modelo].filter(Boolean).join(' ') || '—' }}
        </dd>
      </div>
      <div>
        <dt>Km de entrada</dt>
        <dd>{{ ordem.km_entrada?.toLocaleString('pt-BR') ?? '—' }}</dd>
      </div>
    </dl>

    <section
      v-for="[categoria, itens] in itensByCategoria"
      :key="categoria"
      class="print-checklist-category"
    >
      <h2 class="print-section-title">
        {{ categoria }}
      </h2>

      <div
        v-for="item in itens"
        :key="item.id"
        class="print-checklist-item"
      >
        <div>
          <p class="font-medium">
            {{ item.label }}
          </p>
          <p
            v-if="item.observacao"
            class="text-sm text-muted mt-0.5 whitespace-pre-wrap"
          >
            {{ item.observacao }}
          </p>
        </div>
        <p class="font-semibold text-sm shrink-0">
          {{ resultadoLabel(item.resultado) }}
        </p>

        <div
          v-if="photosByItemId[item.id]?.length"
          class="print-checklist-photos"
        >
          <img
            v-for="(photo, index) in photosByItemId[item.id]"
            :key="index"
            :src="photo.url"
            :alt="photo.nome_arquivo || 'Foto do item'"
          >
        </div>
      </div>
    </section>

    <footer class="print-signature">
      <div class="print-signature-line">
        Assinatura do cliente — ciência das condições registradas na entrada
      </div>
    </footer>
  </article>
</template>
