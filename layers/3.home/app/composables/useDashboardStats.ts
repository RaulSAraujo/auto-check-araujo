export type DashboardStats = {
  clientes: number
  veiculos: number
  os_abertas: number
  os_andamento: number
}

export async function useDashboardStats() {
  const supabase = useTypedSupabaseClient()

  const { data: stats, pending } = await useAsyncData('dashboard-stats', async () => {
    const { data, error } = await supabase.rpc('dashboard_stats')
    if (error) throw error
    return data as DashboardStats
  })

  const osAbertas = computed(() => stats.value?.os_abertas ?? 0)
  const osAndamento = computed(() => stats.value?.os_andamento ?? 0)
  const clientesCount = computed(() => stats.value?.clientes ?? 0)
  const veiculosCount = computed(() => stats.value?.veiculos ?? 0)

  return {
    stats,
    pending,
    osAbertas,
    osAndamento,
    clientesCount,
    veiculosCount
  }
}
