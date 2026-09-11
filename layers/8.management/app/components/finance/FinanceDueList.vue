<script setup lang="ts">
import type { FormaPagamento } from '~~/shared/types/oficina'
import { FORMA_PAGAMENTO_SELECT_ITEMS } from '~~/shared/types/oficina'
import type { FinanceAccountRow } from '../../utils/accounts-payable'
import {
  accountStatusColor,
  accountStatusLabel,
  displayAccountStatus,
  isAccountOverdue
} from '../../utils/accounts-payable'
import { formatMoney } from '~~/shared/utils/money'
import { EMPTY_VALUE } from '~~/shared/utils/empty'

defineOptions({ name: 'FinanceDueList' })

defineProps<{
  accounts: FinanceAccountRow[]
  loading?: boolean
  actingId?: string | null
}>()

const emit = defineEmits<{
  markPaid: [payload: { id: string, forma_pagamento: FormaPagamento }]
}>()

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
  <section aria-labelledby="finance-due-heading">
    <div class="mb-2 flex min-h-9 items-end justify-between gap-3">
      <h2
        id="finance-due-heading"
        class="text-sm font-semibold uppercase tracking-widest text-muted"
      >
        Vencimentos · 14 dias
      </h2>
      <p
        v-if="!loading && accounts.length"
        class="font-mono text-xs tabular-nums text-muted"
      >
        {{ accounts.length }}
      </p>
    </div>

    <div
      v-if="loading"
      class="space-y-0 overflow-hidden rounded-lg border border-default bg-default shadow-sm dark:border-accented dark:bg-elevated dark:shadow-none"
    >
      <div
        v-for="n in 3"
        :key="n"
        class="border-b border-default px-4 py-3 last:border-b-0"
      >
        <USkeleton class="h-10 w-full" />
      </div>
    </div>

    <div
      v-else-if="!accounts.length"
      class="rounded-lg border border-default bg-default px-4 py-8 shadow-sm dark:border-accented dark:bg-elevated dark:shadow-none"
    >
      <BaseEmptyState icon="i-lucide-calendar-check">
        Nenhum vencimento nos próximos 14 dias.
      </BaseEmptyState>
    </div>

    <ul
      v-else
      class="divide-y divide-default overflow-hidden rounded-lg border border-default bg-default shadow-sm dark:border-accented dark:bg-elevated dark:shadow-none"
    >
      <li
        v-for="account in accounts"
        :key="account.id"
        class="flex flex-col gap-2 px-4 py-3 transition-colors duration-200 ease-[var(--ease-out)] hover:bg-elevated/60 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="min-w-0 space-y-0.5">
          <div class="flex flex-wrap items-center gap-2">
            <p class="truncate font-medium text-highlighted">
              {{ account.descricao }}
            </p>
            <UBadge
              :color="accountStatusColor(displayAccountStatus(account))"
              variant="subtle"
              size="sm"
            >
              {{ accountStatusLabel(displayAccountStatus(account)) }}
            </UBadge>
          </div>
          <p class="text-xs text-muted">
            {{ account.financeiro_categorias?.nome || EMPTY_VALUE }}
            · vence
            <span class="font-mono tabular-nums">{{ formatDate(account.vencimento) }}</span>
            <span
              v-if="isAccountOverdue(account)"
              class="text-error"
            > · atrasado</span>
          </p>
        </div>

        <div class="flex shrink-0 flex-nowrap items-center gap-2 whitespace-nowrap">
          <p class="font-mono text-base font-semibold tabular-nums text-highlighted">
            {{ formatMoney(Number(account.valor)) }}
          </p>

          <template v-if="payingId === account.id">
            <USelect
              v-model="payForma"
              :items="[...FORMA_PAGAMENTO_SELECT_ITEMS]"
              size="sm"
              class="w-32 shrink-0"
            />
            <UButton
              label="Confirmar"
              size="sm"
              class="shrink-0 active:scale-[0.98]"
              :loading="actingId === account.id"
              @click="confirmPay(account.id)"
            />
            <UButton
              icon="i-lucide-x"
              size="sm"
              color="neutral"
              variant="ghost"
              class="shrink-0"
              aria-label="Cancelar pagamento"
              @click="cancelPay"
            />
          </template>
          <UButton
            v-else
            label="Pagar"
            size="sm"
            icon="i-lucide-check"
            class="shrink-0 active:scale-[0.98]"
            :loading="actingId === account.id"
            @click="startPay(account.id)"
          />
        </div>
      </li>
    </ul>
  </section>
</template>
