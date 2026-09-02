import type { Cliente, ClienteInsert, ClienteUpdate } from '~~/shared/types/database'
import { normalizeContactList } from '~~/shared/utils/contact'

export interface CustomerFormState {
  nome: string
  telefones: string[]
  emails: string[]
  documento: string
  observacoes: string
  ativo: boolean
}

export function emptyCustomerForm(): CustomerFormState {
  return {
    nome: '',
    telefones: [],
    emails: [],
    documento: '',
    observacoes: '',
    ativo: true
  }
}

export function customerFormFromRow(cliente: Cliente): CustomerFormState {
  return {
    nome: cliente.nome,
    telefones: [...(cliente.telefones || [])],
    emails: [...(cliente.emails || [])],
    documento: cliente.documento || '',
    observacoes: cliente.observacoes || '',
    ativo: cliente.ativo
  }
}

function trimOrNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed || null
}

export function customerFormToInsert(state: CustomerFormState): ClienteInsert {
  return {
    nome: state.nome.trim(),
    telefones: normalizeContactList(state.telefones),
    emails: normalizeContactList(state.emails),
    documento: trimOrNull(state.documento),
    observacoes: trimOrNull(state.observacoes),
    ativo: state.ativo
  }
}

export function customerFormToUpdate(state: CustomerFormState): ClienteUpdate {
  return customerFormToInsert(state)
}

export function isCustomerFormValid(state: CustomerFormState): boolean {
  return Boolean(state.nome.trim())
}
