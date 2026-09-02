<script setup lang="ts">
import { ORDER_ROUTES } from '../utils/order-routes'
import { collectChecklistCategorias } from '../utils/checklist'
import {
  absolutePrintUrl,
  buildChecklistWhatsAppMessage,
  buildWhatsAppUrl
} from '../utils/print'
import { downloadChecklistPdf } from '../utils/pdf'
import { primaryPhone } from '~~/shared/utils/contact'

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
  adding,
  deletingId,
  importing,
  itemDraft,
  onSaveItem,
  onUpdateResultado,
  onUpdateObservacao,
  onMarkItemsOk,
  onConcludeChecklist,
  onAddItem,
  onDeleteItem,
  onImportFromCatalog
} = useChecklistPage(checklist, readOnly, refresh)

const { data: catalogItems } = await useChecklistCatalogActive()

const hasCatalogItems = computed(() => (catalogItems.value?.length || 0) > 0)

const catalogCategorias = computed(() =>
  collectChecklistCategorias(catalogItems.value || [])
)

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

const breadcrumbItems = computed(() => [
  {
    label: checklist.value?.ordens_servico?.numero || 'OS',
    to: ORDER_ROUTES.detail(ordemId.value),
    ui: { linkLabel: 'font-mono tabular-nums' }
  },
  { label: 'Checklist' }
])

async function onMarkAllOk() {
  await onMarkItemsOk(allItems.value)
}

const checklistWhatsappUrl = computed(() => {
  if (!ordem.value) return null
  return buildWhatsAppUrl(
    primaryPhone(ordem.value.veiculos?.clientes?.telefones),
    buildChecklistWhatsAppMessage(
      ordem.value.numero,
      absolutePrintUrl(ORDER_ROUTES.checklistPrint(ordemId.value))
    )
  )
})

const downloadingPdf = ref(false)

async function onDownloadChecklistPdf() {
  if (!ordem.value || !checklist.value || !import.meta.client) return
  downloadingPdf.value = true
  try {
    const veiculo = ordem.value.veiculos
    await downloadChecklistPdf({
      numero: ordem.value.numero,
      createdAt: formatDateTime(checklist.value.created_at),
      statusLabel: checklist.value.status === 'concluida' ? 'Concluída' : 'Em preenchimento',
      clienteNome: veiculo?.clientes?.nome ?? null,
      placa: veiculo?.placa ?? null,
      veiculoLabel: [veiculo?.marca, veiculo?.modelo].filter(Boolean).join(' ') || null,
      kmEntrada: ordem.value.km_entrada,
      itensByCategoria: itensByCategoria.value
    })
  } finally {
    downloadingPdf.value = false
  }
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Checklist">
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
              show-pdf
              :pdf-loading="downloadingPdf"
              @download-pdf="onDownloadChecklistPdf"
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
      <div class="border-b border-default px-4 py-2 sm:px-6">
        <UBreadcrumb :items="breadcrumbItems" />
      </div>
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
              <p class="font-mono text-sm tabular-nums text-muted">
                {{ filledCount }}/{{ totalCount }} itens
                <span v-if="pendingCount > 0 && !readOnly">
                  ({{ pendingCount }} pendente{{ pendingCount === 1 ? '' : 's' }})
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
                v-if="!readOnly && hasCatalogItems"
                label="Importar do catálogo"
                icon="i-lucide-download"
                color="neutral"
                variant="soft"
                size="sm"
                :loading="importing"
                @click="onImportFromCatalog"
              />
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

          <BaseEmptyState v-if="totalCount === 0 && !readOnly">
            Nenhum item no checklist. Adicione abaixo.
          </BaseEmptyState>

          <OrdersChecklistAddItemForm
            v-if="!readOnly"
            v-model:draft="itemDraft"
            :items="allItems"
            :catalog-categorias="catalogCategorias"
            :adding="adding"
            @add="onAddItem"
          />

          <section
            v-for="[categoria, itens] in itensByCategoria"
            :key="categoria"
            class="border-t border-default pt-6 first:border-t-0 first:pt-0"
          >
            <div class="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-default pb-2">
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

            <div class="divide-y divide-default">
              <OrdersChecklistItem
                v-for="item in itens"
                :key="item.id"
                :item="item"
                :read-only="readOnly"
                :photos="getPhotos(item.id)"
                :uploading-photos="uploadingItemId === item.id"
                :deleting-photo-id="deletingPhotoId"
                :deleting-item-id="deletingId"
                @save="onSaveItem"
                @update:resultado="onUpdateResultado"
                @update:observacao="onUpdateObservacao"
                @upload-photo="uploadPhoto"
                @delete-photo="deletePhoto"
                @delete="onDeleteItem"
              />
            </div>
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
