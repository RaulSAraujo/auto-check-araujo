export type RouteQuery = Record<string, string | null | (string | null)[] | undefined>
/** Allowed values, or a validator for open-ended ones (months). */
export type QueryCheck = readonly string[] | ((value: string) => boolean)

export function readQueryValue<T extends string>(raw: unknown, fallback: T, check?: QueryCheck): T {
  if (typeof raw !== 'string' || !raw) return fallback
  if (!check) return raw as T
  const ok = typeof check === 'function' ? check(raw) : check.includes(raw)
  return ok ? raw as T : fallback
}

export function withQueryValue(query: RouteQuery, key: string, value: string, fallback: string): RouteQuery {
  const { [key]: _omit, ...rest } = query
  return value.trim() && value !== fallback ? { ...rest, [key]: value } : rest
}
