import type { VoiceItemTipo, VoicePapel } from './types.ts'

export type LegacyVoiceIntent
  = | 'customer.create'
    | 'vehicle.create'
    | 'order.create'
    | 'appointment.create'
    | 'budgetItem.create'
    | 'account.create'
    | 'catalogItem.create'
    | 'supplier.create'
    | 'collaborator.create'

export interface VoiceCustomerPayload {
  nome?: string
  telefones?: string[]
  emails?: string[]
  documento?: string
  observacoes?: string
}

export interface VoiceVehiclePayload {
  placa?: string
  marca?: string
  modelo?: string
  ano?: number
  cor?: string
  km_atual?: number
  observacoes?: string
  clienteNome?: string
}

export interface VoiceOrderPayload {
  placa?: string
  km_entrada?: number
  reclamacao?: string
  diagnostico?: string
  observacoes?: string
}

export interface VoiceAppointmentPayload {
  placa?: string
  date?: string
  startTime?: string
  problema?: string
}

export interface VoiceBudgetItemPayload {
  tipo: VoiceItemTipo
  descricao?: string
  quantidade?: number
  valor_unitario?: number
}

export interface VoiceAccountPayload {
  descricao?: string
  valor?: number
  vencimento?: string
  categoriaNome?: string
  fornecedorNome?: string
  observacoes?: string
}

export interface VoiceCatalogItemPayload {
  tipo: VoiceItemTipo
  nome?: string
  valor_padrao?: number
  custo?: number
  estoque?: number
  horas_estimadas?: number
}

export interface VoiceSupplierPayload {
  nome?: string
  telefone?: string
  email?: string
  observacoes?: string
}

export interface VoiceCollaboratorPayload {
  nome?: string
  username?: string
  papel?: VoicePapel
}

export interface LegacyVoicePayloadMap {
  'customer.create': VoiceCustomerPayload
  'vehicle.create': VoiceVehiclePayload
  'order.create': VoiceOrderPayload
  'appointment.create': VoiceAppointmentPayload
  'budgetItem.create': VoiceBudgetItemPayload
  'account.create': VoiceAccountPayload
  'catalogItem.create': VoiceCatalogItemPayload
  'supplier.create': VoiceSupplierPayload
  'collaborator.create': VoiceCollaboratorPayload
}

export type LegacyVoiceCommand = {
  [K in LegacyVoiceIntent]: { intent: K, payload: LegacyVoicePayloadMap[K] }
}[LegacyVoiceIntent]
