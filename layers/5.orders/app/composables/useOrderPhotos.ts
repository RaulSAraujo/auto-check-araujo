import type { OrdemFoto } from '~~/shared/types/database'
import {
  isAllowedOrderPhoto,
  ORDER_PHOTOS_BUCKET,
  ORDER_PHOTOS_MAX_COUNT,
  orderPhotoStoragePath
} from '../utils/order-photos'

export type OrderPhotoWithUrl = OrdemFoto & {
  url: string | null
}

export function useOrderPhotos(
  orderId: MaybeRefOrGetter<string>,
  options?: { canEdit?: MaybeRefOrGetter<boolean> }
) {
  const supabase = useTypedSupabaseClient()
  const toast = useToast()

  const photos = ref<OrderPhotoWithUrl[]>([])
  const pending = ref(false)
  const uploading = ref(false)
  const deletingId = ref<string | null>(null)

  const canEdit = computed(() => Boolean(toValue(options?.canEdit)))

  async function signedUrl(path: string): Promise<string | null> {
    const { data, error } = await supabase.storage
      .from(ORDER_PHOTOS_BUCKET)
      .createSignedUrl(path, 60 * 60)

    if (error) return null
    return data.signedUrl
  }

  async function refresh() {
    const id = toValue(orderId)
    if (!id) {
      photos.value = []
      return
    }

    pending.value = true
    try {
      const { data, error } = await supabase
        .from('ordem_fotos')
        .select('id, ordem_servico_id, storage_path, nome_arquivo, legenda, created_at')
        .eq('ordem_servico_id', id)
        .order('created_at', { ascending: true })

      if (error) throw error

      const rows = (data || []) as OrdemFoto[]
      photos.value = await Promise.all(
        rows.map(async (row) => ({
          ...row,
          url: await signedUrl(row.storage_path)
        }))
      )
    } catch (error) {
      toast.add({
        title: 'Não foi possível carregar as fotos',
        description: error instanceof Error ? error.message : undefined,
        color: 'error'
      })
      photos.value = []
    } finally {
      pending.value = false
    }
  }

  async function uploadFiles(fileList: FileList | File[]) {
    if (!canEdit.value) return

    const id = toValue(orderId)
    const files = Array.from(fileList)
    if (!id || !files.length) return

    const remaining = ORDER_PHOTOS_MAX_COUNT - photos.value.length
    if (remaining <= 0) {
      toast.add({
        title: 'Limite de fotos',
        description: `Máximo de ${ORDER_PHOTOS_MAX_COUNT} fotos por OS.`,
        color: 'warning'
      })
      return
    }

    const accepted = files.filter(isAllowedOrderPhoto).slice(0, remaining)
    if (!accepted.length) {
      toast.add({
        title: 'Arquivo inválido',
        description: 'Use JPEG, PNG ou WebP até 5 MB.',
        color: 'warning'
      })
      return
    }

    uploading.value = true
    try {
      for (const file of accepted) {
        const path = orderPhotoStoragePath(id, file)
        const { error: uploadError } = await supabase.storage
          .from(ORDER_PHOTOS_BUCKET)
          .upload(path, file, {
            contentType: file.type,
            upsert: false
          })

        if (uploadError) {
          toast.add({
            title: 'Erro ao enviar foto',
            description: uploadError.message,
            color: 'error'
          })
          continue
        }

        const { error: insertError } = await supabase.from('ordem_fotos').insert({
          ordem_servico_id: id,
          storage_path: path,
          nome_arquivo: file.name,
          legenda: null
        })

        if (insertError) {
          await supabase.storage.from(ORDER_PHOTOS_BUCKET).remove([path])
          toast.add({
            title: 'Erro ao salvar foto',
            description: insertError.message,
            color: 'error'
          })
        }
      }

      await refresh()
    } finally {
      uploading.value = false
    }
  }

  async function removePhoto(photo: OrderPhotoWithUrl) {
    if (!canEdit.value) return

    deletingId.value = photo.id
    try {
      const { error } = await supabase
        .from('ordem_fotos')
        .delete()
        .eq('id', photo.id)

      if (error) {
        toast.add({
          title: 'Erro ao remover foto',
          description: error.message,
          color: 'error'
        })
        return
      }

      await supabase.storage.from(ORDER_PHOTOS_BUCKET).remove([photo.storage_path])
      photos.value = photos.value.filter(item => item.id !== photo.id)
    } finally {
      deletingId.value = null
    }
  }

  async function updateCaption(photoId: string, legenda: string) {
    if (!canEdit.value) return

    const trimmed = legenda.trim() || null
    const { error } = await supabase
      .from('ordem_fotos')
      .update({ legenda: trimmed })
      .eq('id', photoId)

    if (error) {
      toast.add({
        title: 'Erro ao salvar legenda',
        description: error.message,
        color: 'error'
      })
      return
    }

    const target = photos.value.find(item => item.id === photoId)
    if (target) target.legenda = trimmed
  }

  watch(() => toValue(orderId), () => {
    void refresh()
  }, { immediate: true })

  return {
    photos,
    pending,
    uploading,
    deletingId,
    refresh,
    uploadFiles,
    removePhoto,
    updateCaption
  }
}
