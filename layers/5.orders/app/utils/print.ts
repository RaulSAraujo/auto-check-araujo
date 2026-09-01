export const WORKSHOP_NAME = 'Auto Check Araujo'

export function normalizePhoneForWhatsApp(telefone: string | null | undefined): string | null {
  if (!telefone) return null
  const digits = telefone.replace(/\D/g, '')
  if (digits.length < 10) return null
  return digits.startsWith('55') ? digits : `55${digits}`
}

export function buildWhatsAppUrl(telefone: string | null | undefined, message: string): string | null {
  const phone = normalizePhoneForWhatsApp(telefone)
  if (!phone) return null
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

export function buildBudgetWhatsAppMessage(numero: string, printUrl: string): string {
  return `Olá! Segue o orçamento da ${numero} da ${WORKSHOP_NAME}:\n${printUrl}`
}

export function buildChecklistWhatsAppMessage(numero: string, printUrl: string): string {
  return `Olá! Segue o checklist de inspeção da ${numero} da ${WORKSHOP_NAME}:\n${printUrl}`
}

export function printPage(): void {
  if (import.meta.client) {
    window.print()
  }
}

export function absolutePrintUrl(path: string): string {
  if (import.meta.client) {
    return new URL(path, window.location.origin).href
  }
  return path
}
