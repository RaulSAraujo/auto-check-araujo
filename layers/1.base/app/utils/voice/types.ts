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
  /** Active catalog items as "Nome (tipo)", on the order screens. */
  catalog?: string[]
}

export type VoiceEntityKey
  = | 'order' | 'customer' | 'vehicle' | 'appointment' | 'account'
    | 'category' | 'catalogItem' | 'supplier' | 'collaborator' | 'pricing'

export type VoiceOp = 'create' | 'edit' | 'action' | 'navigate' | 'ask'
export type VoiceValue = string | number | boolean | string[]
export type VoiceRecord = Record<string, VoiceValue>

export interface VoiceCommand {
  op: VoiceOp
  /** Absent for `navigate` and `ask`. */
  entity?: VoiceEntityKey
  target?: Record<string, string>
  fields?: VoiceRecord
  items?: VoiceRecord[]
  action?: string
  args?: VoiceRecord
  to?: VoiceNavTarget
  /** navigate: list controls declared in VOICE_VIEWS. */
  query?: Record<string, string>
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
  'Abre a OS do ABC1D23',
  'Diagnóstico … / Reclamação … / Observação … (com a OS aberta)',
  'Coloca alinhamento e balanceamento (com a OS aberta)',
  'Nova OS para o ABC1D23',
  'Agenda o ABC1D23 sexta às 9h',
  'Novo cliente …, telefone …',
  'Mostra as OS abertas',
  'Quanto faturei este mês?'
]
