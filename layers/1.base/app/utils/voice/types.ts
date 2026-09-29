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
    | 'order.edit'
    | 'customer.edit'
    | 'vehicle.edit'
    | 'appointment.reschedule'
    | 'appointment.noShow'
    | 'navigate'

export type VoiceItemTipo = 'servico' | 'peca' | 'kit'
export type VoicePapel = 'recepcao' | 'mecanico' | 'gerente'
export type VoiceOrderStatus = 'aberta' | 'em_andamento' | 'concluida' | 'cancelada'
export type VoicePage = 'order-detail' | 'customer-detail' | 'vehicle-detail' | 'scheduling' | 'other'
export type VoiceNavTarget
  = | 'home' | 'orders' | 'scheduling' | 'customers' | 'vehicles'
    | 'finance' | 'team' | 'catalog' | 'suppliers' | 'pricing' | 'settings'

export interface VoiceContext {
  page: VoicePage
  today: string
}

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

export interface VoiceOrderEditPayload {
  target?: { placa?: string, numero?: string, clienteNome?: string }
  km_entrada?: number
  reclamacao?: string
  diagnostico?: string
  observacoes?: string
  status?: VoiceOrderStatus
  itens?: VoiceBudgetItemPayload[]
}

export interface VoiceCustomerEditPayload {
  target?: { nome?: string }
  telefones?: string[]
  emails?: string[]
  documento?: string
  observacoes?: string
}

export interface VoiceVehicleEditPayload {
  target?: { placa?: string }
  km_atual?: number
  cor?: string
  observacoes?: string
}

export interface VoiceAppointmentReschedulePayload {
  placa?: string
  date?: string
  startTime?: string
}

export interface VoiceAppointmentNoShowPayload {
  placa?: string
}

export interface VoiceNavigatePayload {
  to: VoiceNavTarget
  date?: string
}

export type VoiceBudgetItemDraft = VoiceBudgetItemPayload & { catalogItemId?: string }

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
  'order.edit': VoiceOrderEditPayload
  'customer.edit': VoiceCustomerEditPayload
  'vehicle.edit': VoiceVehicleEditPayload
  'appointment.reschedule': VoiceAppointmentReschedulePayload
  'appointment.noShow': VoiceAppointmentNoShowPayload
  'navigate': VoiceNavigatePayload
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
  'budgetItem.create': VoiceBudgetItemDraft & { orderId: string }
  'account.create': VoiceAccountPayload & { categoria_id?: string, fornecedor_id?: string }
  'catalogItem.create': VoiceCatalogItemPayload
  'supplier.create': VoiceSupplierPayload
  'collaborator.create': VoiceCollaboratorPayload
  'order.edit': Omit<VoiceOrderEditPayload, 'target' | 'itens'> & { orderId: string, item?: VoiceBudgetItemDraft }
  'customer.edit': Omit<VoiceCustomerEditPayload, 'target'> & { clienteId: string }
  'vehicle.edit': Omit<VoiceVehicleEditPayload, 'target'> & { veiculoId: string }
  'appointment.reschedule': { appointmentId: string, inicio: string, date?: string, startTime?: string }
  'appointment.noShow': { appointmentId: string, inicio: string }
  'navigate': VoiceNavigatePayload
}

export const VOICE_EXAMPLES: readonly string[] = [
  'Abre a OS do ABC1D23 e coloca no diagnóstico pastilha de freio gasta',
  'Cliente reclama de barulho na roda dianteira, km 45 mil (com a OS aberta)',
  'Adiciona duas pastilhas de freio a 150 reais cada',
  'Muda o status da OS para em andamento',
  'Nova OS para o ABC1D23, carro falhando na partida',
  'Novo cliente João da Silva, telefone 11 98888 7777',
  'Cadastra o veículo ABC1D23, Fiat Uno 2015 prata, do cliente João',
  'Atualiza o km do ABC1D23 para 52 mil',
  'Agenda o ABC1D23 amanhã às 14h para revisão',
  'Remarca o ABC1D23 para sexta às 10h',
  'Abre a agenda de amanhã',
  'Conta de energia de 350 reais vence dia 10'
]
