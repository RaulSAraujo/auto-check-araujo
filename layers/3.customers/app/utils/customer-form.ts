import type { Cliente, ClienteInsert, ClienteUpdate } from '~~/shared/types/database'

export interface CustomerFormState {
  nome: string
  telefone: string
  email: string
  documento: string
  observacoes: string
}

export function emptyCustomerForm(): CustomerFormState {
  return {
    nome: '',
    telefone: '',
    email: '',
    documento: '',
    observacoes: ''
  }
}

export function customerFormFromRow(cliente: Cliente): CustomerFormState {
  return {
    nome: cliente.nome,
    telefone: cliente.telefone || '',
    email: cliente.email || '',
    documento: cliente.documento || '',
    observacoes: cliente.observacoes || ''
  }
}

function trimOrNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed || null
}

export function customerFormToInsert(state: CustomerFormState): ClienteInsert {
  return {
    nome: state.nome.trim(),
    telefone: trimOrNull(state.telefone),
    email: trimOrNull(state.email),
    documento: trimOrNull(state.documento),
    observacoes: trimOrNull(state.observacoes)
  }
}

export function customerFormToUpdate(state: CustomerFormState): ClienteUpdate {
  return customerFormToInsert(state)
}

export function isCustomerFormValid(state: CustomerFormState): boolean {
  return Boolean(state.nome.trim())
}
