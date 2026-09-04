import type { ChecklistItem, ChecklistItemFoto } from '~~/shared/types/database'
import {
  CHECKLIST_PHOTOS_ALLOWED_TYPES,
  CHECKLIST_PHOTOS_BUCKET,
  CHECKLIST_PHOTOS_MAX_PER_ITEM,
  CHECKLIST_PHOTOS_MAX_SIZE_BYTES
} from '../utils/checklist-photos'
import { CHECKLIST_PHOTO_SELECT } from '../utils/order-selects'

export type ChecklistPhotoWithUrl = ChecklistItemFoto & {
  url: string
}

export function useChecklistPhotos(
  checklistId: Ref<string | undefined>,
  items: Ref<ChecklistItem[] | undefined>,
  readOnly: Ref<boolean>
) {
  const supabase = useTypedSupabaseClient()
  const toast = useToast()

  const photosByItemId = ref<Record<string, ChecklistPhotoWithUrl[]>>({})
  const loading = ref(false)
  const uploadingItemId = ref<string | null>(null)
  const deletingPhotoId = ref<string | null>(null)

  async function attachSignedUrls(
    photos: ChecklistItemFoto[]
  ): Promise<ChecklistPhotoWithUrl[]> {
    if (photos.length === 0) return []

    const { data, error } = await supabase.storage
      .from(CHECKLIST_PHOTOS_BUCKET)
      .createSignedUrls(photos.map(photo => photo.storage_path), 3600)

    if (error) throw error

    const urlByPath = new Map(
      (data || [])
        .filter(row => row.path)
        .map(row => [row.path as string, row.signedUrl || ''])
    )

    return photos.map(photo => ({
      ...photo,
      url: urlByPath.get(photo.storage_path) || ''
    }))
  }

  async function loadPhotos() {
    const itemIds = items.value?.map(item => item.id) || []
    if (!itemIds.length) {
      photosByItemId.value = {}
      return
    }

    loading.value = true
    try {
      const { data, error } = await supabase
        .from('checklist_item_fotos')
        .select(CHECKLIST_PHOTO_SELECT)
        .in('checklist_item_id', itemIds)
        .order('created_at')

      if (error) throw error

      const grouped: Record<string, ChecklistPhotoWithUrl[]> = {}
      const photosWithUrls = await attachSignedUrls((data || []) as ChecklistItemFoto[])

      for (const photo of photosWithUrls) {
        const list = grouped[photo.checklist_item_id] ?? []
        list.push(photo)
        grouped[photo.checklist_item_id] = list
      }

      photosByItemId.value = grouped
    } catch (error) {
      toast.add({
        title: 'Erro ao carregar fotos',
        description: error instanceof Error ? error.message : undefined,
        color: 'error'
      })
    } finally {
      loading.value = false
    }
  }

  watch([items, checklistId], () => {
    loadPhotos()
  }, { immediate: true })

  function getPhotos(itemId: string): ChecklistPhotoWithUrl[] {
    return photosByItemId.value[itemId] || []
  }

  async function uploadPhoto(itemId: string, file: File) {
    if (readOnly.value || !checklistId.value) return

    const currentCount = getPhotos(itemId).length
    if (currentCount >= CHECKLIST_PHOTOS_MAX_PER_ITEM) {
      toast.add({
        title: 'Limite de fotos atingido',
        description: `Máximo de ${CHECKLIST_PHOTOS_MAX_PER_ITEM} fotos por item.`,
        color: 'warning'
      })
      return
    }

    if (!CHECKLIST_PHOTOS_ALLOWED_TYPES.includes(file.type as typeof CHECKLIST_PHOTOS_ALLOWED_TYPES[number])) {
      toast.add({
        title: 'Formato inválido',
        description: 'Use JPEG, PNG ou WebP.',
        color: 'warning'
      })
      return
    }

    if (file.size > CHECKLIST_PHOTOS_MAX_SIZE_BYTES) {
      toast.add({
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo é 5 MB.',
        color: 'warning'
      })
      return
    }

    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const storagePath = `${checklistId.value}/${itemId}/${crypto.randomUUID()}.${extension}`

    uploadingItemId.value = itemId
    try {
      const { error: uploadError } = await supabase.storage
        .from(CHECKLIST_PHOTOS_BUCKET)
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false
        })

      if (uploadError) throw uploadError

      const { data: inserted, error: insertError } = await supabase
        .from('checklist_item_fotos')
        .insert({
          checklist_item_id: itemId,
          storage_path: storagePath,
          nome_arquivo: file.name
        })
        .select(CHECKLIST_PHOTO_SELECT)
        .single()

      if (insertError) {
        await supabase.storage.from(CHECKLIST_PHOTOS_BUCKET).remove([storagePath])
        throw insertError
      }

      const [photoWithUrl] = await attachSignedUrls([inserted])
      if (!photoWithUrl) {
        throw new Error('Não foi possível gerar URL da foto')
      }

      photosByItemId.value[itemId] = [...getPhotos(itemId), photoWithUrl]
      toast.add({ title: 'Foto enviada', color: 'success' })
    } catch (error) {
      toast.add({
        title: 'Erro ao enviar foto',
        description: error instanceof Error ? error.message : undefined,
        color: 'error'
      })
    } finally {
      uploadingItemId.value = null
    }
  }

  async function deletePhoto(
    photo: ChecklistPhotoWithUrl,
    options?: { silent?: boolean }
  ) {
    if (readOnly.value) return { error: null as Error | null }

    deletingPhotoId.value = photo.id
    try {
      const { error: storageError } = await supabase.storage
        .from(CHECKLIST_PHOTOS_BUCKET)
        .remove([photo.storage_path])

      if (storageError) throw storageError

      const { error } = await supabase
        .from('checklist_item_fotos')
        .delete()
        .eq('id', photo.id)

      if (error) throw error

      photosByItemId.value[photo.checklist_item_id] = getPhotos(photo.checklist_item_id)
        .filter(item => item.id !== photo.id)

      if (!options?.silent) {
        toast.add({ title: 'Foto removida', color: 'success' })
      }

      return { error: null }
    } catch (error) {
      if (!options?.silent) {
        toast.add({
          title: 'Erro ao remover foto',
          description: error instanceof Error ? error.message : undefined,
          color: 'error'
        })
      }
      return { error: error instanceof Error ? error : new Error('Erro ao remover foto') }
    } finally {
      deletingPhotoId.value = null
    }
  }

  async function clearPhotosForItem(itemId: string) {
    if (readOnly.value) return { error: null as Error | null }

    const photos = [...getPhotos(itemId)]
    if (photos.length === 0) return { error: null }

    deletingPhotoId.value = photos[0]?.id ?? itemId
    try {
      const paths = photos.map(photo => photo.storage_path)
      const ids = photos.map(photo => photo.id)

      const { error: storageError } = await supabase.storage
        .from(CHECKLIST_PHOTOS_BUCKET)
        .remove(paths)

      if (storageError) throw storageError

      const { error } = await supabase
        .from('checklist_item_fotos')
        .delete()
        .in('id', ids)

      if (error) throw error

      photosByItemId.value[itemId] = []
      return { error: null }
    } catch (error) {
      toast.add({
        title: 'Erro ao remover fotos',
        description: error instanceof Error ? error.message : undefined,
        color: 'error'
      })
      return { error: error instanceof Error ? error : new Error('Erro ao remover fotos') }
    } finally {
      deletingPhotoId.value = null
    }
  }

  return {
    photosByItemId,
    loading,
    uploadingItemId,
    deletingPhotoId,
    getPhotos,
    loadPhotos,
    uploadPhoto,
    deletePhoto,
    clearPhotosForItem,
    maxPhotosPerItem: CHECKLIST_PHOTOS_MAX_PER_ITEM
  }
}
