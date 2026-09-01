import type { ChecklistItem } from '~~/shared/types/database'
import type { ChecklistItemFoto } from '~~/shared/types/database'
import {
  CHECKLIST_PHOTOS_ALLOWED_TYPES,
  CHECKLIST_PHOTOS_BUCKET,
  CHECKLIST_PHOTOS_MAX_PER_ITEM,
  CHECKLIST_PHOTOS_MAX_SIZE_BYTES
} from '../utils/checklist-photos'

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
    const withUrls: ChecklistPhotoWithUrl[] = []

    for (const photo of photos) {
      const { data } = await supabase.storage
        .from(CHECKLIST_PHOTOS_BUCKET)
        .createSignedUrl(photo.storage_path, 3600)

      withUrls.push({
        ...photo,
        url: data?.signedUrl || ''
      })
    }

    return withUrls
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
        .select('*')
        .in('checklist_item_id', itemIds)
        .order('created_at')

      if (error) throw error

      const grouped: Record<string, ChecklistPhotoWithUrl[]> = {}
      const photosWithUrls = await attachSignedUrls(data || [])

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
        .select('*')
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

  async function deletePhoto(photo: ChecklistPhotoWithUrl) {
    if (readOnly.value) return

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

      toast.add({ title: 'Foto removida', color: 'success' })
    } catch (error) {
      toast.add({
        title: 'Erro ao remover foto',
        description: error instanceof Error ? error.message : undefined,
        color: 'error'
      })
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
    maxPhotosPerItem: CHECKLIST_PHOTOS_MAX_PER_ITEM
  }
}
