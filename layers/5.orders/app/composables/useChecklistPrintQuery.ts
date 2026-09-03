import type { ChecklistItem } from '~~/shared/types/database'
import type { ChecklistWithItems, OrderDetail } from '../types/orders'
import { CHECKLIST_PHOTOS_BUCKET } from '../utils/checklist-photos'
import { groupChecklistItensByCategoria } from '../utils/checklist'
import {
  CHECKLIST_DETAIL_SELECT,
  CHECKLIST_PHOTO_SELECT,
  ORDER_DETAIL_SELECT
} from '../utils/order-selects'

export type ChecklistPrintPhoto = {
  url: string
  nome_arquivo: string | null
}

export function useChecklistPrintQuery(ordemId: MaybeRefOrGetter<string>) {
  const supabase = useTypedSupabaseClient()

  return useAsyncData(
    () => `checklist-print-${toValue(ordemId)}`,
    async () => {
      const id = toValue(ordemId)

      const [ordemResult, checklistResult] = await Promise.all([
        supabase
          .from('ordens_servico')
          .select(ORDER_DETAIL_SELECT)
          .eq('id', id)
          .single(),
        supabase
          .from('checklists')
          .select(CHECKLIST_DETAIL_SELECT)
          .eq('ordem_servico_id', id)
          .order('ordem', { referencedTable: 'checklist_itens' })
          .maybeSingle()
      ])

      if (ordemResult.error) throw ordemResult.error
      if (checklistResult.error) throw checklistResult.error

      const ordem = ordemResult.data as OrderDetail
      const checklist = checklistResult.data

      if (!checklist) {
        return {
          ordem,
          checklist: null as ChecklistWithItems | null,
          itensByCategoria: [] as [string, ChecklistItem[]][],
          photosByItemId: {} as Record<string, ChecklistPrintPhoto[]>
        }
      }

      const items = (checklist.checklist_itens || []) as ChecklistItem[]
      const itemIds = items.map(item => item.id)
      const photosByItemId: Record<string, ChecklistPrintPhoto[]> = {}

      if (itemIds.length > 0) {
        const { data: fotos, error: fotosError } = await supabase
          .from('checklist_item_fotos')
          .select(CHECKLIST_PHOTO_SELECT)
          .in('checklist_item_id', itemIds)
          .order('created_at')

        if (fotosError) throw fotosError

        const paths = (fotos || []).map(foto => foto.storage_path)
        const { data: signedRows } = paths.length
          ? await supabase.storage
            .from(CHECKLIST_PHOTOS_BUCKET)
            .createSignedUrls(paths, 3600)
          : { data: [] }

        const urlByPath = new Map(
          (signedRows || [])
            .filter(row => row.path)
            .map(row => [row.path as string, row.signedUrl || ''])
        )

        for (const foto of fotos || []) {
          const entry: ChecklistPrintPhoto = {
            url: urlByPath.get(foto.storage_path) || '',
            nome_arquivo: foto.nome_arquivo
          }
          const list = photosByItemId[foto.checklist_item_id] ?? []
          list.push(entry)
          photosByItemId[foto.checklist_item_id] = list
        }
      }

      const checklistWithItems = {
        ...checklist,
        checklist_itens: items
      } as ChecklistWithItems

      return {
        ordem,
        checklist: checklistWithItems,
        itensByCategoria: groupChecklistItensByCategoria(items),
        photosByItemId
      }
    }
  )
}
