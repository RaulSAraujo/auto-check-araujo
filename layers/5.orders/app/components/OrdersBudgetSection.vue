<script setup lang="ts">
import type { OrdemItem } from '~~/shared/types/database'
import type { OrcamentoStatus } from '~~/shared/types/oficina'
import { ORCAMENTO_STATUS_COLOR, ORCAMENTO_STATUS_LABEL, ORDEM_ITEM_TIPO_LABEL } from '~~/shared/types/oficina'
import { ORDEM_ITEM_TIPO_SELECT_ITEMS } from '../utils/budget-select-items'
import { calcItemSubtotal, formatMoney, isOrderItemDraftValid } from '../utils/budget'
import type { OrderItemDraft } from '../utils/budget'

defineOptions({ name: 'OrdersBudgetSection' })

defineProps<{
  items: OrdemItem[]
  budgetStatus: OrcamentoStatus
  canEditItems: boolean
  canApprove: boolean
  total: number
  selectedCatalogId: string | undefined
  catalogItems: { label: string, value: string }[]
  adding: boolean
  deletingId: string | null
  updatingStatus: boolean
}>()

const emit = defineEmits<{
  'update:selectedCatalogId': [value: string | undefined]
  'add': []
  'delete': [itemId: string]
  'submitForApproval': []
  'approve': []
  'reject': []
  'reopen': []
}>()

const draftModel = defineModel<OrderItemDraft>('draft', { required: true })
</script>

<template>
  <section class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-lg font-semibold text-highlighted">
        Orçamento
      </h2>
      <div class="flex flex-wrap items-center gap-2">
        <UBadge
          :color="ORCAMENTO_STATUS_COLOR[budgetStatus]"
          variant="subtle"
          size="lg"
        >
          {{ ORCAMENTO_STATUS_LABEL[budgetStatus] }}
        </UBadge>
      </div>
    </div>

    <div
      v-if="items.length === 0"
      class="rounded-lg border border-dashed border-default px-4 py-6 text-center text-sm text-muted"
    >
      Nenhum item no orçamento.
    </div>

    <div
      v-else
      class="overflow-x-auto rounded-lg border border-default"
    >
      <table class="w-full text-sm">
        <thead class="border-b border-default bg-elevated/50 text-left text-muted">
          <tr>
            <th class="px-3 py-2 font-medium">
              Tipo
            </th>
            <th class="px-3 py-2 font-medium">
              Descrição
            </th>
            <th class="px-3 py-2 font-medium text-right">
              Qtd
            </th>
            <th class="px-3 py-2 font-medium text-right">
              Valor unit.
            </th>
            <th class="px-3 py-2 font-medium text-right">
              Subtotal
            </th>
            <th
              v-if="canEditItems"
              class="px-3 py-2 w-10"
            />
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr
            v-for="item in items"
            :key="item.id"
          >
            <td class="px-3 py-2 text-muted whitespace-nowrap">
              {{ ORDEM_ITEM_TIPO_LABEL[item.tipo as keyof typeof ORDEM_ITEM_TIPO_LABEL] }}
            </td>
            <td class="px-3 py-2 text-highlighted">
              {{ item.descricao }}
            </td>
            <td class="px-3 py-2 text-right tabular-nums">
              {{ Number(item.quantidade).toLocaleString('pt-BR') }}
            </td>
            <td class="px-3 py-2 text-right tabular-nums">
              {{ formatMoney(Number(item.valor_unitario)) }}
            </td>
            <td class="px-3 py-2 text-right tabular-nums font-medium">
              {{ formatMoney(calcItemSubtotal(item)) }}
            </td>
            <td
              v-if="canEditItems"
              class="px-3 py-2"
            >
              <UButton
                icon="i-lucide-trash"
                color="error"
                variant="ghost"
                size="xs"
                :loading="deletingId === item.id"
                aria-label="Remover item"
                @click="emit('delete', item.id)"
              />
            </td>
          </tr>
        </tbody>
        <tfoot class="border-t border-default bg-elevated/30">
          <tr>
            <td
              colspan="4"
              class="px-3 py-2 text-right font-semibold text-highlighted"
            >
              Total
            </td>
            <td class="px-3 py-2 text-right font-semibold text-highlighted tabular-nums">
              {{ formatMoney(total) }}
            </td>
            <td v-if="canEditItems" />
          </tr>
        </tfoot>
      </table>
    </div>

    <div
      v-if="canEditItems"
      class="rounded-lg border border-default p-4 space-y-3"
    >
      <p class="text-sm font-medium text-highlighted">
        Adicionar item
      </p>

      <UFormField label="Do catálogo">
        <USelect
          :model-value="selectedCatalogId"
          :items="catalogItems"
          placeholder="Selecione ou preencha manualmente"
          class="w-full"
          @update:model-value="emit('update:selectedCatalogId', $event)"
        />
      </UFormField>

      <div class="grid gap-3 sm:grid-cols-2">
        <UFormField
          label="Tipo"
          name="tipo"
        >
          <USelect
            v-model="draftModel.tipo"
            :items="[...ORDEM_ITEM_TIPO_SELECT_ITEMS]"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Descrição"
          name="descricao"
          required
        >
          <UInput
            v-model="draftModel.descricao"
            class="w-full"
            placeholder="Ex.: Troca de óleo"
          />
        </UFormField>

        <UFormField
          label="Quantidade"
          name="quantidade"
        >
          <UInput
            v-model.number="draftModel.quantidade"
            type="number"
            class="w-full"
            min="0.01"
            step="0.01"
          />
        </UFormField>

        <UFormField
          label="Valor unitário (R$)"
          name="valor_unitario"
        >
          <UInput
            v-model.number="draftModel.valor_unitario"
            type="number"
            class="w-full"
            min="0"
            step="0.01"
          />
        </UFormField>
      </div>

      <UButton
        label="Adicionar item"
        icon="i-lucide-plus"
        :loading="adding"
        :disabled="!isOrderItemDraftValid(draftModel)"
        @click="emit('add')"
      />
    </div>

    <div class="flex flex-wrap gap-2">
      <UButton
        v-if="canEditItems && canApprove && budgetStatus !== 'aguardando_aprovacao'"
        label="Enviar para aprovação"
        icon="i-lucide-send"
        :loading="updatingStatus"
        :disabled="items.length === 0"
        @click="emit('submitForApproval')"
      />

      <template v-if="canApprove && budgetStatus === 'aguardando_aprovacao'">
        <UButton
          label="Aprovar"
          icon="i-lucide-check"
          color="success"
          :loading="updatingStatus"
          @click="emit('approve')"
        />
        <UButton
          label="Rejeitar"
          icon="i-lucide-x"
          color="error"
          variant="soft"
          :loading="updatingStatus"
          @click="emit('reject')"
        />
      </template>

      <UButton
        v-if="canApprove && budgetStatus === 'rejeitado'"
        label="Reabrir orçamento"
        icon="i-lucide-pencil"
        color="neutral"
        variant="soft"
        :loading="updatingStatus"
        @click="emit('reopen')"
      />
    </div>
  </section>
</template>
