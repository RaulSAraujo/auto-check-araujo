export interface VoiceToken { raw: string, folded: string }

const NUMBER_WORDS: Record<string, number> = {
  zero: 0, um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9,
  dez: 10, onze: 11, doze: 12, treze: 13, quatorze: 14, catorze: 14, quinze: 15,
  dezesseis: 16, dezessete: 17, dezoito: 18, dezenove: 19,
  vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50, sessenta: 60, setenta: 70, oitenta: 80, noventa: 90,
  cem: 100, cento: 100, duzentos: 200, duzentas: 200, trezentos: 300, quatrocentos: 400,
  quinhentos: 500, seiscentos: 600, setecentos: 700, oitocentos: 800, novecentos: 900
}

const DIGIT_WORDS: Record<string, string> = {
  zero: '0', um: '1', uma: '1', dois: '2', duas: '2', tres: '3', quatro: '4',
  cinco: '5', seis: '6', meia: '6', sete: '7', oito: '8', nove: '9'
}

const LETTER_NAMES = [
  'a', 'be', 'ce', 'de', 'e', 'efe', 'ge', 'aga', 'i', 'jota', 'ka', 'ele', 'eme',
  'ene', 'o', 'pe', 'que', 'erre', 'esse', 'te', 'u', 've', 'dablio', 'xis', 'ipsilon', 'ze'
]

const WEEKDAYS = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']

const MONTHS = [
  'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
]

const NUMERIC_TOKEN = /^\d+([.,]\d+)*$/
const PLACA_PATTERN = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EMAIL_WORDS: Record<string, string> = {
  arroba: '@', ponto: '.', underline: '_', underscore: '_', hifen: '-', traco: '-'
}

