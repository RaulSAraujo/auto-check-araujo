export const USERNAME_EMAIL_DOMAIN = 'interno.auto-check'

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase()
}

export function isValidUsername(username: string): boolean {
  return /^[a-z0-9][a-z0-9_-]{2,31}$/.test(username)
}

export function usernameToAuthEmail(username: string): string {
  return `${normalizeUsername(username)}@${USERNAME_EMAIL_DOMAIN}`
}

export function authEmailToUsername(email: string): string | null {
  const suffix = `@${USERNAME_EMAIL_DOMAIN}`
  if (!email.endsWith(suffix)) return null
  return email.slice(0, -suffix.length)
}

export function isValidCollaboratorPassword(password: string): boolean {
  return password.length >= 6
}
