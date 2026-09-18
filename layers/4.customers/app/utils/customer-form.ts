import type { Cliente, ClienteInsert, ClienteUpdate } from '~~/shared/types/database'
import { normalizeContactList } from '~~/shared/utils/contact'
import { sentenceCaseOrNull, toTitleCasePt } from '~~/shared/utils/text-case'

export interface CustomerFormState {
  nome: string
  telefones: string[]
  emails: string[]
  documento: string
  observacoes: string
  ativo: boolean
}

export type CustomerFormFieldName
  = | 'nome'
    | 'telefones'
    | 'emails'
    | 'documento'
    | 'observacoes'

export interface CustomerFormFieldError {
  name: CustomerFormFieldName | `telefones.${number}` | `emails.${number}`
  message: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
    telefones: normalizeContactList((cliente.telefones || []).map(formatPhoneBr)),
    emails: normalizeContactList(cliente.emails || []),
    documento: formatDocumento(cliente.documento || ''),
    observacoes: cliente.observacoes || '',
    ativo: cliente.ativo
  }
}

function trimOrNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed || null
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

export function formatPhoneBr(value: string): string {
  const digits = digitsOnly(value).slice(0, 11)
  if (!digits) return ''

  const ddd = digits.slice(0, 2)
  if (digits.length <= 2) return `(${ddd}`

  const rest = digits.slice(2)
  if (digits.length <= 6) return `(${ddd}) ${rest}`

  if (digits.length <= 10) {
    return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`
  }

  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`
}

export function formatDocumento(value: string): string {
  const digits = digitsOnly(value).slice(0, 14)

  if (digits.length <= 11) {
    const p1 = digits.slice(0, 3)
    const p2 = digits.slice(3, 6)
    const p3 = digits.slice(6, 9)
    const p4 = digits.slice(9, 11)
    if (digits.length <= 3) return p1
    if (digits.length <= 6) return `${p1}.${p2}`
    if (digits.length <= 9) return `${p1}.${p2}.${p3}`
    return `${p1}.${p2}.${p3}-${p4}`
  }

  const p1 = digits.slice(0, 2)
  const p2 = digits.slice(2, 5)
  const p3 = digits.slice(5, 8)
  const p4 = digits.slice(8, 12)
  const p5 = digits.slice(12, 14)
  if (digits.length <= 5) return `${p1}.${p2}`
  if (digits.length <= 8) return `${p1}.${p2}.${p3}`
  if (digits.length <= 12) return `${p1}.${p2}.${p3}/${p4}`
  return `${p1}.${p2}.${p3}/${p4}-${p5}`
}

function isFilledPhone(value: string): boolean {
  return digitsOnly(value).length > 0
}

function isValidPhone(value: string): boolean {
  const digits = digitsOnly(value)
  return digits.length >= 10 && digits.length <= 11
}

function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim())
}

function isValidDocumento(value: string): boolean {
  const digits = digitsOnly(value)
  return digits.length === 11 || digits.length === 14
}

export function customerFormToInsert(state: CustomerFormState): ClienteInsert {
  return {
    nome: toTitleCasePt(state.nome),
    telefones: normalizeContactList(state.telefones.map(formatPhoneBr)),
    emails: normalizeContactList(state.emails),
    documento: trimOrNull(formatDocumento(state.documento)),
    observacoes: sentenceCaseOrNull(state.observacoes),
    ativo: state.ativo
  }
}

export function customerFormToUpdate(state: CustomerFormState): ClienteUpdate {
  return customerFormToInsert(state)
}

export function validateCustomerForm(
  state: Partial<CustomerFormState>
): CustomerFormFieldError[] {
  const errors: CustomerFormFieldError[] = []

  if (!state.nome?.trim()) {
    errors.push({
      name: 'nome',
      message: 'Digite o nome do cliente'
    })
  }

  const phones = state.telefones || []
  phones.forEach((phone, index) => {
    if (!isFilledPhone(phone)) return
    if (isValidPhone(phone)) return
    errors.push({
      name: index === 0 ? 'telefones' : `telefones.${index}`,
      message: 'Telefone incompleto. Use DDD + número'
    })
  })

  const emails = state.emails || []
  emails.forEach((email, index) => {
    const trimmed = email.trim()
    if (!trimmed) return
    if (isValidEmail(trimmed)) return
    errors.push({
      name: index === 0 ? 'emails' : `emails.${index}`,
      message: 'E-mail inválido. Confira o formato'
    })
  })

  if (state.documento?.trim() && !isValidDocumento(state.documento)) {
    errors.push({
      name: 'documento',
      message: 'Documento incompleto. CPF tem 11 dígitos; CNPJ, 14'
    })
  }

  return errors
}

export function isCustomerFormValid(state: CustomerFormState): boolean {
  return validateCustomerForm(state).length === 0
}

function sameContacts(a: string[], b: string[]): boolean {
  return JSON.stringify(normalizeContactList(a)) === JSON.stringify(normalizeContactList(b))
}

export function isCustomerFormDirty(
  state: CustomerFormState,
  initial: CustomerFormState = emptyCustomerForm()
): boolean {
  return (
    state.nome.trim() !== initial.nome.trim()
    || !sameContacts(state.telefones, initial.telefones)
    || !sameContacts(state.emails, initial.emails)
    || digitsOnly(state.documento) !== digitsOnly(initial.documento)
    || state.observacoes.trim() !== initial.observacoes.trim()
    || state.ativo !== initial.ativo
  )
}
