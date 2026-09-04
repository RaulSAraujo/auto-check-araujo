import type { CatalogItemDraft, CatalogItemRow, CatalogKitDraftLine, CatalogTipoFilter } from '../utils/catalog'
import { stockForTipo } from '../utils/catalog'

const CATALOG_LIST_KEY = 'catalog-list'
const CATALOG_ACTIVE_KEY = 'servicos-catalogo'

const CATALOG_SELECT = `
  id,
  nome,
  tipo,
  valor_padrao,
  custo,
  estoque,
  ativo,
  fornecedor_id,
  created_at,
  fornecedores ( id, nome ),
  catalogo_kit_itens!catalogo_kit_itens_kit_id_fkey (
    id,
    kit_id,
    item_id,
    quantidade,
    item:servicos_catalogo!catalogo_kit_itens_item_id_fkey ( id, nome, tipo )
  )
`

function toCatalogPayload(draft: CatalogItemDraft) {
  const tipo = draft.tipo
  return {
    nome: draft.nome.trim(),
    tipo,
    valor_padrao: draft.valor_padrao,
    custo: draft.custo,
    estoque: stockForTipo(tipo, draft.estoque),
    fornecedor_id: draft.fornecedor_id || null
  }
}

export function useCatalogList(
  tipoFilter: Ref<CatalogTipoFilter> = ref('all')
) {
  const supabase = useTypedSupabaseClient()
  const { page, pageSize, rangeBounds } = useListPagination(
    [tipoFilter],
    REPORT_PAGE_SIZE
  )

  const { data, pending, refresh, error } = useAsyncData(
    CATALOG_LIST_KEY,
    async () => {
      const { from, to } = rangeBounds()

      let query = supabase
        .from('servicos_catalogo')
        .select(CATALOG_SELECT, { count: 'exact' })
        .order('ativo', { ascending: false })
        .order('nome')
        .range(from, to)

      if (tipoFilter.value !== 'all') {
        query = query.eq('tipo', tipoFilter.value)
      }

      const { data: rows, count, error: fetchError } = await query
      if (fetchError) throw fetchError

      return {
        items: (rows || []) as CatalogItemRow[],
        total: count ?? 0
      }
    },
    { watch: [tipoFilter, page] }
  )

  return {
    items: computed(() => data.value?.items ?? []),
    page,
    pageSize,
    total: computed(() => data.value?.total ?? 0),
    pending,
    refresh,
    error
  }
}

async function replaceKitItems(
  supabase: ReturnType<typeof useTypedSupabaseClient>,
  kitId: string,
  lines: CatalogKitDraftLine[]
) {
  const { error: deleteError } = await supabase
    .from('catalogo_kit_itens')
    .delete()
    .eq('kit_id', kitId)

  if (deleteError) return deleteError

  if (!lines.length) return null

  const { error: insertError } = await supabase
    .from('catalogo_kit_itens')
    .insert(lines.map(line => ({
      kit_id: kitId,
      item_id: line.item_id,
      quantidade: line.quantidade
    })))

  return insertError
}

export function useCatalogMutations() {
  const supabase = useTypedSupabaseClient()
  const toast = useToast()

  async function refreshCatalogCaches() {
    await refreshNuxtData([CATALOG_LIST_KEY, CATALOG_ACTIVE_KEY])
  }

  async function createCatalogItem(draft: CatalogItemDraft) {
    const { data, error } = await supabase
      .from('servicos_catalogo')
      .insert(toCatalogPayload(draft))
      .select('id')
      .single()

    if (error) {
      toast.add({ title: 'Erro ao adicionar item', description: error.message, color: 'error' })
      return { error }
    }

    if (draft.tipo === 'kit' && data?.id) {
      const kitError = await replaceKitItems(supabase, data.id, draft.kit_itens)
      if (kitError) {
        toast.add({
          title: 'Item criado, mas falhou a composição do kit',
          description: kitError.message,
          color: 'warning'
        })
        await refreshCatalogCaches()
        return { error: kitError }
      }
    }

    toast.add({ title: 'Item adicionado ao catálogo', color: 'success' })
    await refreshCatalogCaches()
    return { error: null }
  }

  async function updateCatalogItem(id: string, draft: CatalogItemDraft) {
    const { error } = await supabase
      .from('servicos_catalogo')
      .update(toCatalogPayload(draft))
      .eq('id', id)

    if (error) {
      toast.add({ title: 'Erro ao salvar item', description: error.message, color: 'error' })
      return { error }
    }

    if (draft.tipo === 'kit') {
      const kitError = await replaceKitItems(supabase, id, draft.kit_itens)
      if (kitError) {
        toast.add({
          title: 'Dados salvos, mas falhou a composição do kit',
          description: kitError.message,
          color: 'warning'
        })
        await refreshCatalogCaches()
        return { error: kitError }
      }
    } else {
      await supabase.from('catalogo_kit_itens').delete().eq('kit_id', id)
    }

    toast.add({ title: 'Item atualizado', color: 'success' })
    await refreshCatalogCaches()
    return { error: null }
  }

  async function setCatalogItemAtivo(id: string, ativo: boolean) {
    const { error } = await supabase
      .from('servicos_catalogo')
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
    await refreshCatalogCaches()
    return { error: null }
  }

  return {
    createCatalogItem,
    updateCatalogItem,
    setCatalogItemAtivo
  }
}
