import type {
  VoiceBudgetItemPayload,
  VoiceCommand,
  VoiceIntent,
  VoiceItemTipo,
  VoiceNavTarget,
  VoiceOrderStatus,
  VoicePapel
} from './types.ts'

type Obj = Record<string, unknown>

const PLACA_RE = /^[A-Z]{3}\d[A-Z0-9]\d{2}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TIPOS: readonly VoiceItemTipo[] = ['servico', 'peca', 'kit']
const PAPEIS: readonly VoicePapel[] = ['recepcao', 'mecanico', 'gerente']
const STATUSES: readonly VoiceOrderStatus[] = ['aberta', 'em_andamento', 'concluida', 'cancelada']
const NAV_TARGETS: readonly VoiceNavTarget[] = [
  'home', 'orders', 'scheduling', 'customers', 'vehicles',
  'finance', 'team', 'catalog', 'suppliers', 'pricing', 'settings'
]

function isObj(value: unknown): value is Obj {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function compact<T extends Obj>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T
}

function str(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, 1000) : undefined
}

function num(value: unknown): number | undefined {
  const n = typeof value === 'string' ? Number(value.replace(',', '.')) : value
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 ? n : undefined
}

function digits(value: unknown): string | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined
  const only = String(value).replace(/\D/g, '')
  return only || undefined
}

function placa(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
  return PLACA_RE.test(normalized) ? normalized : undefined
}

function date(value: unknown): string | undefined {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return undefined
  const [y, m, d] = value.split('-').map(Number) as [number, number, number]
  const parsed = new Date(y, m - 1, d)
  return parsed.getFullYear() === y && parsed.getMonth() === m - 1 && parsed.getDate() === d ? value : undefined
}

function time(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const padded = value.trim().padStart(5, '0')
  return TIME_RE.test(padded) ? padded : undefined
}

function email(value: unknown): string | undefined {
  const s = str(value)?.toLowerCase().replace(/\s+/g, '')
  return s && EMAIL_RE.test(s) ? s : undefined
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return allowed.includes(value as T) ? value as T : undefined
}

function list<T>(value: unknown, pick: (item: unknown) => T | undefined): T[] | undefined {
  const items = Array.isArray(value) ? value : [value]
  const out = items.map(pick).filter((item): item is T => item !== undefined)
  return out.length ? out : undefined
}

function obj(value: unknown): Obj {
  return isObj(value) ? value : {}
}

function nonEmpty<T extends Obj>(value: T): T | undefined {
  const cleaned = compact(value)
  return Object.keys(cleaned).length ? cleaned : undefined
}

function budgetItem(value: unknown): VoiceBudgetItemPayload | undefined {
  if (!isObj(value)) return undefined
  return compact({
    tipo: oneOf(value.tipo, TIPOS) ?? 'servico',
    descricao: str(value.descricao),
    quantidade: num(value.quantidade),
    valor_unitario: num(value.valor_unitario)
  })
}

function orderNumero(value: unknown): string | undefined {
  return digits(value)?.replace(/^0+(?=\d)/, '')
}

const PICKERS: { [K in VoiceIntent]: (p: Obj) => Extract<VoiceCommand, { intent: K }>['payload'] | undefined } = {
  'customer.create': p => compact({
    nome: str(p.nome),
    telefones: list(p.telefones, digits),
    emails: list(p.emails, email),
    documento: digits(p.documento),
    observacoes: str(p.observacoes)
  }),
  'vehicle.create': p => compact({
    placa: placa(p.placa),
    marca: str(p.marca),
    modelo: str(p.modelo),
    ano: num(p.ano),
    cor: str(p.cor),
    km_atual: num(p.km_atual),
    observacoes: str(p.observacoes),
    clienteNome: str(p.clienteNome)
  }),
  'order.create': p => compact({
    placa: placa(p.placa),
    km_entrada: num(p.km_entrada),
    reclamacao: str(p.reclamacao),
    diagnostico: str(p.diagnostico),
    observacoes: str(p.observacoes)
  }),
  'appointment.create': p => compact({
    placa: placa(p.placa),
    date: date(p.date),
    startTime: time(p.startTime),
    problema: str(p.problema)
  }),
  'budgetItem.create': p => budgetItem(p),
  'account.create': p => compact({
    descricao: str(p.descricao),
    valor: num(p.valor),
    vencimento: date(p.vencimento),
    categoriaNome: str(p.categoriaNome),
    fornecedorNome: str(p.fornecedorNome),
    observacoes: str(p.observacoes)
  }),
  'catalogItem.create': p => compact({
    tipo: oneOf(p.tipo, TIPOS) ?? 'servico',
    nome: str(p.nome),
    valor_padrao: num(p.valor_padrao),
    custo: num(p.custo),
    estoque: num(p.estoque),
    horas_estimadas: num(p.horas_estimadas)
  }),
  'supplier.create': p => compact({
    nome: str(p.nome),
    telefone: digits(p.telefone),
    email: email(p.email),
    observacoes: str(p.observacoes)
  }),
  'collaborator.create': p => compact({
    nome: str(p.nome),
    username: str(p.username)?.toLowerCase().split(/\s+/)[0],
    papel: oneOf(p.papel, PAPEIS)
  }),
  'order.edit': (p) => {
    const t = obj(p.target)
    return compact({
      target: nonEmpty({ placa: placa(t.placa), numero: orderNumero(t.numero), clienteNome: str(t.clienteNome) }),
      km_entrada: num(p.km_entrada),
      reclamacao: str(p.reclamacao),
      diagnostico: str(p.diagnostico),
      observacoes: str(p.observacoes),
      status: oneOf(p.status, STATUSES),
      itens: list(p.itens, budgetItem)
    })
  },
  'customer.edit': (p) => {
    const t = obj(p.target)
    return compact({
      target: nonEmpty({ nome: str(t.nome) }),
      telefones: list(p.telefones, digits),
      emails: list(p.emails, email),
      documento: digits(p.documento),
      observacoes: str(p.observacoes)
    })
  },
  'vehicle.edit': (p) => {
    const t = obj(p.target)
    return compact({
      target: nonEmpty({ placa: placa(t.placa) }),
      km_atual: num(p.km_atual),
      cor: str(p.cor),
      observacoes: str(p.observacoes)
    })
  },
  'appointment.reschedule': p => compact({
    placa: placa(p.placa),
    date: date(p.date),
    startTime: time(p.startTime)
  }),
  'appointment.noShow': p => compact({ placa: placa(p.placa) }),
  'navigate': (p) => {
    const to = oneOf(p.to, NAV_TARGETS)
    return to ? compact({ to, date: date(p.date) }) : undefined
  }
}

/** Trust boundary: nothing produced by the AI reaches the app without passing here. */
export function normalizeVoiceCommand(raw: unknown): VoiceCommand | null {
  if (!isObj(raw) || typeof raw.intent !== 'string') return null
  if (!Object.hasOwn(PICKERS, raw.intent)) return null
  const intent = raw.intent as VoiceIntent
  const pick = PICKERS[intent] as (p: Obj) => VoiceCommand['payload'] | undefined
  const payload = pick(obj(raw.payload))
  return payload ? { intent, payload } as VoiceCommand : null
}
