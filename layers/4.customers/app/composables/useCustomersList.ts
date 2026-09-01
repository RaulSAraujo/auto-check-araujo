import type { Cliente } from '~~/shared/types/database'

export async function useCustomersList() {
  const supabase = useTypedSupabaseClient()

  const q = ref('')
  const debouncedQ = ref('')
  const { page, pageSize, rangeBounds } = useListPagination([debouncedQ])

  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  watch(q, (value) => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      debouncedQ.value = value
    }, 300)
  })

  const { data, pending } = await useAsyncData(
    'clientes-list',
    async () => {
      const { from, to } = rangeBounds()
      const pattern = ilikePattern(debouncedQ.value)

      let query = supabase
        .from('clientes')
        .select('*', { count: 'exact' })
        .order('nome', { ascending: true })
        .range(from, to)

      if (pattern) {
        query = query.or(`nome.ilike.${pattern},telefone.ilike.${pattern},documento.ilike.${pattern},email.ilike.${pattern}`)
      }

      const { data: rows, count, error } = await query
      if (error) throw error

      return {
        items: (rows || []) as Cliente[],
        total: count ?? 0
      }
    },
    { watch: [debouncedQ, page] }
  )

  const clientes = computed(() => data.value?.items ?? [])
  const total = computed(() => data.value?.total ?? 0)

  return {
    q,
    page,
    pageSize,
    total,
    clientes,
    pending
  }
}
