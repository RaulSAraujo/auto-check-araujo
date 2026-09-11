import { STITCH_COLORS } from '~~/layers/1.base/app/utils/brand'

/** Cash-flow chart series — Stitch tokens only (no raw Tailwind greens/reds). */
export function financeCashFlowCategories(dark = false) {
  return {
    entradas: {
      name: 'Entradas',
      color: STITCH_COLORS.success
    },
    saidas: {
      name: 'Saídas',
      color: dark ? STITCH_COLORS.secondaryContainer : STITCH_COLORS.secondary
    },
    saldo: {
      name: 'Saldo',
      color: dark ? STITCH_COLORS.primaryContainer : STITCH_COLORS.primary
    }
  } as const
}
