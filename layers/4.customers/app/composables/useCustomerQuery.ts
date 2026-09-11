import type { Cliente } from '~~/shared/types/database'

export function useCustomerQuery(id: MaybeRefOrGetter<string>) {
  const supabase = useTypedSupabaseClient()

  return useAsyncData(
    () => `cliente-${toValue(id)}`,
    async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', toValue(id))
        .single()

      if (error) throw error
      return data as Cliente
    },
    { lazy: true }
  )
}
