<script setup lang="ts">
defineOptions({ name: 'HomeOperationalSummary' })

defineProps<{
  pending: boolean
  osAbertas: number
  osAndamento: number
  clientesCount: number
  veiculosCount: number
  showFinance: boolean
  pendingFinance: boolean
  totalFaturado: number
  totalPago: number
  totalPendente: number
}>()
</script>

<template>
  <div class="mx-auto w-full max-w-5xl space-y-6">
    <section aria-labelledby="home-orders-heading">
      <div class="flex items-center justify-between gap-3">
        <h2
          id="home-orders-heading"
          class="text-xs font-semibold uppercase tracking-wide text-muted"
        >
          Ordens de serviço
        </h2>
        <UButton
          to="/ordens"
          label="Ver todas"
          variant="link"
          size="sm"
          trailing-icon="i-lucide-arrow-right"
        />
      </div>

      <div
        class="mt-3 overflow-hidden rounded-md border border-default bg-default divide-y divide-default shadow-sm"
      >
        <NuxtLink
          to="/ordens?status=aberta"
          class="flex min-h-14 items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-elevated/60"
        >
          <div>
            <p class="text-sm text-muted">
              Abertas
            </p>
            <p class="mt-0.5 text-3xl font-semibold font-mono tabular-nums tracking-tight text-highlighted">
              <USkeleton
                v-if="pending"
                class="h-9 w-12"
              />
              <span v-else>{{ osAbertas }}</span>
            </p>
          </div>
          <UIcon
            name="i-lucide-chevron-right"
            class="size-5 shrink-0 text-muted"
            aria-hidden="true"
          />
        </NuxtLink>

        <NuxtLink
          to="/ordens?status=em_andamento"
          class="flex min-h-14 items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-elevated/60"
        >
          <div>
            <p class="text-sm text-muted">
              Em andamento
            </p>
            <p class="mt-0.5 text-3xl font-semibold font-mono tabular-nums tracking-tight text-highlighted">
              <USkeleton
                v-if="pending"
                class="h-9 w-12"
              />
              <span v-else>{{ osAndamento }}</span>
            </p>
          </div>
          <UIcon
            name="i-lucide-chevron-right"
            class="size-5 shrink-0 text-muted"
            aria-hidden="true"
          />
        </NuxtLink>
      </div>
    </section>

    <section aria-labelledby="home-registry-heading">
      <h2
        id="home-registry-heading"
        class="text-xs font-semibold uppercase tracking-wide text-muted"
      >
        Cadastro
      </h2>

      <dl
        class="mt-3 grid overflow-hidden rounded-md border border-default bg-default shadow-sm sm:grid-cols-2 sm:divide-x divide-default"
      >
        <NuxtLink
          to="/clientes"
          class="block px-4 py-5 transition-colors hover:bg-elevated/60"
        >
          <dt class="text-sm text-muted">
            Clientes
          </dt>
          <dd class="mt-1 text-2xl font-semibold font-mono tabular-nums tracking-tight text-highlighted">
            <USkeleton
              v-if="pending"
              class="h-8 w-14"
            />
            <span v-else>{{ clientesCount }}</span>
          </dd>
        </NuxtLink>

        <NuxtLink
          to="/veiculos"
          class="block border-t border-default px-4 py-5 transition-colors hover:bg-elevated/60 sm:border-t-0"
        >
          <dt class="text-sm text-muted">
            Veículos
          </dt>
          <dd class="mt-1 text-2xl font-semibold font-mono tabular-nums tracking-tight text-highlighted">
            <USkeleton
              v-if="pending"
              class="h-8 w-14"
            />
            <span v-else>{{ veiculosCount }}</span>
          </dd>
        </NuxtLink>
      </dl>
    </section>

    <section
      v-if="showFinance"
      aria-labelledby="home-finance-heading"
    >
      <div class="flex items-center justify-between gap-3">
        <h2
          id="home-finance-heading"
          class="text-xs font-semibold uppercase tracking-wide text-muted"
        >
          Financeiro
        </h2>
        <UButton
          :to="APP_ROUTES.sales"
          label="Detalhes"
          variant="link"
          size="sm"
          trailing-icon="i-lucide-arrow-right"
        />
      </div>

      <div
        class="mt-3 grid gap-px overflow-hidden rounded-md border border-default bg-default shadow-sm sm:grid-cols-3"
      >
        <div class="bg-default px-4 py-5">
          <p class="text-sm text-muted">
            Faturamento
          </p>
          <p class="mt-1 text-lg font-semibold font-mono tabular-nums text-highlighted">
            <USkeleton
              v-if="pendingFinance"
              class="h-7 w-28"
            />
            <span v-else>{{ formatMoney(totalFaturado) }}</span>
          </p>
        </div>
        <div class="bg-default px-4 py-5">
          <p class="text-sm text-muted">
            Recebido
          </p>
          <p class="mt-1 text-lg font-semibold font-mono tabular-nums text-success">
            <USkeleton
              v-if="pendingFinance"
              class="h-7 w-28"
            />
            <span v-else>{{ formatMoney(totalPago) }}</span>
          </p>
        </div>
        <div class="bg-default px-4 py-5">
          <p class="text-sm text-muted">
            Pendente
          </p>
          <p class="mt-1 text-lg font-semibold font-mono tabular-nums text-warning">
            <USkeleton
              v-if="pendingFinance"
              class="h-7 w-28"
            />
            <span v-else>{{ formatMoney(totalPendente) }}</span>
          </p>
        </div>
      </div>
    </section>
  </div>
</template>
