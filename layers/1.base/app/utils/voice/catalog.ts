import type { PermissionAction } from '../../../../2.auth/app/utils/permissions.ts'
import type { VoiceEntityKey, VoicePage } from './types.ts'

export type VoiceFieldType = 'text' | 'number' | 'money' | 'date' | 'month' | 'time' | 'bool' | 'enum' | 'placa' | 'digits' | 'email'
export type VoiceMerge = 'append' | 'replace' | 'add'
export type VoiceRefKind = 'vehicle' | 'customer' | 'supplier' | 'category' | 'catalogItem'

export interface VoiceField {
  type: VoiceFieldType
  /** Default: lists `add`, everything else `replace`. */
  merge?: VoiceMerge
  values?: readonly string[]
  list?: boolean
  /** Spoken name/plate resolved to an id before reaching the screen. */
  ref?: VoiceRefKind
  /** Key in the screen state. Default: the field name. */
  stateKey?: string
  min?: number
  /** number/money: max value; text: max length. */
  max?: number
  ops?: readonly ('create' | 'edit')[]
  /** Short hint for the AI prompt. */
  hint?: string
}

export interface VoiceAction {
  /** Absent: anyone who can open the screen (print, share). */
  permission?: PermissionAction
  /** `confirm`: one-tap confirmation, then runs. `direct`: runs at once (opens an existing dialog, local change, guidance). */
  kind: 'confirm' | 'direct'
  /** Confirmation title; `{label}` and `{<arg>}` are interpolated. */
  confirm?: string
  args?: Record<string, VoiceField>
  hint?: string
}

export interface VoiceEntity {
  label: string
  pages: readonly VoicePage[]
  target: Record<string, VoiceField>
  permission: { create?: PermissionAction, edit?: PermissionAction }
  fields: Record<string, VoiceField>
  items?: Record<string, VoiceField>
  actions: Record<string, VoiceAction>
}

const TIPOS = ['servico', 'peca', 'kit'] as const
const FORMAS = ['dinheiro', 'pix', 'cartao_credito', 'cartao_debito'] as const
const PAPEIS = ['recepcao', 'mecanico', 'gerente'] as const

export const FORMA_LABEL: Record<string, string> = {
  dinheiro: 'dinheiro', pix: 'Pix', cartao_credito: 'cartão de crédito', cartao_debito: 'cartão de débito'
}
export const PAPEL_LABEL: Record<string, string> = { recepcao: 'recepção', mecanico: 'mecânico', gerente: 'gerente' }

const text: VoiceField = { type: 'text' }
const longText: VoiceField = { type: 'text', merge: 'append' }
const money: VoiceField = { type: 'money' }
const number: VoiceField = { type: 'number' }
const percent: VoiceField = { type: 'number', hint: '%' }
const nome: Record<string, VoiceField> = { nome: text }

