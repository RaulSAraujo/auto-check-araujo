import type { CatalogItemDraft, CatalogItemRow, CatalogKitDraftLine, CatalogTipoFilter } from '../utils/catalog'
import { stockForTipo } from '../utils/catalog'
import { toTitleCasePt } from '~~/shared/utils/text-case'

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
  horas_estimadas,
  nivel_tecnico,
  preco_manual,
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
  const isService = tipo === 'servico'
  return {
    nome: toTitleCasePt(draft.nome),
    tipo,
    valor_padrao: draft.valor_padrao,
    custo: isService ? 0 : draft.custo,
    estoque: stockForTipo(tipo, draft.estoque),
    fornecedor_id: draft.fornecedor_id || null,
    horas_estimadas: isService
      ? (draft.horas_estimadas == null || draft.horas_estimadas <= 0
          ? null
          : draft.horas_estimadas)
      : null,
    nivel_tecnico: isService ? draft.nivel_tecnico : 'padrao',
    preco_manual: isService ? draft.preco_manual : false
  }
}

export function useCatalogList(
  initialTipo: CatalogTipoFilter = 'all'
) {
  const supabase = useTypedSupabaseClient()
  const router = useRouter()
  const route = useRoute()

  const q = ref('')
  const debouncedQ = ref('')
  const tipoFilter = ref<CatalogTipoFilter>(initialTipo)

  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  watch(q, (value) => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      debouncedQ.value = value
    }, SEARCH_DEBOUNCE_MS)
  })

  const { page, pageSize, rangeBounds } = useListPagination(
    [tipoFilter, debouncedQ],
    REPORT_PAGE_SIZE
  )

  const { data, pending, status, refresh, error } = useAsyncData(
    CATALOG_LIST_KEY,
    async () => {
      const { from, to } = rangeBounds()
      const pattern = ilikePattern(debouncedQ.value)

      let query = supabase
        .from('servicos_catalogo')
        .select(CATALOG_SELECT, { count: 'exact' })
        .order('ativo', { ascending: false })
        .order('nome')
        .range(from, to)

      if (tipoFilter.value !== 'all') {
        query = query.eq('tipo', tipoFilter.value)
      }

      if (pattern) {
        query = query.ilike('nome', pattern)
      }

      const { data: rows, count, error: fetchError } = await query
      if (fetchError) throw fetchError

      return {
        items: (rows || []) as CatalogItemRow[],
        total: count ?? 0
      }
    },
    { watch: [tipoFilter, debouncedQ, page], lazy: true }
  )

  watch(tipoFilter, (value) => {
    const nextQuery = { ...route.query } as Record<string, string | undefined>
    if (value === 'all') delete nextQuery.tipo
    else nextQuery.tipo = value
    router.replace({ query: nextQuery })
  })

  /** A row outside the current page/filters (voice edit by id). */
  async function fetchItem(id: string) {
    const { data: row } = await supabase
      .from('servicos_catalogo')
      .select(CATALOG_SELECT)
      .eq('id', id)
      .maybeSingle()
    return row as CatalogItemRow | null
  }

  return {
    q,
    tipoFilter,
    items: computed(() => data.value?.items ?? []),
    page,
    pageSize,
    total: computed(() => data.value?.total ?? 0),
    pending,
    status,
    refresh,
    error,
    fetchItem
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

  async function deleteCatalogItem(id: string) {
    const { count, error: countError } = await supabase
      .from('catalogo_kit_itens')
      .select('id', { count: 'exact', head: true })
      .eq('item_id', id)

    if (countError) {
      toast.add({ title: 'Erro ao excluir', description: countError.message, color: 'error' })
      return { error: countError, blocked: false }
    }

    if ((count ?? 0) > 0) {
      toast.add({
        title: 'Não é possível excluir',
        description: 'Este item faz parte de um ou mais kits. Remova-o dos kits antes de excluí-lo.',
        color: 'warning'
      })
      return { error: null, blocked: true }
    }

    const { error } = await supabase
      .from('servicos_catalogo')
      .delete()
      .eq('id', id)

    if (error) {
      toast.add({ title: 'Erro ao excluir', description: error.message, color: 'error' })
      return { error, blocked: false }
    }

    toast.add({ title: 'Item excluído', color: 'success' })
    await refreshCatalogCaches()
    return { error: null, blocked: false }
  }

  return {
    createCatalogItem,
    updateCatalogItem,
    setCatalogItemAtivo,
    deleteCatalogItem
  }
}
