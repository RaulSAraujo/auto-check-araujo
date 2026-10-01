import type { VoiceField } from './catalog.ts'
import type { VoiceNavTarget } from './types.ts'

const q: VoiceField = { type: 'text', max: 100, hint: 'busca' }
const oneOf = (...values: string[]): VoiceField => ({ type: 'enum', values })

/** List controls each screen keeps in the URL query; voice navigates with them. */
export const VOICE_VIEWS: Partial<Record<VoiceNavTarget, Record<string, VoiceField>>> = {
  orders: { q, status: oneOf('all', 'aberta', 'em_andamento', 'concluida', 'cancelada') },
  customers: { q, status: oneOf('ativos', 'inativos', 'all') },
  vehicles: { q: { ...q, hint: 'placa' } },
  scheduling: { q, filtro: oneOf('all', 'agendados', 'nao_compareceu'), vista: oneOf('daily', 'week'), dia: { type: 'date' } },
  finance: { aba: oneOf('resumo', 'contas', 'recebiveis'), mes: { type: 'month' }, contas: oneOf('a_pagar', 'pagas', 'vencidas', 'todas') },
  catalog: { q, tipo: oneOf('all', 'servico', 'peca', 'kit') },
  suppliers: { q }
}
