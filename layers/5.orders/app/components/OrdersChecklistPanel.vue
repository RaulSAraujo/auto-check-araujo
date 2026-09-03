<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { OrderDetail } from '../types/orders'
import { ORDER_ROUTES } from '../utils/order-routes'
import { collectChecklistCategorias } from '../utils/checklist'
import {
  absolutePrintUrl,
  buildChecklistWhatsAppMessage,
  buildWhatsAppUrl
} from '../utils/print'
import { downloadChecklistPdf } from '../utils/pdf'
import { primaryPhone } from '~~/shared/utils/contact'

defineOptions({ name: 'OrdersChecklistPanel' })

const props = defineProps<{
  ordemId: string
  ordem?: OrderDetail | null
}>()

const emit = defineEmits<{
  updated: []
}>()

const {
  checklist,
  pending,
  refresh,
  itensByCategoria,
  filledCount,
  totalCount,
  readOnly
} = await useChecklistQuery(() => props.ordemId)

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
const pendingCount = computed(() => totalCount.value - filledCount.value)
const showAddModal = ref(false)
const progress = computed(() =>
  totalCount.value ? Math.round((filledCount.value / totalCount.value) * 100) : 0
)

const {
  uploadingItemId,
  deletingPhotoId,
  getPhotos,
  uploadPhoto,
  deletePhoto,
  clearPhotosForItem
} = useChecklistPhotos(checklistId, allItems, readOnly)

async function onResultadoChange(
  item: typeof allItems.value[number],
  value: Parameters<typeof onUpdateResultado>[1],
  clearDetails?: boolean
) {
  const shouldClear = clearDetails === true
  if (shouldClear) {
    await clearPhotosForItem(item.id)
  }
  onUpdateResultado(item, value, shouldClear)
}

async function onMarkSectionOk(itens: typeof allItems.value) {
  await onMarkItemsOk(itens, {
    getPhotoCount: id => getPhotos(id).length,
    clearPhotos: clearPhotosForItem
  })
}

async function onMarkAllOk() {
  await onMarkItemsOk(allItems.value, {
    getPhotoCount: id => getPhotos(id).length,
    clearPhotos: clearPhotosForItem
  })
}

watch(checklist, (value, previous) => {
  if (!value) return
  if (!previous || previous.status !== value.status) {
    emit('updated')
  }
}, { immediate: true })

watch(adding, (value, previous) => {
  if (previous && !value) showAddModal.value = false
})

const checklistWhatsappUrl = computed(() => {
  if (!props.ordem) return null
  return buildWhatsAppUrl(
    primaryPhone(props.ordem.veiculos?.clientes?.telefones),
    buildChecklistWhatsAppMessage(
      props.ordem.numero,
      absolutePrintUrl(ORDER_ROUTES.checklistPrint(props.ordemId))
    )
  )
})

const downloadingPdf = ref(false)

async function onDownloadChecklistPdf() {
  if (!props.ordem || !checklist.value || !import.meta.client) return
  downloadingPdf.value = true
  try {
    const veiculo = props.ordem.veiculos
    await downloadChecklistPdf({
      numero: props.ordem.numero,
      createdAt: formatDateTime(checklist.value.created_at),
      statusLabel: checklist.value.status === 'concluida' ? 'Concluída' : 'Em preenchimento',
      clienteNome: veiculo?.clientes?.nome ?? null,
      placa: veiculo?.placa ?? null,
      veiculoLabel: [veiculo?.marca, veiculo?.modelo].filter(Boolean).join(' ') || null,
      kmEntrada: props.ordem.km_entrada,
      itensByCategoria: itensByCategoria.value
    })
  } finally {
    downloadingPdf.value = false
  }
}

const moreItems = computed<DropdownMenuItem[][]>(() => {
  const items: DropdownMenuItem[] = []

  if (!readOnly.value && hasCatalogItems.value) {
    items.push({
      label: importing.value ? 'Importando…' : 'Importar do catálogo',
      icon: 'i-lucide-download',
      disabled: importing.value,
      onSelect: () => { void onImportFromCatalog() }
    })
  }

  items.push({
    label: 'Imprimir',
    icon: 'i-lucide-printer',
    to: ORDER_ROUTES.checklistPrint(props.ordemId),
    target: '_blank'
  })
  items.push({
    label: downloadingPdf.value ? 'Baixando…' : 'Baixar PDF',
    icon: 'i-lucide-file-down',
    disabled: downloadingPdf.value,
    onSelect: () => { void onDownloadChecklistPdf() }
  })

  if (checklistWhatsappUrl.value) {
    items.push({
      label: 'WhatsApp',
      icon: 'i-simple-icons-whatsapp',
      to: checklistWhatsappUrl.value,
      target: '_blank'
    })
  }

  return [items]
})
</script>

