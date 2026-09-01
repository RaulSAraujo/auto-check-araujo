import type { Cliente } from '~~/shared/types/database'

export function useCustomerOptions(key = 'clientes-options') {
  const supabase = useTypedSupabaseClient()

  const { data: clientes } = useAsyncData(key, async () => {
    const { data, error } = await supabase
      .from('clientes')
      .select('id, nome')
      .order('nome', { ascending: true })

    if (error) throw error
    return data as Pick<Cliente, 'id' | 'nome'>[]
  })

  const clienteItems = computed(() =>
    (clientes.value || []).map(c => ({
      label: c.nome,
      value: c.id
    }))
  )

  return {
    clientes,
    clienteItems
  }
}
