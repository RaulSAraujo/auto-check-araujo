import type { ChecklistItem } from '~~/shared/types/database'
import type { ChecklistWithItems, OrderDetail } from '../types/orders'
import { CHECKLIST_PHOTOS_BUCKET } from '../utils/checklist-photos'
import { groupChecklistItensByCategoria } from '../utils/checklist'

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

      const { data: ordem, error: ordemError } = await supabase
        .from('ordens_servico')
        .select('*, veiculos(id, placa, marca, modelo, clientes(id, nome, telefones)), profiles!ordens_servico_aberto_por_fkey(nome)')
        .eq('id', id)
        .single()

      if (ordemError) throw ordemError

      const { data: checklist, error: checklistError } = await supabase
        .from('checklists')
        .select('*, checklist_itens(*)')
        .eq('ordem_servico_id', id)
        .maybeSingle()

      if (checklistError) throw checklistError

      if (!checklist) {
        return {
          ordem: ordem as OrderDetail,
          checklist: null as ChecklistWithItems | null,
          itensByCategoria: [] as [string, ChecklistItem[]][],
          photosByItemId: {} as Record<string, ChecklistPrintPhoto[]>
        }
      }

      const items = [...(checklist.checklist_itens || [])].sort((a, b) => a.ordem - b.ordem)
      const itemIds = items.map(item => item.id)

      const photosByItemId: Record<string, ChecklistPrintPhoto[]> = {}

      if (itemIds.length > 0) {
        const { data: fotos } = await supabase
          .from('checklist_item_fotos')
          .select('*')
          .in('checklist_item_id', itemIds)
          .order('created_at')

        for (const foto of fotos || []) {
          const { data: signed } = await supabase.storage
            .from(CHECKLIST_PHOTOS_BUCKET)
            .createSignedUrl(foto.storage_path, 3600)

          const entry: ChecklistPrintPhoto = {
            url: signed?.signedUrl || '',
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
        ordem: ordem as OrderDetail,
        checklist: checklistWithItems,
        itensByCategoria: groupChecklistItensByCategoria(items),
        photosByItemId
      }
    }
  )
}
