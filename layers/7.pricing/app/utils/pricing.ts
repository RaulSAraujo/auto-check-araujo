import type { Database } from '~~/shared/types/database'

export type PricingParamsRow = Database['public']['Tables']['oficina_parametros']['Row']

export type PricingParamsDraft = {
  valor_hora: number
  custo_fixo_mensal: number
  margem_alvo: number
  horas_produtivas_mes: number
  markup_pecas: number
  precificacao_automatica: boolean
  taxa_cartao_debito: number
  taxa_cartao_credito: number
  comissao_percentual: number
}

export const PRICING_EXAMPLE_PART_COST = 100
export const PRICING_EXAMPLE_SALE = 100

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

export function emptyPricingDraft(): PricingParamsDraft {
  return {
    valor_hora: 85,
    custo_fixo_mensal: 12500,
    margem_alvo: 35,
    horas_produtivas_mes: 160,
    markup_pecas: 40,
    precificacao_automatica: true,
    taxa_cartao_debito: 1.5,
    taxa_cartao_credito: 3.5,
    comissao_percentual: 10
  }
}

export function pricingDraftFromRow(row: PricingParamsRow): PricingParamsDraft {
  return {
    valor_hora: Number(row.valor_hora),
    custo_fixo_mensal: Number(row.custo_fixo_mensal),
    margem_alvo: Number(row.margem_alvo),
    horas_produtivas_mes: Number(row.horas_produtivas_mes),
    markup_pecas: Number(row.markup_pecas),
    precificacao_automatica: Boolean(row.precificacao_automatica),
    taxa_cartao_debito: Number(row.taxa_cartao_debito),
    taxa_cartao_credito: Number(row.taxa_cartao_credito),
    comissao_percentual: Number(row.comissao_percentual)
  }
}

export function isPricingDraftValid(draft: PricingParamsDraft): boolean {
  return (
    draft.valor_hora >= 0
    && draft.custo_fixo_mensal >= 0
    && draft.margem_alvo >= 0
    && draft.margem_alvo <= 100
    && draft.horas_produtivas_mes > 0
    && draft.markup_pecas >= 0
    && draft.taxa_cartao_debito >= 0
    && draft.taxa_cartao_debito < 100
    && draft.taxa_cartao_credito >= 0
    && draft.taxa_cartao_credito < 100
    && draft.comissao_percentual >= 0
    && draft.comissao_percentual <= 100
  )
}

/** Hora cobrada = (valor/hora + custo fixo / horas produtivas) × (1 + margem%). */
export function calcSuggestedHourlyRate(draft: Pick<
  PricingParamsDraft,
  'valor_hora' | 'custo_fixo_mensal' | 'margem_alvo' | 'horas_produtivas_mes'
>): number {
  const hours = Math.max(Number(draft.horas_produtivas_mes) || 0, 0.01)
  const costPerHour = Number(draft.valor_hora) + Number(draft.custo_fixo_mensal) / hours
  return roundMoney(costPerHour * (1 + Number(draft.margem_alvo) / 100))
}

export function applyMarkup(cost: number, markupPercent: number): number {
  return roundMoney(Number(cost) * (1 + Number(markupPercent) / 100))
}

export function calcNetAfterFee(amount: number, feePercent: number): number {
  return roundMoney(Number(amount) * (1 - Number(feePercent) / 100))
}

export function calcChargeToNet(desiredNet: number, feePercent: number): number {
  const rate = Number(feePercent) / 100
  if (rate >= 1) return 0
  return roundMoney(Number(desiredNet) / (1 - rate))
}

export function commissionRateFromPercent(percent: number): number {
  return Number(percent) / 100
}

export function resolveCatalogUnitPrice(input: {
  tipo: string
  valorPadrao: number
  custo: number
  markupPecas: number
  precificacaoAutomatica: boolean
}): number {
  if (
    input.precificacaoAutomatica
    && input.tipo === 'peca'
    && Number(input.custo) > 0
  ) {
    return applyMarkup(input.custo, input.markupPecas)
  }
  return roundMoney(Number(input.valorPadrao) || 0)
}
