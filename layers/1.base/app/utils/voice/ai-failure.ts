const AI_FAILURE: Record<number, string> = {
  429: 'O limite de uso gratuito da IA foi atingido. Aguarde alguns minutos (ou até amanhã, se acabou a cota do dia) e tente de novo.',
  502: 'A IA está sem chave válida configurada. Avise o administrador do sistema.'
}

/** User-facing reason for a failed `/api/voice/*` call (status from `aiFailureStatus` on the server). */
export function voiceAiFailure(error: unknown, fallback: string): string {
  const status = (error as { statusCode?: number } | null)?.statusCode
  return (status && AI_FAILURE[status]) || fallback
}
