import {
  foldText,
  joinRaw,
  parseDate,
  parseDigits,
  parseEmail,
  parseMoney,
  parseNumber,
  parsePlaca,
  parseTime,
  readPlaca,
  tokenize
} from './text.ts'
import type { VoiceToken } from './text.ts'
import type { VoiceCommand, VoiceIntent, VoiceItemTipo, VoicePapel } from './types.ts'

type Value = string | number | undefined
type Extractor = (tokens: VoiceToken[], now: Date) => Value

interface Trigger { words: string[], intent: VoiceIntent, tipo?: VoiceItemTipo }
interface FieldSpec { keys: string[], extract: Extractor, list?: boolean }
interface Segment { field: string, tokens: VoiceToken[] }
interface IntentSpec {
  defaultField?: string
  fields: Record<string, FieldSpec>
  extra?: (segments: Segment[], now: Date) => Record<string, Value>
}

const ITEM_TIPOS: Record<string, VoiceItemTipo> = { peca: 'peca', servico: 'servico', kit: 'kit' }

const phrases = (intent: VoiceIntent, list: string[]): Trigger[] =>
  list.map(phrase => ({ words: phrase.split(' '), intent }))

const combos = (intent: VoiceIntent, verbs: string[], nouns: Record<string, VoiceItemTipo>): Trigger[] =>
  verbs.flatMap(verb => Object.entries(nouns).map(([noun, tipo]) => ({ words: [verb, noun], intent, tipo })))

const TRIGGERS: Trigger[] = [
  ...phrases('customer.create', ['novo cliente', 'nova cliente', 'cliente novo', 'cadastrar cliente', 'cadastra cliente', 'criar cliente']),
  ...phrases('vehicle.create', [
    'novo veiculo', 'novo carro', 'nova moto', 'cadastrar veiculo', 'cadastra veiculo', 'criar veiculo', 'cadastrar carro', 'cadastra carro'
  ]),
  ...phrases('order.create', [
    'nova ordem de servico', 'nova ordem', 'nova os', 'abrir ordem de servico', 'abre ordem de servico',
    'abrir ordem', 'abre ordem', 'abrir os', 'abre os', 'criar os'
  ]),
  ...phrases('appointment.create', ['novo agendamento', 'criar agendamento', 'agendar', 'marcar']),
  ...combos('budgetItem.create', ['adicionar', 'adiciona', 'incluir', 'inclui', 'lancar', 'lanca'], { ...ITEM_TIPOS, item: 'servico' }),
  ...phrases('account.create', ['nova conta a pagar', 'conta a pagar', 'nova conta', 'nova despesa', 'lancar conta', 'cadastrar conta']),
  ...combos('catalogItem.create', ['novo', 'nova', 'cadastrar', 'cadastra', 'criar'], ITEM_TIPOS),
  ...phrases('supplier.create', ['novo fornecedor', 'cadastrar fornecedor', 'cadastra fornecedor', 'criar fornecedor']),
  ...phrases('collaborator.create', [
    'novo colaborador', 'nova colaboradora', 'novo funcionario', 'nova funcionaria', 'cadastrar colaborador', 'cadastrar funcionario'
  ])
]

const text: Extractor = tokens => joinRaw(tokens).trim() || undefined
const digits: Extractor = tokens => parseDigits(tokens) || undefined
const date: Extractor = (tokens, now) => parseDate(tokens, now)
const username: Extractor = tokens => tokens[0]?.folded.replace(/[^a-z0-9._]/g, '') || undefined
const papel: Extractor = (tokens): VoicePapel | undefined => {
  const folded = foldText(joinRaw(tokens))
  if (folded.includes('recep')) return 'recepcao'
  if (folded.includes('mecan')) return 'mecanico'
  if (folded.includes('gerent')) return 'gerente'
  return undefined
}

const NOME: FieldSpec = { keys: ['nome'], extract: text }
const DESCRICAO: FieldSpec = { keys: ['descricao'], extract: text }
const OBSERVACOES: FieldSpec = { keys: ['observacao', 'observacoes', 'obs'], extract: text }
const PLACA: FieldSpec = { keys: ['placa'], extract: parsePlaca }
const KM_KEYS = ['km', 'quilometragem', 'quilometros']
const EMAIL_KEYS = ['email', 'e-mail', 'e mail']
const PHONE_KEYS = ['telefone', 'celular', 'whatsapp', 'fone']

