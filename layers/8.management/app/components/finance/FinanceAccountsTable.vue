<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { FormaPagamento } from '~~/shared/types/oficina'
import { FORMA_PAGAMENTO_LABEL, FORMA_PAGAMENTO_SELECT_ITEMS } from '~~/shared/types/oficina'
import type { FinanceAccountRow } from '../../utils/accounts-payable'
import {
  accountStatusColor,
  accountStatusLabel,
  displayAccountStatus
} from '../../utils/accounts-payable'
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
  create: []
}>()

const columns: TableColumn<FinanceAccountRow>[] = [
  { accessorKey: 'descricao', header: 'Descrição' },
  { id: 'vencimento', header: 'Venc.' },
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

function metaLine(account: FinanceAccountRow) {
  const parts = [
    account.financeiro_categorias?.nome,
    account.fornecedores?.nome
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : EMPTY_VALUE
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
  <div class="min-w-0">
    <UTable
      :data="accounts"
      :columns="columns"
      :loading="loading"
      class="w-full min-w-0"
    >
      <template #descricao-cell="{ row }">
        <div class="min-w-0">
          <p class="truncate font-medium text-highlighted">
            {{ row.original.descricao }}
          </p>
          <p class="truncate text-xs text-muted">
            {{ metaLine(row.original) }}
          </p>
        </div>
      </template>

      <template #vencimento-cell="{ row }">
        <span class="whitespace-nowrap font-mono text-xs tabular-nums">
          {{ formatDate(row.original.vencimento) }}
        </span>
      </template>

      <template #valor-cell="{ row }">
        <span class="whitespace-nowrap font-mono text-xs tabular-nums">
          {{ formatMoney(Number(row.original.valor)) }}
        </span>
      </template>

      <template #status-cell="{ row }">
        <div class="min-w-0">
          <UBadge
            :color="accountStatusColor(displayAccountStatus(row.original))"
            variant="subtle"
            size="sm"
          >
            {{ accountStatusLabel(displayAccountStatus(row.original)) }}
          </UBadge>
          <p
            v-if="row.original.status === 'pago' && row.original.forma_pagamento"
            class="mt-0.5 truncate text-xs text-muted"
          >
            {{ FORMA_PAGAMENTO_LABEL[row.original.forma_pagamento as FormaPagamento] || row.original.forma_pagamento }}
          </p>
        </div>
      </template>

      <template #actions-cell="{ row }">
        <div class="flex items-center justify-end gap-0.5">
          <template v-if="payingId === row.original.id">
            <USelect
              v-model="payForma"
              :items="[...FORMA_PAGAMENTO_SELECT_ITEMS]"
              size="xs"
              class="w-24"
            />
            <UButton
              icon="i-lucide-check"
              size="xs"
              square
              aria-label="Confirmar pagamento"
              :loading="actingId === row.original.id"
              @click="confirmPay(row.original.id)"
            />
            <UButton
              icon="i-lucide-x"
              size="xs"
              color="neutral"
              variant="ghost"
              square
              aria-label="Cancelar pagamento"
              @click="cancelPay"
            />
          </template>
          <template v-else-if="row.original.status === 'a_pagar'">
            <UButton
              label="Pagar"
              size="xs"
              icon="i-lucide-check"
              class="active:scale-[0.98]"
              :loading="actingId === row.original.id"
              @click="startPay(row.original.id)"
            />
            <UButton
              icon="i-lucide-ban"
              size="xs"
              color="neutral"
              variant="ghost"
              square
              aria-label="Cancelar conta"
              :loading="actingId === row.original.id"
              @click="emit('cancel', row.original.id)"
            />
          </template>
          <template v-else-if="row.original.status === 'pago' || row.original.status === 'cancelado'">
            <UButton
              icon="i-lucide-rotate-ccw"
              size="xs"
              color="neutral"
              variant="ghost"
              square
              aria-label="Reabrir conta"
              :loading="actingId === row.original.id"
              @click="emit('reopen', row.original.id)"
            />
            <UButton
              icon="i-lucide-trash-2"
              size="xs"
              color="error"
              variant="ghost"
              square
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
          <template #actions>
            <UButton
              label="Nova conta"
              icon="i-lucide-plus"
              @click="emit('create')"
            />
          </template>
        </BaseEmptyState>
      </template>
    </UTable>
  </div>
</template>
