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

  return { findVehicleIdByPlaca, findUniqueIdByName }
}
