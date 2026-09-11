/** Tamanho padrão de página nas listagens. */
export const LIST_PAGE_SIZE = 20

/** Página padrão em relatórios (financeiro, catálogo). */
export const REPORT_PAGE_SIZE = 50

/** Teto de segurança para fetches de relatório/catálogo sem paginação de UI. */
export const REPORT_SOFT_LIMIT = 500

/** Limite de opções em typeahead (veículo / cliente). */
export const OPTIONS_FETCH_LIMIT = 40

/** Debounce da busca em typeahead (ms). */
export const OPTIONS_SEARCH_DEBOUNCE_MS = 300

/** Remove caracteres que quebram filtros PostgREST (.or / ilike). */
export function sanitizeIlikeTerm(term: string): string {
  return term.replace(/[%_,().\\]/g, '').trim()
}

/** Padrão ilike seguro: %termo% */
export function ilikePattern(term: string): string {
  const safe = sanitizeIlikeTerm(term)
  return safe ? `%${safe}%` : ''
}
