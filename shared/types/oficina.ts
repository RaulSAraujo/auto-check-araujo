export type OrdemStatus = 'aberta' | 'em_andamento' | 'concluida' | 'cancelada'
export type ChecklistResultado = 'ok' | 'atencao' | 'ruim' | 'na'

export const ORDEM_STATUS_LABEL: Record<OrdemStatus, string> = {
  aberta: 'Aberta',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada'
}

export const ORDEM_STATUS_COLOR: Record<OrdemStatus, 'info' | 'warning' | 'success' | 'neutral' | 'error'> = {
  aberta: 'info',
  em_andamento: 'warning',
  concluida: 'success',
  cancelada: 'neutral'
}

export const CHECKLIST_RESULTADO_LABEL: Record<ChecklistResultado, string> = {
  ok: 'OK',
  atencao: 'Atenção',
  ruim: 'Ruim',
  na: 'N/A'
}

export function isOrderEditable(status: OrdemStatus): boolean {
  return status === 'aberta' || status === 'em_andamento'
}