<template>
  <div
    v-if="pending && !checklist"
    class="space-y-3"
  >
    <USkeleton class="h-8 w-40" />
    <USkeleton class="h-48 w-full" />
  </div>

  <div
    v-else-if="checklist"
    class="flex min-h-0 flex-col gap-4"
  >
    <div class="space-y-2">
      <div class="flex items-center justify-between gap-2">
        <p class="min-w-0 font-mono text-sm tabular-nums text-muted">
          {{ filledCount }}/{{ totalCount }}
          <span
            v-if="pendingCount > 0 && !readOnly"
            class="text-warning"
          >
            · {{ pendingCount }} pendente{{ pendingCount === 1 ? '' : 's' }}
          </span>
        </p>
        <div class="flex shrink-0 items-center gap-1">
          <UBadge
            :color="checklist.status === 'concluida' ? 'success' : 'warning'"
            variant="subtle"
            size="sm"
          >
            {{ checklist.status === 'concluida' ? 'Concluída' : 'Em preenchimento' }}
          </UBadge>
          <UDropdownMenu
            :items="moreItems"
            :content="{ align: 'end' }"
          >
            <UButton
              icon="i-lucide-ellipsis"
              color="neutral"
              variant="ghost"
              size="xs"
              aria-label="Mais ações"
            />
          </UDropdownMenu>
        </div>
      </div>
      <UProgress
        :model-value="progress"
        size="sm"
        class="w-full"
      />
      <p
        class="sr-only"
        aria-live="polite"
      >
        {{ filledCount }} de {{ totalCount }} itens preenchidos
      </p>
    </div>

    <div
      v-if="!readOnly"
      class="flex flex-wrap items-center gap-2"
    >
      <UButton
        label="Adicionar item"
        icon="i-lucide-plus"
        size="sm"
        color="neutral"
        variant="soft"
        @click="showAddModal = true"
      />
      <div class="flex-1" />
      <UButton
        v-if="pendingCount > 0"
        label="Marcar tudo OK"
        icon="i-lucide-check-check"
        color="success"
        variant="ghost"
        size="sm"
        :loading="bulkSaving"
        @click="onMarkAllOk"
      />
    </div>

    <BaseEmptyState
      v-if="totalCount === 0"
      icon="i-lucide-clipboard-list"
    >
      {{ readOnly ? 'Nenhum item no checklist.' : 'Nenhum item. Adicione ou importe do catálogo.' }}
    </BaseEmptyState>

    <section
      v-for="[categoria, itens] in itensByCategoria"
      :key="categoria"
      class="space-y-2"
    >
      <div class="flex items-center justify-between gap-2 px-0.5">
        <h3 class="min-w-0 truncate text-xs font-semibold uppercase tracking-wide text-muted">
          {{ categoria }}
          <span class="ms-1 font-mono tabular-nums font-normal">
            {{ itens.filter(i => i.resultado).length }}/{{ itens.length }}
          </span>
        </h3>
        <UButton
          v-if="!readOnly && itens.some(i => i.resultado !== 'ok')"
          label="OK nesta seção"
          color="success"
          variant="ghost"
          size="xs"
          :loading="bulkSaving"
          @click="onMarkSectionOk(itens)"
        />
      </div>

      <div class="divide-y divide-default rounded-xl bg-default/40 px-3 ring-1 ring-default/50">
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
          @update:resultado="onResultadoChange"
          @update:observacao="onUpdateObservacao"
          @upload-photo="uploadPhoto"
          @delete-photo="deletePhoto"
          @delete="onDeleteItem"
        />
      </div>
    </section>

    <UButton
      v-if="!readOnly"
      label="Concluir checklist"
      icon="i-lucide-check"
      block
      :loading="concluding"
      @click="onConcludeChecklist"
    />

    <UModal
      v-model:open="showAddModal"
      title="Adicionar item"
    >
      <template #body>
        <OrdersChecklistAddItemForm
          v-model:draft="itemDraft"
          :items="allItems"
          :catalog-categorias="catalogCategorias"
          :adding="adding"
          @add="onAddItem"
        />
      </template>
    </UModal>
  </div>
</template>
