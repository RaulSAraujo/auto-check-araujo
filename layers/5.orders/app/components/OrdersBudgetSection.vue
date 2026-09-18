<script setup lang="ts">
import type { OrdemItem } from '~~/shared/types/database'
import type { OrcamentoStatus } from '~~/shared/types/oficina'
import { ORCAMENTO_STATUS_COLOR, ORCAMENTO_STATUS_LABEL, ORDEM_ITEM_TIPO_LABEL } from '~~/shared/types/oficina'
import { ORDEM_ITEM_TIPO_SELECT_ITEMS } from '../utils/budget-select-items'
import { calcItemSubtotal, formatMoney, isOrderItemDraftValid } from '../utils/budget'
import type { OrderItemDraft } from '../utils/budget'
import { toSentenceCase } from '~~/shared/utils/text-case'

defineOptions({ name: 'OrdersBudgetSection' })

const props = defineProps<{
  items: OrdemItem[]
  budgetStatus: OrcamentoStatus
  canEditItems: boolean
  canApprove: boolean
  total: number
  selectedCatalogId: string | undefined
  catalogItems: { label: string, value: string }[]
  isSuggestedCatalogPrice: boolean
  adding: boolean
  deletingId: string | null
  updatingStatus: boolean
  printTo?: string
  whatsappUrl?: string | null
  pdfLoading?: boolean
}>()

const emit = defineEmits<{
  'update:selectedCatalogId': [value: string | undefined]
  'add': []
  'delete': [itemId: string]
  'submitForApproval': []
  'approve': []
  'reject': []
  'downloadPdf': []
  'printPdf': []
}>()

const draftModel = defineModel<OrderItemDraft>('draft', { required: true })

const showAddModal = ref(false)
const rejectConfirmOpen = ref(false)

const showShareMenu = computed(() => props.items.length > 0)

function onAddAndClose() {
  emit('add')
  showAddModal.value = false
}

function onConfirmReject() {
  rejectConfirmOpen.value = false
  emit('reject')
}
</script>