const SPECS: Record<VoiceIntent, IntentSpec> = {
  'customer.create': {
    defaultField: 'nome',
    fields: {
      nome: NOME,
      telefones: { keys: [...PHONE_KEYS, 'zap'], extract: digits, list: true },
      emails: { keys: EMAIL_KEYS, extract: parseEmail, list: true },
      documento: { keys: ['cpf', 'cnpj', 'documento'], extract: digits },
      observacoes: OBSERVACOES
    }
  },
  'vehicle.create': {
    fields: {
      placa: PLACA,
      marca: { keys: ['marca'], extract: text },
      modelo: { keys: ['modelo'], extract: text },
      ano: { keys: ['ano'], extract: parseNumber },
      cor: { keys: ['cor'], extract: text },
      km_atual: { keys: KM_KEYS, extract: parseNumber },
      clienteNome: { keys: ['cliente', 'dono', 'proprietario', 'proprietaria'], extract: text },
      observacoes: OBSERVACOES
    }
  },
  'order.create': {
    fields: {
      placa: PLACA,
      km_entrada: { keys: KM_KEYS, extract: parseNumber },
      reclamacao: { keys: ['reclamacao', 'relato', 'problema', 'defeito', 'queixa'], extract: text },
      diagnostico: { keys: ['diagnostico'], extract: text },
      observacoes: OBSERVACOES
    }
  },
  'appointment.create': {
    fields: {
      placa: PLACA,
      problema: { keys: ['problema', 'servico', 'motivo', 'reclamacao'], extract: text }
    },
    extra: (segments, now) => {
      const tokens = segments
        .filter(segment => segment.field !== 'problema')
        .flatMap(({ field, tokens: own }) => field === 'placa' ? own.slice(readPlaca(own).consumed) : own)
      return { date: parseDate(tokens, now), startTime: parseTime(tokens) }
    }
  },
  'budgetItem.create': {
    defaultField: 'descricao',
    fields: {
      descricao: DESCRICAO,
      quantidade: { keys: ['quantidade', 'qtd', 'qtde'], extract: parseNumber },
      valor_unitario: { keys: ['valor', 'preco'], extract: parseMoney }
    }
  },
  'account.create': {
    defaultField: 'descricao',
    fields: {
      descricao: DESCRICAO,
      valor: { keys: ['valor'], extract: parseMoney },
      vencimento: { keys: ['vencimento', 'vence', 'vencendo'], extract: date },
      categoriaNome: { keys: ['categoria'], extract: text },
      fornecedorNome: { keys: ['fornecedor'], extract: text },
      observacoes: OBSERVACOES
    }
  },
  'catalogItem.create': {
    defaultField: 'nome',
    fields: {
      nome: NOME,
      valor_padrao: { keys: ['valor', 'preco'], extract: parseMoney },
      custo: { keys: ['custo'], extract: parseMoney },
      estoque: { keys: ['estoque'], extract: parseNumber },
      horas_estimadas: { keys: ['horas', 'hora', 'tempo'], extract: parseNumber }
    }
  },
  'supplier.create': {
    defaultField: 'nome',
    fields: {
      nome: NOME,
      telefone: { keys: PHONE_KEYS, extract: digits },
      email: { keys: EMAIL_KEYS, extract: parseEmail },
      observacoes: OBSERVACOES
    }
  },
  'collaborator.create': {
    defaultField: 'nome',
    fields: {
      nome: NOME,
      username: { keys: ['usuario', 'login', 'username'], extract: username },
      papel: { keys: ['papel', 'cargo', 'funcao'], extract: papel }
    }
  }
}

function matchesAt(tokens: VoiceToken[], i: number, words: string[]): boolean {
  return words.every((word, j) => tokens[i + j]?.folded === word)
}

function findTrigger(tokens: VoiceToken[]): { trigger: Trigger, end: number } | undefined {
  for (let i = 0; i < tokens.length; i++) {
    const trigger = TRIGGERS
      .filter(candidate => matchesAt(tokens, i, candidate.words))
      .sort((a, b) => b.words.length - a.words.length)[0]
    if (trigger) return { trigger, end: i + trigger.words.length }
  }
  return undefined
}

/** Cada palavra-chave abre um segmento; tokens antes da primeira ficam no segmento padrão. */
function segment(tokens: VoiceToken[], spec: IntentSpec): Segment[] {
  const keywords = Object.entries(spec.fields)
    .flatMap(([field, { keys }]) => keys.map(key => ({ field, words: key.split(' ') })))
    .sort((a, b) => b.words.length - a.words.length)
  const segments: Segment[] = [{ field: spec.defaultField ?? '', tokens: [] }]
  let i = 0
  while (i < tokens.length) {
    const keyword = keywords.find(candidate => matchesAt(tokens, i, candidate.words))
    if (keyword) {
      segments.push({ field: keyword.field, tokens: [] })
      i += keyword.words.length
    } else {
      segments.at(-1)!.tokens.push(tokens[i]!)
      i++
    }
  }
  return segments
}

export function parseVoiceCommand(transcript: string, now: Date = new Date()): VoiceCommand | null {
  const tokens = tokenize(transcript)
  const found = findTrigger(tokens)
  if (!found) return null

  const { intent, tipo } = found.trigger
  const spec = SPECS[intent]
  const segments = segment(tokens.slice(found.end), spec)
  const payload: Record<string, Value | Value[]> = tipo ? { tipo } : {}

  for (const { field, tokens: segmentTokens } of segments) {
    const fieldSpec = spec.fields[field]
    if (!fieldSpec) continue
    const value = fieldSpec.extract(segmentTokens, now)
    if (value === undefined || value === '') continue
    if (fieldSpec.list) payload[field] = [...(payload[field] as Value[] | undefined ?? []), value]
    else payload[field] = value
  }
  for (const [field, value] of Object.entries(spec.extra?.(segments, now) ?? {})) {
    if (value !== undefined && value !== '') payload[field] = value
  }

  return { intent, payload } as VoiceCommand
}
