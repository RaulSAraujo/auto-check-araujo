<script setup lang="ts">
import type { Cliente } from '~~/shared/types/database'
import { normalizeContactList } from '~~/shared/utils/contact'
import { formatDocumento, formatPhoneBr } from '../utils/customer-form'

defineOptions({ name: 'CustomersDetailSummary' })

const { cliente } = defineProps<{
  cliente: Cliente
}>()

const documento = computed(() => {
  if (!cliente.documento?.trim()) return null
  return formatDocumento(cliente.documento)
})

const phones = computed(() => {
  const list = normalizeContactList(cliente.telefones || [])
  return list.map((raw) => {
    const digits = raw.replace(/\D/g, '')
    return {
      label: formatPhoneBr(raw),
      href: digits ? `tel:${digits}` : null
    }
  })
})

const emails = computed(() => {
  const list = normalizeContactList(cliente.emails || [])
  return list.map(email => ({
    label: email,
    href: `mailto:${email}`
  }))
})

const hasNotes = computed(() => Boolean(cliente.observacoes?.trim()))
</script>

<template>
  <section
    class="customers-detail-summary scroll-mt-28 rounded-lg border border-default bg-default p-4 shadow-sm dark:shadow-none sm:p-5"
    aria-labelledby="customer-data-heading"
  >
    <h2
      id="customer-data-heading"
      class="text-sm font-semibold uppercase tracking-widest text-muted"
    >
      Dados do cliente
    </h2>

    <dl class="mt-4 divide-y divide-default">
      <div class="flex flex-col gap-1 py-3 first:pt-0 sm:flex-row sm:items-baseline sm:gap-6">
        <dt class="shrink-0 text-sm text-muted sm:w-28">
          Nome
        </dt>
        <dd class="min-w-0 text-sm font-medium text-highlighted break-words text-pretty">
          {{ cliente.nome }}
        </dd>
      </div>

      <div class="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:gap-6">
        <dt class="shrink-0 text-sm text-muted sm:w-28">
          Telefone
        </dt>
        <dd class="min-w-0 text-sm break-words">
          <template v-if="phones.length">
            <ul class="flex flex-col gap-1 sm:gap-0.5">
              <li
                v-for="(phone, index) in phones"
                :key="`phone-${index}`"
              >
                <a
                  v-if="phone.href"
                  :href="phone.href"
                  class="text-primary underline-offset-2 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {{ phone.label }}
                </a>
                <span
                  v-else
                  class="text-highlighted"
                >{{ phone.label }}</span>
              </li>
            </ul>
          </template>
          <span
            v-else
            class="text-muted"
          >Não informado</span>
        </dd>
      </div>

      <div class="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:gap-6">
        <dt class="shrink-0 text-sm text-muted sm:w-28">
          E-mail
        </dt>
        <dd class="min-w-0 text-sm break-words">
          <template v-if="emails.length">
            <ul class="flex flex-col gap-1 sm:gap-0.5">
              <li
                v-for="(email, index) in emails"
                :key="`email-${index}`"
              >
                <a
                  :href="email.href"
                  class="text-primary underline-offset-2 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {{ email.label }}
                </a>
              </li>
            </ul>
          </template>
          <span
            v-else
            class="text-muted"
          >Não informado</span>
        </dd>
      </div>

      <div class="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:gap-6">
        <dt class="shrink-0 text-sm text-muted sm:w-28">
          Documento
        </dt>
        <dd
          class="min-w-0 text-sm break-words"
          :class="documento
            ? 'font-mono tabular-nums text-highlighted'
            : 'text-muted'"
          translate="no"
        >
          {{ documento || 'Não informado' }}
        </dd>
      </div>

      <div
        v-if="hasNotes"
        class="flex flex-col gap-1 py-3 last:pb-0 sm:flex-row sm:items-baseline sm:gap-6"
      >
        <dt class="shrink-0 text-sm text-muted sm:w-28">
          Observações
        </dt>
        <dd class="min-w-0 text-sm text-pretty text-highlighted break-words whitespace-pre-wrap">
          {{ cliente.observacoes }}
        </dd>
      </div>
    </dl>
  </section>
</template>

<style scoped>
.customers-detail-summary {
  animation: customers-summary-rise 280ms var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1)) both;
}

@keyframes customers-summary-rise {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .customers-detail-summary {
    animation: none;
  }
}
</style>
