/** Tamanho padrão de página nas listagens. */
export const LIST_PAGE_SIZE = 20

/** Remove caracteres que quebram filtros PostgREST (.or / ilike). */
export function sanitizeIlikeTerm(term: string): string {
  return term.replace(/[%_,().\\]/g, '').trim()
}

/** Padrão ilike seguro: %termo% */
export function ilikePattern(term: string): string {
  const safe = sanitizeIlikeTerm(term)
  return safe ? `%${safe}%` : ''
}