export const VOICE_CATALOG: Record<VoiceEntityKey, VoiceEntity> = {
  order: {
    label: 'OS',
    pages: ['order-detail', 'order-new'],
    target: { placa: { type: 'placa' }, numero: { type: 'digits' }, clienteNome: text },
    permission: { create: 'orders.create', edit: 'orders.edit' },
    fields: {
      veiculo: { type: 'placa', ref: 'vehicle', stateKey: 'veiculo_id', ops: ['create'] },
      km_entrada: number,
      reclamacao: { ...longText, hint: 'o que o cliente relata' },
      diagnostico: { ...longText, hint: 'o que o mecânico constatou' },
      observacoes: longText,
      status: { type: 'enum', values: ['aberta', 'em_andamento', 'concluida', 'cancelada'], ops: ['edit'] },
      pago: { type: 'bool', ops: ['edit'] },
      forma_pagamento: { type: 'enum', values: FORMAS, ops: ['edit'] },
      parcelas: { type: 'number', min: 1, max: 12, ops: ['edit'] },
      valor_cobrado: { ...money, ops: ['edit'] }
    },
    items: { tipo: { type: 'enum', values: TIPOS }, descricao: text, quantidade: number, valor_unitario: money },
    actions: {
      enviarAprovacao: { kind: 'confirm', permission: 'budget.edit', confirm: 'Enviar o orçamento da {label} para aprovação?' },
      aprovar: { kind: 'confirm', permission: 'budget.approve', confirm: 'Aprovar o orçamento da {label}?' },
      rejeitar: { kind: 'confirm', permission: 'budget.approve', confirm: 'Rejeitar o orçamento da {label}?' },
      removerItem: { kind: 'confirm', permission: 'budget.edit', confirm: 'Remover "{descricao}" do orçamento da {label}?', args: { descricao: text } },
      usarSugestao: { kind: 'direct', permission: 'orders.edit', hint: 'valor cobrado sugerido' },
      legendarFoto: { kind: 'confirm', permission: 'orders.edit', confirm: 'Salvar a legenda "{legenda}" na foto {numero}?', args: { numero: { type: 'number', min: 1 }, legenda: text } },
      removerFoto: { kind: 'confirm', permission: 'orders.edit', confirm: 'Remover a foto {numero} da {label}?', args: { numero: { type: 'number', min: 1 } } },
      adicionarFoto: { kind: 'direct', permission: 'orders.edit' },
      imprimir: { kind: 'direct', hint: 'imprimir o orçamento' },
      baixarPdf: { kind: 'direct', hint: 'baixar o PDF do orçamento' },
      enviarWhatsApp: { kind: 'direct', hint: 'mandar o orçamento no WhatsApp do cliente' }
    }
  },
  customer: {
    label: 'cliente',
    pages: ['customer-detail', 'customer-new'],
    target: nome,
    permission: { create: 'customers.write', edit: 'customers.write' },
    fields: {
      nome: text,
      telefones: { type: 'digits', list: true, hint: 'com DDD' },
      emails: { type: 'email', list: true },
      documento: { type: 'digits', hint: 'CPF/CNPJ' },
      observacoes: longText
    },
    actions: {
      desativar: { kind: 'confirm', permission: 'customers.write', confirm: 'Desativar o cliente {label}?' },
      reativar: { kind: 'confirm', permission: 'customers.write', confirm: 'Reativar o cliente {label}?' },
      excluir: { kind: 'direct', permission: 'customers.delete' }
    }
  },
  vehicle: {
    label: 'veículo',
    pages: ['vehicle-detail', 'vehicle-new'],
    target: { placa: { type: 'placa' } },
    permission: { create: 'vehicles.write', edit: 'vehicles.write' },
    fields: {
      placa: { type: 'placa' },
      marca: { ...text, hint: 'fabricante: Volkswagen, Fiat…' },
      modelo: { ...text, hint: 'Gol, Uno…' },
      ano: number,
      cor: text,
      km_atual: number,
      observacoes: longText,
      dono: { type: 'text', ref: 'customer', stateKey: 'cliente_id', hint: 'nome do cliente' }
    },
    actions: { excluir: { kind: 'direct', permission: 'vehicles.delete' } }
  },
  appointment: {
    label: 'agendamento',
    pages: ['scheduling'],
    target: { placa: { type: 'placa' } },
    permission: { create: 'scheduling.write', edit: 'scheduling.write' },
    fields: {
      veiculo: { type: 'placa', ref: 'vehicle', stateKey: 'veiculo_id' },
      date: { type: 'date' },
      startTime: { type: 'time' },
      problema: longText
    },
    actions: {
      faltou: { kind: 'direct', permission: 'scheduling.write', hint: 'cliente não compareceu' },
      desfazerFalta: { kind: 'confirm', permission: 'scheduling.write', confirm: 'Desfazer a falta do agendamento de {label}?' },
      abrirOS: { kind: 'direct', permission: 'orders.create', hint: 'abrir OS a partir do agendamento' }
    }
  },
  account: {
    label: 'conta a pagar',
    pages: ['finance'],
    target: { descricao: text },
    permission: { create: 'finance.view' },
    fields: {
      descricao: text,
      valor: money,
      vencimento: { type: 'date' },
      categoria: { type: 'text', ref: 'category', stateKey: 'categoria_id' },
      fornecedor: { type: 'text', ref: 'supplier', stateKey: 'fornecedor_id' },
      observacoes: longText
    },
    actions: {
      pagar: { kind: 'confirm', permission: 'finance.view', confirm: 'Marcar a conta {label} como paga ({forma})?', args: { forma: { type: 'enum', values: FORMAS } } },
      cancelar: { kind: 'confirm', permission: 'finance.view', confirm: 'Cancelar a conta {label}?' },
      reabrir: { kind: 'confirm', permission: 'finance.view', confirm: 'Reabrir a conta {label}?' },
      excluir: { kind: 'confirm', permission: 'finance.view', confirm: 'Excluir a conta {label}?' }
    }
  },
  category: {
    label: 'categoria financeira',
    pages: ['finance'],
    target: nome,
    // No voice form: the screen confirms create ("Criar a categoria X?") and rename before writing.
    permission: { create: 'finance.view', edit: 'finance.view' },
    fields: nome,
    actions: {
      ativar: { kind: 'confirm', permission: 'finance.view', confirm: 'Ativar a categoria {label}?' },
      desativar: { kind: 'confirm', permission: 'finance.view', confirm: 'Desativar a categoria {label}?' }
    }
  },
  catalogItem: {
    label: 'item do catálogo',
    pages: ['catalog'],
    target: nome,
    permission: { create: 'catalog.manage', edit: 'catalog.manage' },
    fields: {
      tipo: { type: 'enum', values: TIPOS },
      nome: text,
      horas_estimadas: number,
      nivel_tecnico: { type: 'enum', values: ['rapido', 'padrao', 'tecnico', 'especializado'] },
      usar_preco_sugerido: { type: 'bool' },
      valor_padrao: money,
      custo: money,
      estoque: number,
      fornecedor: { type: 'text', ref: 'supplier', stateKey: 'fornecedor_id' }
    },
    items: { item: { type: 'text', ref: 'catalogItem', stateKey: 'item_id', hint: 'item do kit' }, quantidade: { type: 'number', min: 1 } },
    actions: {
      desativar: { kind: 'confirm', permission: 'catalog.manage', confirm: 'Desativar o item {label}?' },
      reativar: { kind: 'confirm', permission: 'catalog.manage', confirm: 'Reativar o item {label}?' },
      excluir: { kind: 'direct', permission: 'catalog.manage' }
    }
  },
  supplier: {
    label: 'fornecedor',
    pages: ['suppliers'],
    target: nome,
    permission: { create: 'catalog.manage', edit: 'catalog.manage' },
    fields: { nome: text, telefone: { type: 'digits' }, email: { type: 'email' }, observacoes: longText },
    actions: {
      desativar: { kind: 'confirm', permission: 'catalog.manage', confirm: 'Desativar o fornecedor {label}?' },
      reativar: { kind: 'confirm', permission: 'catalog.manage', confirm: 'Reativar o fornecedor {label}?' },
      excluir: { kind: 'direct', permission: 'catalog.manage' }
    }
  },
  collaborator: {
    label: 'colaborador',
    pages: ['team'],
    target: nome,
    // Edit only changes the role, through the same confirmation as `trocarPapel`.
    permission: { create: 'collaborators.manage', edit: 'collaborators.manage' },
    fields: { nome: text, username: text, papel: { type: 'enum', values: PAPEIS } },
    actions: {
      trocarPapel: { kind: 'confirm', permission: 'collaborators.manage', confirm: 'Mudar o papel de {label} para {papel}?', args: { papel: { type: 'enum', values: PAPEIS } } },
      redefinirSenha: { kind: 'direct', permission: 'collaborators.manage' },
      excluir: { kind: 'direct', permission: 'collaborators.manage' }
    }
  },
  pricing: {
    label: 'precificação',
    pages: ['pricing'],
    target: {},
    permission: { edit: 'catalog.manage' },
    fields: {
      valor_hora: money,
      custo_fixo_mensal: money,
      margem_alvo: percent,
      horas_produtivas_mes: number,
      valor_minimo_servico: money,
      fator_servico_rapido: number,
      fator_servico_padrao: number,
      fator_servico_tecnico: number,
      fator_servico_especializado: number,
      markup_pecas: percent,
      precificacao_automatica: { type: 'bool' },
      taxa_cartao_debito: percent,
      taxa_cartao_credito: percent,
      acrescimo_cartao_credito_parcela: percent
    },
    actions: {}
  }
}

/** Confirmation title with `{label}` and `{arg}` filled; enum args use their Portuguese label. */
export function voiceConfirmText(template: string, values: Record<string, unknown>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = values[key]
    if (value === undefined || value === '') return '…'
    const s = String(value)
    if (Object.hasOwn(FORMA_LABEL, s)) return FORMA_LABEL[s]!
    return Object.hasOwn(PAPEL_LABEL, s) ? PAPEL_LABEL[s]! : s
  })
}
