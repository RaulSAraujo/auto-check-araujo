/** Portuguese particles kept lowercase inside Title Case (except first word). */
const TITLE_PARTICLES = new Set([
  'da',
  'de',
  'do',
  'dos',
  'das',
  'e'
])

function collapseSpaces(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

function capitalizeWord(word: string): string {
  if (!word) return word
  const lower = word.toLocaleLowerCase('pt-BR')
  return lower.charAt(0).toLocaleUpperCase('pt-BR') + lower.slice(1)
}

/** Title Case with PT particles: "JOÃO DA SILVA" → "João da Silva". */
export function toTitleCasePt(value: string): string {
  const normalized = collapseSpaces(value)
  if (!normalized) return ''

  return normalized
    .split(' ')
    .map((word, index) => {
      const lower = word.toLocaleLowerCase('pt-BR')
      if (index > 0 && TITLE_PARTICLES.has(lower)) return lower
      return capitalizeWord(word)
    })
    .join(' ')
}

/** Sentence case: "TROCAR ÓLEO" → "Trocar óleo". */
export function toSentenceCase(value: string): string {
  const normalized = collapseSpaces(value)
  if (!normalized) return ''

  const lower = normalized.toLocaleLowerCase('pt-BR')
  return lower.charAt(0).toLocaleUpperCase('pt-BR') + lower.slice(1)
}

export function titleCaseOrNull(value: string | null | undefined): string | null {
  if (value == null) return null
  const next = toTitleCasePt(value)
  return next || null
}

export function sentenceCaseOrNull(value: string | null | undefined): string | null {
  if (value == null) return null
  const next = toSentenceCase(value)
  return next || null
}
