import type { ChecklistTemplateItem } from '~~/shared/types/database'
import type { ChecklistItemDraft } from '../utils/checklist'

const CHECKLIST_CATALOG_KEY = 'checklist-catalog-list'
const CHECKLIST_CATALOG_ACTIVE_KEY = 'checklist-catalog-active'

async function getOrCreateActiveTemplateId(supabase: ReturnType<typeof useTypedSupabaseClient>) {
  const { data: existing } = await supabase
    .from('checklist_templates')
    .select('id')
    .eq('ativo', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (existing) return existing.id

  const { data: created, error } = await supabase
    .from('checklist_templates')
    .insert({ nome: 'Padrão', ativo: true })
    .select('id')
    .single()

  if (error) throw error
  return created.id
}

export function useChecklistCatalogList() {
  const supabase = useTypedSupabaseClient()

  const { data, pending, refresh, error } = useAsyncData(
    CHECKLIST_CATALOG_KEY,
    async () => {
      const templateId = await getOrCreateActiveTemplateId(supabase)

      const { data: rows, error: fetchError } = await supabase
        .from('checklist_template_itens')
        .select('*')
        .eq('template_id', templateId)
        .order('ativo', { ascending: false })
        .order('ordem')

      if (fetchError) throw fetchError
      return rows as ChecklistTemplateItem[]
    }
  )

  return {
    items: data,
    pending,
    refresh,
    error
  }
}

export function useChecklistCatalogActive() {
  const supabase = useTypedSupabaseClient()

  return useAsyncData(
    CHECKLIST_CATALOG_ACTIVE_KEY,
    async () => {
      const { data: template } = await supabase
        .from('checklist_templates')
        .select('id')
        .eq('ativo', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (!template) return []

      const { data: rows, error } = await supabase
        .from('checklist_template_itens')
        .select('*')
        .eq('template_id', template.id)
        .eq('ativo', true)
        .order('ordem')

      if (error) throw error
      return rows as ChecklistTemplateItem[]
    }
  )
}

export function useChecklistCatalogMutations() {
  const supabase = useTypedSupabaseClient()
  const toast = useToast()

  async function refreshChecklistCatalogCaches() {
    await refreshNuxtData([CHECKLIST_CATALOG_KEY, CHECKLIST_CATALOG_ACTIVE_KEY])
  }

  async function createChecklistCatalogItem(draft: ChecklistItemDraft, ordem: number) {
    const templateId = await getOrCreateActiveTemplateId(supabase)

    const { error } = await supabase
      .from('checklist_template_itens')
      .insert({
        template_id: templateId,
        categoria: draft.categoria.trim(),
        label: draft.label.trim(),
        ordem
      })

    if (error) {
      toast.add({ title: 'Erro ao adicionar item', description: error.message, color: 'error' })
      return { error }
    }

    toast.add({ title: 'Item adicionado ao catálogo', color: 'success' })
    await refreshChecklistCatalogCaches()
    return { error: null }
  }

  async function updateChecklistCatalogItem(
    id: string,
    payload: ChecklistItemDraft
  ) {
    const { error } = await supabase
      .from('checklist_template_itens')
      .update({
        categoria: payload.categoria.trim(),
        label: payload.label.trim()
      })
      .eq('id', id)

    if (error) {
      toast.add({ title: 'Erro ao salvar item', description: error.message, color: 'error' })
      return { error }
    }

    toast.add({ title: 'Item atualizado', color: 'success' })
    await refreshChecklistCatalogCaches()
    return { error: null }
  }

  async function setChecklistCatalogItemAtivo(id: string, ativo: boolean) {
    const { error } = await supabase
      .from('checklist_template_itens')
      .update({ ativo })
      .eq('id', id)

    if (error) {
      toast.add({
        title: ativo ? 'Erro ao reativar item' : 'Erro ao desativar item',
        description: error.message,
        color: 'error'
      })
      return { error }
    }

    toast.add({
      title: ativo ? 'Item reativado' : 'Item desativado',
      color: 'success'
    })
    await refreshChecklistCatalogCaches()
    return { error: null }
  }

  async function importChecklistFromCatalog(checklistId: string) {
    const { data, error } = await supabase.rpc('importar_checklist_do_catalogo', {
      p_checklist_id: checklistId
    })

    if (error) {
      toast.add({ title: 'Erro ao importar catálogo', description: error.message, color: 'error' })
      return { imported: 0, error }
    }

    const imported = data ?? 0
    if (imported === 0) {
      toast.add({
        title: 'Nada a importar',
        description: 'O catálogo está vazio ou todos os itens já estão no checklist.',
        color: 'warning'
      })
    } else {
      toast.add({
        title: `${imported} item(ns) importado(s)`,
        color: 'success'
      })
    }

    return { imported, error: null }
  }

  return {
    createChecklistCatalogItem,
    updateChecklistCatalogItem,
    setChecklistCatalogItemAtivo,
    importChecklistFromCatalog
  }
}