<template>
  <section class="flex min-w-0 flex-col gap-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex min-w-0 items-center gap-2.5">
        <h2 class="text-lg font-semibold text-highlighted">
          Orçamento
        </h2>
        <UBadge
          :color="ORCAMENTO_STATUS_COLOR[budgetStatus]"
          variant="subtle"
        >
          {{ ORCAMENTO_STATUS_LABEL[budgetStatus] }}
        </UBadge>
      </div>
      <OrdersPrintActions
        v-if="showShareMenu"
        :print-to="printTo"
        :whatsapp-url="whatsappUrl"
        print-label="Imprimir orçamento"
        show-pdf
        :pdf-loading="pdfLoading"
        @download-pdf="emit('downloadPdf')"
        @print-pdf="emit('printPdf')"
      />
    </div>

    <BaseEmptyState
      v-if="items.length === 0"
      icon="i-lucide-receipt"
      class="flex min-h-40 flex-1 flex-col items-center justify-center"
    >
      {{ canEditItems ? 'Nenhum item no orçamento.' : 'Nenhum item adicionado.' }}
      <template
        v-if="canEditItems"
        #actions
      >
        <UButton
          label="Adicionar item"
          icon="i-lucide-plus"
          size="sm"
          @click="showAddModal = true"
        />
      </template>
    </BaseEmptyState>

    <div
      v-if="items.length > 0"
      class="flex flex-col overflow-hidden rounded-lg bg-elevated/25 ring-1 ring-default/60"
    >
      <div class="divide-y divide-default/80">
        <div
          v-for="item in items"
          :key="item.id"
          class="flex items-center gap-3 px-3.5 py-3 transition-colors hover:bg-elevated/40"
        >
          <div class="min-w-0 flex-1">
            <div class="flex min-w-0 items-center gap-2">
              <p class="min-w-0 flex-1 truncate text-sm font-medium text-highlighted">
                {{ item.descricao }}
              </p>
              <UBadge
                color="neutral"
                variant="subtle"
                size="xs"
                class="shrink-0"
              >
                {{ ORDEM_ITEM_TIPO_LABEL[item.tipo as keyof typeof ORDEM_ITEM_TIPO_LABEL] }}
              </UBadge>
            </div>
            <p class="mt-0.5 font-mono text-xs tabular-nums text-muted">
              {{ new Intl.NumberFormat('pt-BR').format(Number(item.quantidade)) }}
              ×
              {{ formatMoney(Number(item.valor_unitario)) }}
            </p>
          </div>
          <p class="shrink-0 font-mono text-sm font-semibold tabular-nums text-highlighted">
            {{ formatMoney(calcItemSubtotal(item)) }}
          </p>
          <UButton
            v-if="canEditItems"
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            size="xs"
            :loading="deletingId === item.id"
            aria-label="Remover item"
            class="touch-manipulation"
            @click="emit('delete', item.id)"
          />
        </div>
      </div>

      <div class="flex items-baseline justify-between gap-3 border-t border-default bg-default/60 px-3.5 py-3">
        <p class="text-sm text-muted">
          Total
        </p>
        <p class="font-mono text-lg font-bold tabular-nums tracking-tight text-highlighted">
          {{ formatMoney(total) }}
        </p>
      </div>
    </div>

    <div
      v-if="items.length > 0"
      class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"
    >
      <UButton
        v-if="canEditItems"
        label="Adicionar item"
        icon="i-lucide-plus"
        size="sm"
        color="neutral"
        variant="soft"
        class="min-h-11 w-full justify-center touch-manipulation sm:min-h-0 sm:w-auto"
        @click="showAddModal = true"
      />

      <div class="hidden flex-1 sm:block" />

      <UButton
        v-if="canEditItems && canApprove && budgetStatus !== 'aguardando_aprovacao'"
        label="Enviar para aprovação"
        icon="i-lucide-send"
        size="sm"
        color="primary"
        :loading="updatingStatus"
        :disabled="items.length === 0"
        class="min-h-11 w-full justify-center touch-manipulation sm:min-h-0 sm:w-auto"
        @click="emit('submitForApproval')"
      />
      <template v-if="canApprove && budgetStatus === 'aguardando_aprovacao'">
        <UButton
          label="Aprovar"
          icon="i-lucide-check"
          color="success"
          size="sm"
          :loading="updatingStatus"
          class="min-h-11 w-full justify-center touch-manipulation sm:min-h-0 sm:w-auto"
          @click="emit('approve')"
        />
        <UButton
          label="Rejeitar"
          icon="i-lucide-x"
          color="error"
          variant="soft"
          size="sm"
          :loading="updatingStatus"
          class="min-h-11 w-full justify-center touch-manipulation sm:min-h-0 sm:w-auto"
          @click="rejectConfirmOpen = true"
        />
      </template>
    </div>

    <OrdersConfirmDialog
      v-model:open="rejectConfirmOpen"
      title="Rejeitar orçamento?"
      description="O orçamento fica rejeitado e volta para edição. Será preciso enviar e aprovar de novo."
      confirm-label="Rejeitar"
      confirm-color="error"
      :loading="updatingStatus"
      @confirm="onConfirmReject"
    />

    <UModal
      v-model:open="showAddModal"
      title="Adicionar item"
      :ui="{ content: 'sm:max-w-md' }"
    >
      <template #body>
        <div class="space-y-4 p-1">
          <UFormField
            v-if="catalogItems.length > 0"
            label="Preencher do catálogo"
            name="catalogo"
          >
            <USelect
              :model-value="selectedCatalogId"
              :items="catalogItems"
              placeholder="Buscar no catálogo…"
              class="w-full"
              searchable
              aria-label="Buscar item do catálogo"
              @update:model-value="emit('update:selectedCatalogId', $event)"
            />
          </UFormField>

          <div
            v-if="catalogItems.length > 0"
            class="relative"
          >
            <div class="absolute inset-x-0 top-1/2 border-t border-default" />
            <p class="relative mx-auto w-fit bg-default px-2 text-xs text-muted">
              ou preencha manualmente
            </p>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <UFormField
              label="Tipo"
              name="draft-tipo"
              class="col-span-2"
            >
              <USelect
                v-model="draftModel.tipo"
                :items="[...ORDEM_ITEM_TIPO_SELECT_ITEMS]"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Descrição"
              name="draft-descricao"
              required
              class="col-span-2"
            >
              <UInput
                v-model="draftModel.descricao"
                class="w-full"
                placeholder="Ex.: Troca de óleo…"
                name="descricao"
                autofocus
                @blur="draftModel.descricao = toSentenceCase(draftModel.descricao)"
              />
            </UFormField>

            <UFormField
              label="Quantidade"
              name="draft-quantidade"
            >
              <UInput
                v-model.number="draftModel.quantidade"
                type="number"
                inputmode="decimal"
                class="w-full font-mono tabular-nums"
                min="0.01"
                step="0.01"
                placeholder="1"
                name="quantidade"
              />
            </UFormField>

            <UFormField
              label="Valor unitário"
              name="draft-valor"
            >
              <div class="relative">
                <BaseCurrencyInput
                  v-model="draftModel.valor_unitario"
                  name="valor_unitario"
                  empty-as-zero
                />
                <UTooltip
                  v-if="isSuggestedCatalogPrice"
                  text="Preço sugerido pela precificação; você pode ajustar."
                >
                  <UIcon
                    name="i-lucide-wand-sparkles"
                    class="absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-info"
                    aria-label="Preço sugerido pela precificação; você pode ajustar"
                  />
                </UTooltip>
              </div>
            </UFormField>
          </div>

          <div
            v-if="isOrderItemDraftValid(draftModel)"
            class="rounded-lg bg-elevated/40 px-3 py-2 text-center"
          >
            <p class="text-xs text-muted">
              Subtotal
            </p>
            <p class="font-mono text-lg font-semibold tabular-nums text-highlighted">
              {{ formatMoney(draftModel.quantidade * draftModel.valor_unitario) }}
            </p>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <UButton
            label="Cancelar"
            color="neutral"
            variant="ghost"
            @click="showAddModal = false"
          />
          <UButton
            label="Adicionar"
            icon="i-lucide-plus"
            :loading="adding"
            :disabled="!isOrderItemDraftValid(draftModel)"
            @click="onAddAndClose"
          />
        </div>
      </template>
    </UModal>
  </section>
</template>
