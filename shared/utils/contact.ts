export function normalizeContactList(values: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const raw of values) {
    const value = raw.trim()
    if (!value) continue

    const key = value.toLowerCase()
    if (seen.has(key)) continue

    seen.add(key)
    result.push(value)
  }

  return result
}

export function primaryPhone(telefones: string[] | null | undefined): string | null {
  return normalizeContactList(telefones || [])[0] || null
}

export function primaryEmail(emails: string[] | null | undefined): string | null {
  return normalizeContactList(emails || [])[0] || null
}

export function formatContactList(values: string[] | null | undefined): string {
  const list = normalizeContactList(values || [])
  return list.length ? list.join(', ') : '—'
}
