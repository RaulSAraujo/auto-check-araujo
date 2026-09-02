export function useServiceCatalog() {
  const supabase = useTypedSupabaseClient()

  return useAsyncData('servicos-catalogo', async () => {
    const { data, error } = await supabase
      .from('servicos_catalogo')
      .select('*')
      .eq('ativo', true)
      .order('nome')

    if (error) throw error
    return data
  })
}