export function foldText(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function tokenize(text: string): VoiceToken[] {
  return text
    .split(/\s+/)
    .map(raw => raw.replace(/^[.,!?;:"'()]+|[.,!?;:"'()]+$/g, ''))
    .filter(Boolean)
    .map(raw => ({ raw, folded: foldText(raw) }))
}

export function joinRaw(tokens: VoiceToken[]): string {
  return tokens.map(token => token.raw).join(' ')
}

function numericValue(folded: string | undefined): number | undefined {
  if (folded === undefined) return undefined
  if (NUMERIC_TOKEN.test(folded)) {
    const value = Number(folded.replace(/\.(?=\d{3}(?!\d))/g, '').replace(',', '.'))
    return Number.isFinite(value) ? value : undefined
  }
  return NUMBER_WORDS[folded]
}

/** Lê uma sequência numérica começando exatamente em `start`. */
function readNumber(tokens: VoiceToken[], start: number): { value: number, end: number } | undefined {
  let total = 0
  let current = 0
  let previous: 'start' | 'value' | 'mil' | 'e' = 'start'
  let i = start
  while (i < tokens.length) {
    const folded = tokens[i]!.folded
    const value = numericValue(folded)
    if (folded === 'mil') {
      if (previous === 'mil' || previous === 'e') break
      total += (current || 1) * 1000
      current = 0
      previous = 'mil'
    } else if (value !== undefined) {
      if (previous === 'value') break
      current += value
      previous = 'value'
    } else if (folded === 'e' && previous !== 'start' && numericValue(tokens[i + 1]?.folded) !== undefined) {
      previous = 'e'
    } else {
      break
    }
    i++
  }
  return previous === 'start' ? undefined : { value: total + current, end: i }
}

function findNumber(tokens: VoiceToken[]): { value: number, end: number } | undefined {
  for (let i = 0; i < tokens.length; i++) {
    const found = readNumber(tokens, i)
    if (found) return found
  }
  return undefined
}

export function parseNumber(tokens: VoiceToken[]): number | undefined {
  return findNumber(tokens)?.value
}

export function parseMoney(tokens: VoiceToken[]): number | undefined {
  const reais = findNumber(tokens)
  if (!reais) return undefined
  let value = reais.value
  const { end } = reais
  if (['reais', 'real'].includes(tokens[end]?.folded ?? '') && tokens[end + 1]?.folded === 'e') {
    const cents = readNumber(tokens, end + 2)
    if (cents && ['centavos', 'centavo'].includes(tokens[cents.end]?.folded ?? '')) value += cents.value / 100
  }
  return Math.round(value * 100) / 100
}

function placaChars(folded: string): string | undefined {
  if (folded in DIGIT_WORDS) return DIGIT_WORDS[folded]
  const letter = LETTER_NAMES.indexOf(folded)
  if (letter >= 0) return String.fromCharCode(65 + letter)
  if (/^[a-z0-9-]+$/.test(folded)) return folded.replace(/-/g, '').toUpperCase() || undefined
  return undefined
}

/** Placa lida do início dos tokens; `consumed` é 0 quando não há placa válida. */
export function readPlaca(tokens: VoiceToken[]): { placa: string | undefined, consumed: number } {
  let placa = ''
  let consumed = 0
  for (const token of tokens) {
    const chars = placaChars(token.folded)
    if (!chars || placa.length + chars.length > 7) break
    placa += chars
    consumed++
    if (placa.length === 7) break
  }
  return PLACA_PATTERN.test(placa) ? { placa, consumed } : { placa: undefined, consumed: 0 }
}

export function parsePlaca(tokens: VoiceToken[]): string | undefined {
  return readPlaca(tokens).placa
}

function digitsOf(folded: string): string | undefined {
  if (folded in DIGIT_WORDS) return DIGIT_WORDS[folded]
  if (/^[0-9().\-/+]+$/.test(folded) && /\d/.test(folded)) return folded.replace(/\D/g, '')
  return undefined
}

export function parseDigits(tokens: VoiceToken[]): string {
  let digits = ''
  let started = false
  for (const token of tokens) {
    const found = digitsOf(token.folded)
    if (found === undefined) {
      if (started) break
      continue
    }
    started = true
    digits += found
  }
  return digits
}

export function parseEmail(tokens: VoiceToken[]): string | undefined {
  const email = tokens.map(token => EMAIL_WORDS[token.folded] ?? token.folded).join('')
  return EMAIL_PATTERN.test(email) ? email : undefined
}

function pad(value: number, length = 2): string {
  return String(value).padStart(length, '0')
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Data local válida ou `undefined` se o dia não existir no mês (mês pode transbordar o ano). */
function makeDate(year: number, monthIndex: number, day: number): Date | undefined {
  const first = new Date(year, monthIndex, 1)
  const date = new Date(first.getFullYear(), first.getMonth(), day)
  return Number.isInteger(day) && day >= 1 && date.getMonth() === first.getMonth() ? date : undefined
}

function dateAt(tokens: VoiceToken[], i: number, today: Date): Date | undefined | null {
  const folded = tokens[i]!.folded
  const addDays = (days: number) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + days)
  const thisOrNextYear = (monthIndex: number, day: number, year?: number) => {
    const date = makeDate(year ?? today.getFullYear(), monthIndex, day)
    if (!date || year !== undefined || date >= today) return date
    return makeDate(today.getFullYear() + 1, monthIndex, day)
  }

  if (folded === 'depois' && tokens[i + 1]?.folded === 'de' && tokens[i + 2]?.folded === 'amanha') return addDays(2)
  if (folded === 'amanha') return addDays(1)
  if (folded === 'hoje') return addDays(0)

  const weekday = WEEKDAYS.findIndex(name => folded.startsWith(name))
  if (weekday >= 0) return addDays((weekday - today.getDay() + 7) % 7 || 7)

  const slash = folded.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/)
  if (slash) {
    const day = Number(slash[1])
    const month = Number(slash[2])
    if (month < 1 || month > 12) return null
    const date = thisOrNextYear(month - 1, day, slash[3] ? Number(slash[3]) : undefined)
    return date ?? null
  }

  const hasDia = folded === 'dia'
  const day = readNumber(tokens, hasDia ? i + 1 : i)
  if (!day) return null
  const month = MONTHS.indexOf(tokens[day.end + 1]?.folded ?? '')
  if (tokens[day.end]?.folded === 'de' && month >= 0) return thisOrNextYear(month, day.value)
  if (hasDia) return makeDate(today.getFullYear(), today.getMonth() + (day.value >= today.getDate() ? 0 : 1), day.value)
  return null
}

export function parseDate(tokens: VoiceToken[], now: Date): string | undefined {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  for (let i = 0; i < tokens.length; i++) {
    const date = dateAt(tokens, i, today)
    if (date !== null) return date && formatDate(date)
  }
  return undefined
}

function readHour(tokens: VoiceToken[], i: number): { hour: number, end: number } | undefined {
  const folded = tokens[i]!.folded
  if (/^\d{1,2}$/.test(folded)) return { hour: Number(folded), end: i + 1 }
  const next = NUMBER_WORDS[tokens[i + 2]?.folded ?? '']
  if (folded === 'vinte' && tokens[i + 1]?.folded === 'e' && next !== undefined && next >= 1 && next <= 3) {
    return { hour: 20 + next, end: i + 3 }
  }
  const hour = NUMBER_WORDS[folded]
  return hour !== undefined && hour <= 23 ? { hour, end: i + 1 } : undefined
}

function readTimeTail(tokens: VoiceToken[], start: number, knownMinutes?: number) {
  let i = start
  let minutes = knownMinutes
  if (['hora', 'horas', 'h'].includes(tokens[i]?.folded ?? '')) i++
  if (minutes === undefined && tokens[i]?.folded === 'e') {
    if (tokens[i + 1]?.folded === 'meia') {
      minutes = 30
      i += 2
    } else {
      const found = readNumber(tokens, i + 1)
      if (found && Number.isInteger(found.value) && found.value <= 59) {
        minutes = found.value
        i = found.end
      }
    }
  }
  let afternoon = false
  const period = tokens[i + 1]?.folded ?? ''
  if (tokens[i]?.folded === 'da' && ['tarde', 'noite', 'manha', 'madrugada'].includes(period)) {
    afternoon = period === 'tarde' || period === 'noite'
    i += 2
  }
  return { minutes: minutes ?? 0, afternoon, consumed: i > start }
}

function formatTime(hour: number, minutes: number, afternoon: boolean): string | undefined {
  const finalHour = afternoon && hour < 12 ? hour + 12 : hour
  return hour <= 23 && minutes <= 59 ? `${pad(finalHour)}:${pad(minutes)}` : undefined
}

function timeAt(tokens: VoiceToken[], i: number): string | undefined {
  const folded = tokens[i]!.folded
  const clock = folded.match(/^(\d{1,2})h(\d{2})?$/) ?? folded.match(/^(\d{1,2}):(\d{2})$/)
  if (clock) {
    const tail = readTimeTail(tokens, i + 1, clock[2] ? Number(clock[2]) : undefined)
    return formatTime(Number(clock[1]), tail.minutes, tail.afternoon)
  }
  if (folded === 'meio-dia' || (folded === 'meio' && tokens[i + 1]?.folded === 'dia')) {
    const tail = readTimeTail(tokens, folded === 'meio' ? i + 2 : i + 1)
    return formatTime(12, tail.minutes, false)
  }
  const hour = readHour(tokens, i)
  if (!hour) return undefined
  const tail = readTimeTail(tokens, hour.end)
  const precededByAs = ['as', 'a'].includes(tokens[i - 1]?.folded ?? '')
  return precededByAs || tail.consumed ? formatTime(hour.hour, tail.minutes, tail.afternoon) : undefined
}

export function parseTime(tokens: VoiceToken[]): string | undefined {
  for (let i = 0; i < tokens.length; i++) {
    const time = timeAt(tokens, i)
    if (time) return time
  }
  return undefined
}
