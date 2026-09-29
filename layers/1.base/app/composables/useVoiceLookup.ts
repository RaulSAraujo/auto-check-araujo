import { foldText } from '../utils/voice/text'

type VoiceLookupTable = 'clientes' | 'fornecedores' | 'financeiro_categorias' | 'servicos_catalogo'

export function useVoiceLookup() {
  const supabase = useTypedSupabaseClient()

  async function findVehicleIdByPlaca(placa: string): Promise<string | undefined> {
    const { data, error } = await supabase
      .from('veiculos')
      .select('id')
      .eq('placa', normalizePlaca(placa))
      .maybeSingle()
    if (error) return undefined
    return data?.id
  }

  async function findUniqueIdByName(
    table: VoiceLookupTable,
    name: string,
    filters?: { tipo?: string }
  ): Promise<string | undefined> {
    const pattern = ilikePattern(name)
    if (!pattern) return undefined

    let query = supabase
      .from(table)
      .select('id, nome')
      .eq('ativo', true)
      .ilike('nome', pattern)
    if (filters?.tipo) query = query.filter('tipo', 'eq', filters.tipo)

    const { data, error } = await query.limit(5)
    if (error || !data) return undefined

    const target = foldText(name)
    const exact = data.find(row => foldText(row.nome) === target)
    if (exact) return exact.id
    return data.length === 1 ? data[0]?.id : undefined
  }

  async function findOrderId(target: { placa?: string, numero?: string, clienteNome?: string }): Promise<string | undefined> {
    if (target.numero) {
      const { data, error } = await supabase
        .from('ordens_servico')
        .select('id')
        .like('numero', `OS-%-${target.numero.padStart(4, '0')}`)
        .order('aberta_em', { ascending: false })
        .limit(1)
      return error ? undefined : data?.[0]?.id
    }

    let vehicleIds: string[] = []
    if (target.placa) {
      const id = await findVehicleIdByPlaca(target.placa)
      if (id) vehicleIds = [id]
    } else if (target.clienteNome) {
      const clienteId = await findUniqueIdByName('clientes', target.clienteNome)
      if (clienteId) {
        const { data } = await supabase.from('veiculos').select('id').eq('cliente_id', clienteId)
        vehicleIds = (data ?? []).map(row => row.id)
      }
    }
    if (!vehicleIds.length) return undefined

    const { data, error } = await supabase
      .from('ordens_servico')
      .select('id')
      .in('veiculo_id', vehicleIds)
      .in('status', ['aberta', 'em_andamento'])
      .order('aberta_em', { ascending: false })
      .limit(1)
    return error ? undefined : data?.[0]?.id
  }

  async function findNextAppointment(veiculoId: string): Promise<{ id: string, inicio: string } | undefined> {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const { data, error } = await supabase
      .from('agendamentos')
      .select('id, inicio')
      .eq('veiculo_id', veiculoId)
      .in('status', ['agendado', 'confirmado'])
      .gte('inicio', startOfToday.toISOString())
      .order('inicio', { ascending: true })
      .limit(1)
    return error ? undefined : data?.[0]
  }

  return { findVehicleIdByPlaca, findUniqueIdByName, findOrderId, findNextAppointment }
}
