import { foldText } from '../utils/voice/text'

export interface VoiceFound { id: string, label: string, inicio?: string }
type NamedKind = 'customer' | 'supplier' | 'category' | 'catalogItem'

const NAMED_TABLE = {
  customer: 'clientes',
  supplier: 'fornecedores',
  category: 'financeiro_categorias',
  catalogItem: 'servicos_catalogo'
} as const

function pickByName<T extends { id: string }>(rows: T[], name: string, labelOf: (row: T) => string): T | undefined {
  const target = foldText(name.trim())
  return rows.find(row => foldText(labelOf(row)) === target) ?? (rows.length === 1 ? rows[0] : undefined)
}

function dayMonth(isoDate: string): string {
  const [, m, d] = isoDate.split('-')
  return `${d}/${m}`
}

export function useVoiceLookup() {
  const supabase = useTypedSupabaseClient()

  async function findVehicle(placa: string): Promise<VoiceFound | undefined> {
    const { data, error } = await supabase.from('veiculos').select('id, placa').eq('placa', normalizePlaca(placa)).maybeSingle()
    return error || !data ? undefined : { id: data.id, label: formatPlaca(data.placa) }
  }

  async function findNamed(kind: NamedKind, name: string, options: { includeInactive?: boolean, tipo?: string } = {}): Promise<VoiceFound | undefined> {
    const pattern = ilikePattern(name)
    if (!pattern) return undefined
    let query = supabase.from(NAMED_TABLE[kind]).select('id, nome').ilike('nome', pattern)
    if (!options.includeInactive) query = query.eq('ativo', true)
    if (options.tipo) query = query.filter('tipo', 'eq', options.tipo)
    const { data, error } = await query.limit(5)
    if (error || !data) return undefined
    const row = pickByName(data, name, r => r.nome)
    return row && { id: row.id, label: row.nome }
  }

  async function findOrder(target: { placa?: string, numero?: string, clienteNome?: string }): Promise<VoiceFound | undefined> {
    if (target.numero) {
      const withYear = target.numero.match(/^(20\d{2})(\d{4,})$/)
      const query = supabase.from('ordens_servico').select('id, numero')
      const { data, error } = await (withYear
        ? query.eq('numero', `OS-${withYear[1]}-${withYear[2]}`)
        : query.like('numero', `OS-%-${target.numero.padStart(4, '0')}`))
        .order('aberta_em', { ascending: false })
        .limit(1)
      const row = error ? undefined : data?.[0]
      return row && { id: row.id, label: row.numero }
    }

    let vehicleIds: string[] = []
    if (target.placa) {
      const vehicle = await findVehicle(target.placa)
      if (vehicle) vehicleIds = [vehicle.id]
    } else if (target.clienteNome) {
      const customer = await findNamed('customer', target.clienteNome)
      if (customer) {
        const { data } = await supabase.from('veiculos').select('id').eq('cliente_id', customer.id)
        vehicleIds = (data ?? []).map(row => row.id)
      }
    }
    if (!vehicleIds.length) return undefined

    const { data, error } = await supabase
      .from('ordens_servico')
      .select('id, numero')
      .in('veiculo_id', vehicleIds)
      .in('status', ['aberta', 'em_andamento'])
      .order('aberta_em', { ascending: false })
      .limit(1)
    const row = error ? undefined : data?.[0]
    return row && { id: row.id, label: row.numero }
  }

  /** Next scheduled appointment of the vehicle, or its latest no-show when undoing one. */
  async function findAppointment(veiculoId: string, options: { noShow?: boolean } = {}): Promise<{ id: string, inicio: string } | undefined> {
    let query = supabase.from('agendamentos').select('id, inicio').eq('veiculo_id', veiculoId)
    if (options.noShow) {
      query = query.eq('status', 'nao_compareceu').order('inicio', { ascending: false })
    } else {
      const startOfToday = new Date()
      startOfToday.setHours(0, 0, 0, 0)
      query = query.in('status', ['agendado', 'confirmado']).gte('inicio', startOfToday.toISOString()).order('inicio', { ascending: true })
    }
    const { data, error } = await query.limit(1)
    return error ? undefined : data?.[0]
  }

  /** Open account due first; when reopening, the latest paid/cancelled one. */
  async function findAccount(descricao: string, options: { reopen?: boolean } = {}): Promise<VoiceFound | undefined> {
    const pattern = ilikePattern(descricao)
    if (!pattern) return undefined
    let query = supabase.from('financeiro_contas').select('id, descricao, vencimento').ilike('descricao', pattern)
    query = options.reopen
      ? query.neq('status', 'a_pagar').order('vencimento', { ascending: false })
      : query.eq('status', 'a_pagar').order('vencimento', { ascending: true })
    const { data, error } = await query.limit(5)
    if (error || !data?.length) return undefined
    const row = data.find(r => foldText(r.descricao) === foldText(descricao)) ?? data[0]!
    return { id: row.id, label: `${row.descricao} (venc. ${dayMonth(row.vencimento)})` }
  }

  async function findCollaborator(nome: string): Promise<VoiceFound | undefined> {
    const { data, error } = await supabase.rpc('list_collaborators')
    if (error || !data) return undefined
    const target = foldText(nome.trim())
    const matches = data.filter(row => foldText(row.nome).includes(target) || foldText(row.username) === target)
    const row = pickByName(matches, nome, r => r.nome)
    return row && { id: row.id, label: row.nome }
  }

  return { findVehicle, findNamed, findOrder, findAppointment, findAccount, findCollaborator }
}
