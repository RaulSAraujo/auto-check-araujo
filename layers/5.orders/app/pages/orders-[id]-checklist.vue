<script setup lang="ts">
import { ORDER_ROUTES } from '../utils/order-routes'
import {
  absolutePrintUrl,
  buildChecklistWhatsAppMessage,
  buildWhatsAppUrl
} from '../utils/print'

defineOptions({ name: 'OrdersChecklistPage' })

definePageMeta({
  path: '/ordens/:id/checklist',
  layout: 'app'
})

const route = useRoute()

const ordemId = computed(() => route.params.id as string)

const { data: ordem } = await useOrderQuery(ordemId)

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
  bulkSaving,
  onSaveItem,
  onUpdateResultado,
  onUpdateObservacao,
  onMarkItemsOk,
  onConcludeChecklist
} = useChecklistPage(checklist, readOnly, refresh)

const allItems = computed(() => checklist.value?.checklist_itens ?? [])

const checklistId = computed(() => checklist.value?.id)

const {
  uploadingItemId,
  deletingPhotoId,
  getPhotos,
  uploadPhoto,
  deletePhoto
} = useChecklistPhotos(checklistId, allItems, readOnly)

const pendingCount = computed(() => totalCount.value - filledCount.value)

async function onMarkAllOk() {
  await onMarkItemsOk(allItems.value)
}

const checklistWhatsappUrl = computed(() => {
  if (!ordem.value) return null
  return buildWhatsAppUrl(
    ordem.value.veiculos?.clientes?.telefone,
    buildChecklistWhatsAppMessage(
      ordem.value.numero,
      absolutePrintUrl(ORDER_ROUTES.checklistPrint(ordemId.value))
    )
  )
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="checklist ? `Checklist — ${checklist.ordens_servico?.numero}` : 'Checklist'">
        <template #leading>
          <UDashboardSidebarToggle />
        </template>
        <template #right>
          <div class="flex flex-wrap items-center gap-2">
            <OrdersPrintActions
              v-if="checklist"
              :print-to="ORDER_ROUTES.checklistPrint(ordemId)"
              :whatsapp-url="checklistWhatsappUrl"
              print-label="Imprimir checklist"
            />
            <UButton
              :to="ORDER_ROUTES.detail(ordemId)"
              color="neutral"
              variant="ghost"
              label="Voltar à OS"
              icon="i-lucide-arrow-left"
            />
          </div>
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
        class="p-4 sm:p-6 max-w-3xl"
      >
        <div class="space-y-6 pb-24">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-sm text-muted">
                {{ filledCount }} de {{ totalCount }} itens
                <span v-if="pendingCount > 0 && !readOnly">
                  · {{ pendingCount }} pendente(s)
                </span>
              </p>
              <UProgress
                :model-value="totalCount ? (filledCount / totalCount) * 100 : 0"
                class="mt-2 w-full max-w-xs"
              />
            </div>
            <div class="flex flex-wrap gap-2 items-center">
              <UBadge
                :color="checklist.status === 'concluida' ? 'success' : 'warning'"
                variant="subtle"
              >
                {{ checklist.status === 'concluida' ? 'Concluída' : 'Em preenchimento' }}
              </UBadge>
              <UButton
                v-if="!readOnly && pendingCount > 0"
                label="Marcar tudo OK"
                icon="i-lucide-check-check"
                color="success"
                variant="soft"
                size="sm"
                :loading="bulkSaving"
                @click="onMarkAllOk"
              />
            </div>
          </div>

          <section
            v-for="[categoria, itens] in itensByCategoria"
            :key="categoria"
            class="space-y-2"
          >
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-default pb-2">
              <h2 class="text-base font-semibold text-highlighted">
                {{ categoria }}
              </h2>
              <UButton
                v-if="!readOnly"
                label="Todos OK"
                icon="i-lucide-check"
                color="success"
                variant="ghost"
                size="xs"
                :loading="bulkSaving"
                @click="onMarkItemsOk(itens)"
              />
            </div>

            <OrdersChecklistItem
              v-for="item in itens"
              :key="item.id"
              :item="item"
              :read-only="readOnly"
              :photos="getPhotos(item.id)"
              :uploading-photos="uploadingItemId === item.id"
              :deleting-photo-id="deletingPhotoId"
              @save="onSaveItem"
              @update:resultado="onUpdateResultado"
              @update:observacao="onUpdateObservacao"
              @upload-photo="uploadPhoto"
              @delete-photo="deletePhoto"
            />
          </section>
        </div>

        <div
          v-if="!readOnly"
          class="fixed inset-x-0 bottom-0 z-10 border-t border-default bg-default/95 backdrop-blur p-3 sm:static sm:mt-6 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none"
        >
          <div class="mx-auto flex max-w-3xl gap-2 sm:px-6">
            <UButton
              label="Concluir checklist"
              icon="i-lucide-check"
              block
              :loading="concluding"
              @click="onConcludeChecklist"
            />
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
