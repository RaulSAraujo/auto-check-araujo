<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { FormaPagamento } from '~~/shared/types/oficina'
import { FORMA_PAGAMENTO_LABEL, FORMA_PAGAMENTO_SELECT_ITEMS } from '~~/shared/types/oficina'
import type { FinanceAccountRow } from '../utils/accounts-payable'
import {
  accountStatusColor,
  accountStatusLabel,
  displayAccountStatus
} from '../utils/accounts-payable'
import { formatMoney } from '~~/shared/utils/money'
import { EMPTY_VALUE } from '~~/shared/utils/empty'

defineOptions({ name: 'FinanceAccountsTable' })

defineProps<{
  accounts: FinanceAccountRow[]
  loading?: boolean
  actingId?: string | null
}>()

const emit = defineEmits<{
  markPaid: [payload: { id: string, forma_pagamento: FormaPagamento }]
  cancel: [id: string]
  reopen: [id: string]
  remove: [id: string]
}>()

const columns: TableColumn<FinanceAccountRow>[] = [
  { accessorKey: 'descricao', header: 'Descrição' },
  { id: 'categoria', header: 'Categoria' },
  { id: 'vencimento', header: 'Vencimento' },
  { id: 'valor', header: 'Valor' },
  { id: 'status', header: 'Status' },
  { id: 'actions', header: '' }
]

const payingId = ref<string | null>(null)
const payForma = ref<FormaPagamento>('pix')

function formatDate(value: string) {
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

function startPay(id: string) {
  payingId.value = id
  payForma.value = 'pix'
}

function confirmPay(id: string) {
  emit('markPaid', { id, forma_pagamento: payForma.value })
  payingId.value = null
}

function cancelPay() {
  payingId.value = null
}
</script>

<template>
  <UTable
    :data="accounts"
    :columns="columns"
    :loading="loading"
    class="w-full"
  >
    <template #descricao-cell="{ row }">
      <div class="space-y-0.5">
        <p class="font-medium text-highlighted">
          {{ row.original.descricao }}
        </p>
        <p
          v-if="row.original.fornecedores?.nome"
          class="text-xs text-muted"
        >
          {{ row.original.fornecedores.nome }}
        </p>
      </div>
    </template>

    <template #categoria-cell="{ row }">
      {{ row.original.financeiro_categorias?.nome || EMPTY_VALUE }}
    </template>

    <template #vencimento-cell="{ row }">
      <span class="font-mono tabular-nums">
        {{ formatDate(row.original.vencimento) }}
      </span>
    </template>

    <template #valor-cell="{ row }">
      <span class="font-mono tabular-nums">
        {{ formatMoney(Number(row.original.valor)) }}
      </span>
    </template>

    <template #status-cell="{ row }">
      <div class="space-y-1">
        <UBadge
          :color="accountStatusColor(displayAccountStatus(row.original))"
          variant="subtle"
          size="sm"
        >
          {{ accountStatusLabel(displayAccountStatus(row.original)) }}
        </UBadge>
        <p
          v-if="row.original.status === 'pago' && row.original.forma_pagamento"
          class="text-xs text-muted"
        >
          {{ FORMA_PAGAMENTO_LABEL[row.original.forma_pagamento as FormaPagamento] || row.original.forma_pagamento }}
        </p>
      </div>
    </template>

    <template #actions-cell="{ row }">
      <div class="flex flex-wrap items-center justify-end gap-1">
        <template v-if="payingId === row.original.id">
          <USelect
            v-model="payForma"
            :items="[...FORMA_PAGAMENTO_SELECT_ITEMS]"
            size="sm"
            class="w-36"
          />
          <UButton
            label="Confirmar"
            size="sm"
            :loading="actingId === row.original.id"
            @click="confirmPay(row.original.id)"
          />
          <UButton
            label="Cancelar"
            size="sm"
            color="neutral"
            variant="ghost"
            @click="cancelPay"
          />
        </template>
        <template v-else-if="row.original.status === 'a_pagar'">
          <UButton
            label="Pagar"
            size="sm"
            icon="i-lucide-check"
            :loading="actingId === row.original.id"
            @click="startPay(row.original.id)"
          />
          <UButton
            label="Cancelar"
            size="sm"
            color="neutral"
            variant="ghost"
            :loading="actingId === row.original.id"
            @click="emit('cancel', row.original.id)"
          />
        </template>
        <template v-else-if="row.original.status === 'pago' || row.original.status === 'cancelado'">
          <UButton
            label="Reabrir"
            size="sm"
            color="neutral"
            variant="ghost"
            :loading="actingId === row.original.id"
            @click="emit('reopen', row.original.id)"
          />
          <UButton
            icon="i-lucide-trash-2"
            size="sm"
            color="error"
            variant="ghost"
            aria-label="Excluir conta"
            :loading="actingId === row.original.id"
            @click="emit('remove', row.original.id)"
          />
        </template>
      </div>
    </template>

    <template #empty>
      <BaseEmptyState icon="i-lucide-receipt">
        Nenhuma conta neste filtro.
      </BaseEmptyState>
    </template>
  </UTable>
</template>
