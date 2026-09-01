<script setup lang="ts">
import { ORDER_ROUTES } from '../utils/order-routes'

defineOptions({ name: 'OrdersChecklistPage' })

definePageMeta({
  path: '/ordens/:id/checklist',
  layout: 'app'
})

const route = useRoute()

const ordemId = computed(() => route.params.id as string)

const {
  checklist,
  pending,
  refresh,
  itensByCategoria,
  filledCount,
  totalCount,
  readOnly
} = await useChecklistQuery(ordemId)

const {
  concluding,
  onSaveItem,
  onUpdateResultado,
  onUpdateObservacao,
  onConcludeChecklist
} = useChecklistPage(checklist, readOnly, refresh)
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="checklist ? `Checklist — ${checklist.ordens_servico?.numero}` : 'Checklist'">
        <template #leading>
          <UDashboardSidebarToggle />
        </template>
        <template #right>
          <UButton
            :to="ORDER_ROUTES.detail(ordemId)"
            color="neutral"
            variant="ghost"
            label="Voltar à OS"
            icon="i-lucide-arrow-left"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div
        v-if="pending && !checklist"
        class="p-6"
      >
        <USkeleton class="h-64 w-full max-w-3xl" />
      </div>

      <div
        v-else-if="checklist"
        class="p-4 sm:p-6 space-y-6 max-w-3xl"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-sm text-muted">
              Progresso: {{ filledCount }} / {{ totalCount }} itens
            </p>
            <UProgress
              :model-value="totalCount ? (filledCount / totalCount) * 100 : 0"
              class="mt-2 w-48"
            />
          </div>
          <div class="flex gap-2 items-center">
            <UBadge
              :color="checklist.status === 'concluida' ? 'success' : 'warning'"
              variant="subtle"
            >
              {{ checklist.status === 'concluida' ? 'Concluída' : 'Em preenchimento' }}
            </UBadge>
            <UButton
              v-if="!readOnly"
              label="Concluir checklist"
              icon="i-lucide-check"
              :loading="concluding"
              @click="onConcludeChecklist"
            />
          </div>
        </div>

        <section
          v-for="[categoria, itens] in itensByCategoria"
          :key="categoria"
          class="space-y-3"
        >
          <h2 class="text-base font-semibold text-highlighted border-b border-default pb-2">
            {{ categoria }}
          </h2>

          <OrdersChecklistItem
            v-for="item in itens"
            :key="item.id"
            :item="item"
            :read-only="readOnly"
            @save="onSaveItem"
            @update:resultado="onUpdateResultado"
            @update:observacao="onUpdateObservacao"
          />
        </section>
      </div>
    </template>
  </UDashboardPanel>
</template>
