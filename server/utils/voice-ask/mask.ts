type PiiKind = 'telefone' | 'email' | 'documento'

const TOKEN_RE = /\[(telefone|email|documento) (\d+)\]/g
const FIELD_KIND: Record<string, PiiKind> = {
  telefone: 'telefone',
  telefones: 'telefone',
  email: 'email',
  emails: 'email',
  documento: 'documento'
}
// ponytail: regex heuristics — a bare 11-digit number is a phone when its 3rd digit is 9 (mobile), otherwise a CPF; numbers spoken in other shapes slip through.
const PATTERNS: [PiiKind, RegExp][] = [
  ['email', /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)+/gu],
  ['documento', /\b\d{3}\.?\d{3}\.?\d{3}-\d{2}\b/g],
  ['documento', /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g],
  ['telefone', /(?<![\w+])(?:\+?55[\s.-]?)?(?:\(\d{2}\)|\d{2})[\s.-]?(?:9[\s.-]?)?\d{4}[\s.-]?\d{4}(?!\d)/g],
  ['documento', /\b\d{11}\b/g]
]

function valueKey(kind: PiiKind, value: string): string {
  const digits = value.replace(/\D/g, '')
  if (kind === 'email' || !digits) return `${kind}:${value.trim().toLowerCase()}`
  return `${kind}:${kind === 'telefone' ? digits.replace(/^55(?=\d{10,11}$)/, '') : digits}`
}

/** Per-request map between personal data and the tokens the AI sees. */
export function createMasker(seen: readonly string[] = []) {
  let next = Math.max(0, ...seen.flatMap(text => [...text.matchAll(TOKEN_RE)].map(match => Number(match[2]))))
  const tokenByKey = new Map<string, string>()
  const valueByToken = new Map<string, string>()

  function token(kind: PiiKind, value: string): string {
    const key = valueKey(kind, value)
    let found = tokenByKey.get(key)
    if (!found) {
      found = `[${kind} ${++next}]`
      tokenByKey.set(key, found)
      valueByToken.set(found, value)
    }
    return found
  }

  function maskText(text: string): string {
    return PATTERNS.reduce((out, [kind, re]) => out.replace(re, match => token(kind, match)), text)
  }

  function maskResult(value: unknown, key = ''): unknown {
    const kind = FIELD_KIND[key]
    if (kind && typeof value === 'number') return token(kind, String(value))
    if (typeof value === 'string') {
      if (kind) return value ? token(kind, value) : value
      return key === 'id' || key.endsWith('_id') ? value : maskText(value)
    }
    if (Array.isArray(value)) return value.map(item => maskResult(item, key))
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, maskResult(v, k)]))
    }
    return value
  }

  function unmask(text: string): string {
    return text.replace(TOKEN_RE, found => valueByToken.get(found) ?? found)
  }

  function unmaskArgs(value: unknown): unknown {
    if (typeof value === 'string') return unmask(value)
    if (Array.isArray(value)) return value.map(unmaskArgs)
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, unmaskArgs(v)]))
    }
    return value
  }

  return { maskText, maskResult, unmask, unmaskArgs }
}
