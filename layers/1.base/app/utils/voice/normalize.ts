import { VOICE_CATALOG, type VoiceField } from './catalog.ts'
import type { VoiceCommand, VoiceEntityKey, VoiceNavTarget, VoiceRecord, VoiceValue } from './types.ts'
import { VOICE_VIEWS } from './views.ts'

type Obj = Record<string, unknown>

const PLACA_RE = /^[A-Z]{3}\d[A-Z0-9]\d{2}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const THOUSANDS_RE = /^\d{1,3}(\.\d{3})+(,\d+)?$/
const TIME_WITH_SECONDS_RE = /^\d{1,2}:\d{2}:\d{2}$/
const MAX_LIST = 10
const MAX_ITEMS = 20
const NAV_TARGETS: readonly VoiceNavTarget[] = [
  'home', 'orders', 'scheduling', 'customers', 'vehicles',
  'finance', 'team', 'catalog', 'suppliers', 'pricing', 'settings'
]

function isObj(value: unknown): value is Obj {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function str(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, 1000) : undefined
}

function parseNumeric(value: string): number | undefined {
  const s = value.trim()
  if (!s) return undefined
  return Number((THOUSANDS_RE.test(s) ? s.replace(/\./g, '') : s).replace(',', '.'))
}

function num(value: unknown): number | undefined {
  const n = typeof value === 'string' ? parseNumeric(value) : value
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

function month(value: unknown): string | undefined {
  return typeof value === 'string' && MONTH_RE.test(value) ? value : undefined
}

function time(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  const hhmm = TIME_WITH_SECONDS_RE.test(trimmed) ? trimmed.slice(0, -3) : trimmed
  const padded = hhmm.padStart(5, '0')
  return TIME_RE.test(padded) ? padded : undefined
}

function email(value: unknown): string | undefined {
  const s = str(value)?.toLowerCase().replace(/\s+/g, '')
  return s && EMAIL_RE.test(s) ? s : undefined
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return allowed.includes(value as T) ? value as T : undefined
}

function bool(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}

function scalar(field: VoiceField, value: unknown): string | number | boolean | undefined {
  switch (field.type) {
    case 'text': {
      const s = str(value)
      return field.max ? s?.slice(0, field.max) : s
    }
    case 'month': return month(value)
    case 'date': return date(value)
    case 'time': return time(value)
    case 'bool': return bool(value)
    case 'enum': return oneOf(value, field.values ?? [])
    case 'placa': return placa(value)
    case 'digits': return digits(value)
    case 'email': return email(value)
    case 'number':
    case 'money': {
      const n = num(value)
      if (n === undefined || (field.min !== undefined && n < field.min) || (field.max !== undefined && n > field.max)) return undefined
      return field.type === 'money' ? Math.round(n * 100) / 100 : n
    }
  }
}

function fieldValue(field: VoiceField, value: unknown): VoiceValue | undefined {
  if (!field.list) return scalar(field, value)
  const items = (Array.isArray(value) ? value : [value])
    .slice(0, MAX_LIST)
    .map(item => scalar(field, item))
    .filter((item): item is string => typeof item === 'string')
  return items.length ? items : undefined
}

function pick(spec: Record<string, VoiceField>, raw: unknown, op?: 'create' | 'edit'): VoiceRecord | undefined {
  if (!isObj(raw)) return undefined
  const out: VoiceRecord = {}
  for (const [key, field] of Object.entries(spec)) {
    if (!Object.hasOwn(raw, key)) continue
    if (op && field.ops && !field.ops.includes(op)) continue
    const value = fieldValue(field, raw[key])
    if (value !== undefined) out[key] = value
  }
  return Object.keys(out).length ? out : undefined
}

/** Trust boundary: nothing produced by the AI reaches the app without passing here. */
export function normalizeVoiceCommand(raw: unknown): VoiceCommand | null {
  if (!isObj(raw)) return null

  if (raw.op === 'navigate') {
    const to = oneOf(raw.to, NAV_TARGETS)
    if (!to) return null
    const query = pick(VOICE_VIEWS[to] ?? {}, raw.query) as Record<string, string> | undefined
    return query ? { op: 'navigate', to, query } : { op: 'navigate', to }
  }

  const op = oneOf(raw.op, ['create', 'edit', 'action'] as const)
  if (!op || typeof raw.entity !== 'string' || !Object.hasOwn(VOICE_CATALOG, raw.entity)) return null
  const entityKey = raw.entity as VoiceEntityKey
  const entity = VOICE_CATALOG[entityKey]
  const command: VoiceCommand = { op, entity: entityKey }

  const target = op === 'create' ? undefined : pick(entity.target, raw.target)
  if (target) command.target = target as Record<string, string>

  if (op === 'action') {
    if (typeof raw.action !== 'string' || !Object.hasOwn(entity.actions, raw.action)) return null
    command.action = raw.action
    const args = pick(entity.actions[raw.action]?.args ?? {}, raw.args)
    if (args) command.args = args
    return command
  }

  const fields = pick(entity.fields, raw.fields, op)
  if (fields) command.fields = fields

  const itemSpec = entity.items
  if (itemSpec && Array.isArray(raw.items)) {
    const items = raw.items
      .slice(0, MAX_ITEMS)
      .map(item => pick(itemSpec, item))
      .filter((item): item is VoiceRecord => !!item && Object.keys(item).some(key => itemSpec[key]?.type !== 'enum'))
    if (items.length) command.items = items
  }
  return command
}
