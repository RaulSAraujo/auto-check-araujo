export type VoiceIntent
  = | 'customer.create'
    | 'vehicle.create'
    | 'order.create'
    | 'appointment.create'
    | 'budgetItem.create'
    | 'account.create'
    | 'catalogItem.create'
    | 'supplier.create'
    | 'collaborator.create'

export type VoiceItemTipo = 'servico' | 'peca' | 'kit'
export type VoicePapel = 'recepcao' | 'mecanico' | 'gerente'

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

export interface VoicePayloadMap {
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

export type VoiceCommand = {
  [K in VoiceIntent]: { intent: K, payload: VoicePayloadMap[K] }
}[VoiceIntent]

/** Payload já com ids resolvidos, entregue ao formulário de destino. */
export interface VoiceDraftMap {
  'customer.create': VoiceCustomerPayload
  'vehicle.create': VoiceVehiclePayload & { cliente_id?: string }
  'order.create': VoiceOrderPayload & { veiculo_id?: string }
  'appointment.create': VoiceAppointmentPayload & { veiculo_id?: string }
  'budgetItem.create': VoiceBudgetItemPayload & { orderId: string, catalogItemId?: string }
  'account.create': VoiceAccountPayload & { categoria_id?: string, fornecedor_id?: string }
  'catalogItem.create': VoiceCatalogItemPayload
  'supplier.create': VoiceSupplierPayload
  'collaborator.create': VoiceCollaboratorPayload
}

export const VOICE_EXAMPLES: readonly string[] = [
  'novo cliente João da Silva telefone 11 98888 7777',
  'novo veículo placa ABC1D23 marca Fiat modelo Uno ano 2015 cor prata cliente João',
  'nova OS placa ABC1D23 km 45000 reclamação barulho no freio',
  'agendar placa ABC1D23 amanhã às 14h problema revisão',
  'adicionar peça pastilha de freio quantidade 2 valor 150 reais',
  'nova conta energia valor 350 reais vencimento dia 10 categoria luz',
  'novo serviço alinhamento valor 80 reais',
  'novo fornecedor Auto Peças Silva telefone 11 3333 4444',
  'novo colaborador Pedro usuário pedro papel mecânico'
]
