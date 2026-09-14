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
}

export const PRICING_EXAMPLE_PART_COST = 100
export const PRICING_EXAMPLE_SALE = 100

/** Ajuda por campo na tela de precificação (ícone ao lado do label). */
export const PRICING_FIELD_HELP = {
  valor_hora: 'Quanto a mão de obra custa por hora.',
  custo_fixo_mensal: 'Aluguel, luz, salários fixos e outros custos do mês.',
  margem_alvo: 'Percentual de lucro desejado sobre o custo da hora.',
  horas_produtivas_mes: 'Horas produtivas no mês que realmente geram serviço.',
  hora_cobrada: 'Referência para precificar serviços no catálogo (horas × esta taxa).',
  markup_pecas: 'Percentual somado ao custo da peça no catálogo.',
  precificacao_automatica: 'Quando ligado, o preço da peça é calculado pelo custo + acréscimo.',
  taxa_cartao_debito: 'Percentual cobrado pela maquininha ou adquirente no débito.',
  taxa_cartao_credito: 'Percentual cobrado pela maquininha ou adquirente no crédito.'
} as const

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
    taxa_cartao_credito: 3.5
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
    taxa_cartao_credito: Number(row.taxa_cartao_credito)
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

/** Seed de serviço: horas × hora cobrada sugerida. */
export function calcServiceSeedPrice(hours: number, hourlyRate: number): number {
  return roundMoney(Math.max(Number(hours) || 0, 0) * Math.max(Number(hourlyRate) || 0, 0))
}

export function suggestChargeAmount(
  budgetTotal: number,
  forma: 'dinheiro' | 'pix' | 'cartao_debito' | 'cartao_credito' | undefined,
  fees: { debito: number, credito: number }
): number {
  const total = roundMoney(Number(budgetTotal) || 0)
  if (!forma || forma === 'dinheiro' || forma === 'pix') return total
  const fee = forma === 'cartao_debito' ? fees.debito : fees.credito
  return calcChargeToNet(total, fee)
}
