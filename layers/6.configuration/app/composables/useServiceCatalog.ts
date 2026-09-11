export function useServiceCatalog() {
  const supabase = useTypedSupabaseClient()

  return useAsyncData('servicos-catalogo', async () => {
    const { data, error } = await supabase
      .from('servicos_catalogo')
      .select('id, nome, tipo, valor_padrao, custo, estoque, ativo')
      .eq('ativo', true)
      .order('nome')
      .limit(REPORT_SOFT_LIMIT)

    if (error) throw error
    return data
  }, { lazy: true })
}
