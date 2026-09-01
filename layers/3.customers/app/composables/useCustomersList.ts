import type { Cliente } from '~~/shared/types/database'

export function useCustomersList() {
  const supabase = useTypedSupabaseClient()

  const q = ref('')
  const debouncedQ = ref('')

  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  watch(q, (value) => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      debouncedQ.value = value
    }, 300)
  })

  const { data: clientes, pending } = useAsyncData(
    'clientes-list',
    async () => {
      let query = supabase
        .from('clientes')
        .select('*')
        .order('nome', { ascending: true })

      const term = debouncedQ.value.trim()
      if (term) {
        query = query.or(`nome.ilike.%${term}%,telefone.ilike.%${term}%,documento.ilike.%${term}%,email.ilike.%${term}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Cliente[]
    },
    { watch: [debouncedQ] }
  )

  return {
    q,
    clientes,
    pending
  }
}
