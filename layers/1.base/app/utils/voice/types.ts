export type VoiceItemTipo = 'servico' | 'peca' | 'kit'
export type VoicePapel = 'recepcao' | 'mecanico' | 'gerente'
export type VoicePage
  = | 'order-detail' | 'order-new'
    | 'customer-detail' | 'customer-new'
    | 'vehicle-detail' | 'vehicle-new'
    | 'scheduling' | 'finance' | 'catalog' | 'suppliers' | 'team' | 'pricing'
    | 'other'

export type VoiceNavTarget
  = | 'home' | 'orders' | 'scheduling' | 'customers' | 'vehicles'
    | 'finance' | 'team' | 'catalog' | 'suppliers' | 'pricing' | 'settings'

export interface VoiceContext {
  page: VoicePage
  today: string
}

export type VoiceEntityKey
  = | 'order' | 'customer' | 'vehicle' | 'appointment' | 'account'
    | 'category' | 'catalogItem' | 'supplier' | 'collaborator' | 'pricing'

export type VoiceOp = 'create' | 'edit' | 'action' | 'navigate'
export type VoiceValue = string | number | boolean | string[]
export type VoiceRecord = Record<string, VoiceValue>

export interface VoiceCommand {
  op: VoiceOp
  /** Absent only for `navigate`. */
  entity?: VoiceEntityKey
  target?: Record<string, string>
  fields?: VoiceRecord
  items?: VoiceRecord[]
  action?: string
  args?: VoiceRecord
  to?: VoiceNavTarget
  date?: string
}

export interface VoiceBudgetItemDraft {
  tipo: VoiceItemTipo
  descricao?: string
  quantidade?: number
  valor_unitario?: number
  catalogItemId?: string
}

/** Command with target and refs resolved, handed to the destination screen. */
export interface VoiceDraft {
  entity: VoiceEntityKey
  op: 'create' | 'edit' | 'action'
  id?: string
  label?: string
  fields: VoiceRecord
  items?: VoiceRecord[]
  action?: string
  args?: VoiceRecord
  /** Appointment start, used by the agenda to select the day. */
  inicio?: string
}

export const VOICE_EXAMPLES: readonly string[] = [
  'Abre a OS do ABC1D23 e coloca no diagnóstico pastilha de freio gasta',
  'Cliente reclama de barulho na roda dianteira, km 45 mil (com a OS aberta)',
  'Adiciona duas pastilhas de freio a 150 reais cada e mão de obra de 80',
  'Pagamento no Pix em 3 vezes (com a OS aberta)',
  'Aprova o orçamento da OS do ABC1D23',
  'Nova OS para o ABC1D23, carro falhando na partida',
  'Novo cliente João da Silva, telefone 11 98888 7777',
  'Muda o dono do ABC1D23 para Maria Souza',
  'Remarca o ABC1D23 para sexta às 10h',
  'A conta de energia foi paga no Pix',
  'Desativa o fornecedor Auto Peças Silva',
  'O custo da hora é 120 reais'
]
