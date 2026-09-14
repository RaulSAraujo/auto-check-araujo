import { STITCH_COLORS } from '~~/layers/1.base/app/utils/brand'
import type { OrdemStatus } from '~~/shared/types/oficina'
import { ORDEM_STATUS_LABEL } from '~~/shared/types/oficina'

export const HOME_STATUS_ORDER = ['aberta', 'em_andamento'] as const

export type HomeActiveStatus = (typeof HOME_STATUS_ORDER)[number]

export const HOME_STATUS_HEX: Record<HomeActiveStatus, string> = {
  aberta: STITCH_COLORS.primary,
  em_andamento: STITCH_COLORS.tertiaryContainer
}

export function homeStatusCategories(dark = false) {
  return Object.fromEntries(
    HOME_STATUS_ORDER.map(status => [
      status,
      {
        name: ORDEM_STATUS_LABEL[status as OrdemStatus],
        color: dark && status === 'aberta'
          ? STITCH_COLORS.primaryContainer
          : HOME_STATUS_HEX[status]
      }
    ])
  )
}

export const HOME_FINANCE_CATEGORIES = {
  pago: {
    name: 'Recebido',
    color: STITCH_COLORS.success
  },
  pendente: {
    name: 'Pendente',
    color: STITCH_COLORS.warning
  }
} as const

export function homePrimaryHex(dark = false) {
  return dark ? STITCH_COLORS.primaryContainer : STITCH_COLORS.primary
}

export function homeSuccessHex() {
  return STITCH_COLORS.success
}
