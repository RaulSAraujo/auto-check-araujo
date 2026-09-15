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
  acrescimo_cartao_credito_parcela: number
  valor_minimo_servico: number
  fator_servico_rapido: number
  fator_servico_padrao: number
  fator_servico_tecnico: number
  fator_servico_especializado: number
}

export const SERVICE_TECHNICAL_LEVELS = ['rapido', 'padrao', 'tecnico', 'especializado'] as const
export type ServiceTechnicalLevel = typeof SERVICE_TECHNICAL_LEVELS[number]

export const SERVICE_TECHNICAL_LEVEL_ITEMS = [
  { label: 'Rápido', value: 'rapido' },
  { label: 'Padrão', value: 'padrao' },
  { label: 'Técnico', value: 'tecnico' },
  { label: 'Especializado', value: 'especializado' }
] as const

export const PRICING_EXAMPLE_PART_COST = 100
export const PRICING_EXAMPLE_SALE = 100
export function creditInstallmentFee(baseFee: number, installmentIncrease: number, installments: number): number {
  return roundMoney(Number(baseFee) + Math.max(0, installments - 1) * Number(installmentIncrease))
}

/** Ajuda por campo na tela de precificação (ícone ao lado do label). */
export const PRICING_FIELD_HELP = {
  valor_hora: 'Quanto a mão de obra custa por hora.',
  custo_fixo_mensal: 'Aluguel, luz, salários fixos e outros custos do mês.',
  margem_alvo: 'Percentual de lucro desejado sobre o custo da hora.',
  horas_produtivas_mes: 'Horas produtivas no mês que realmente geram serviço.',
  hora_cobrada: 'Base da sugestão: horas estimadas × fator técnico, respeitando o preço mínimo.',
  markup_pecas: 'Percentual somado ao custo da peça no catálogo.',
  precificacao_automatica: 'Quando ligado, o preço da peça é calculado pelo custo + acréscimo.',
  taxa_cartao_debito: 'Percentual cobrado pela maquininha ou adquirente no débito.',
  taxa_cartao_credito: 'Taxa total cobrada pela maquininha no crédito à vista (1x).',
  acrescimo_cartao_credito_parcela: 'Percentual adicional por parcela depois de 1x.',
  valor_minimo_servico: 'Menor valor de mão de obra cobrado, mesmo em serviços rápidos.',
  fatores_tecnicos: 'Ajustam a hora cobrada conforme especialização, risco e ferramental.'
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
    taxa_cartao_credito: 3.5,
    acrescimo_cartao_credito_parcela: 0,
    valor_minimo_servico: 150,
    fator_servico_rapido: 0.8,
    fator_servico_padrao: 1,
    fator_servico_tecnico: 1.35,
    fator_servico_especializado: 1.7
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
    acrescimo_cartao_credito_parcela: Number(row.acrescimo_cartao_credito_parcela ?? 0),
    valor_minimo_servico: Number(row.valor_minimo_servico),
    fator_servico_rapido: Number(row.fator_servico_rapido),
    fator_servico_padrao: Number(row.fator_servico_padrao),
    fator_servico_tecnico: Number(row.fator_servico_tecnico),
    fator_servico_especializado: Number(row.fator_servico_especializado)
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
    && draft.acrescimo_cartao_credito_parcela >= 0
    && draft.acrescimo_cartao_credito_parcela < 100
    && draft.valor_minimo_servico >= 0
    && draft.fator_servico_rapido > 0
    && draft.fator_servico_padrao > 0
    && draft.fator_servico_tecnico > 0
    && draft.fator_servico_especializado > 0
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

export function serviceTechnicalFactor(
  draft: Pick<PricingParamsDraft, 'fator_servico_rapido' | 'fator_servico_padrao' | 'fator_servico_tecnico' | 'fator_servico_especializado'>,
  level: ServiceTechnicalLevel
): number {
  return Number(draft[`fator_servico_${level}`])
}

export function calcServiceSuggestedPrice(input: {
  hours: number
  hourlyRate: number
  minimumServicePrice: number
  technicalFactor: number
}): number {
  return roundMoney(Math.max(
    Number(input.minimumServicePrice) || 0,
    Math.max(Number(input.hours) || 0, 0)
    * Math.max(Number(input.hourlyRate) || 0, 0)
    * Math.max(Number(input.technicalFactor) || 0, 0)
  ))
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
  horasEstimadas?: number | null
  nivelTecnico?: ServiceTechnicalLevel
  precoManual?: boolean
  servicePricing?: PricingParamsDraft
}): number {
  if (
    input.precificacaoAutomatica
    && input.tipo === 'peca'
    && Number(input.custo) > 0
  ) {
    return applyMarkup(input.custo, input.markupPecas)
  }
  if (
    input.tipo === 'servico'
    && !input.precoManual
    && Number(input.valorPadrao) <= 0
    && Number(input.horasEstimadas) > 0
    && input.nivelTecnico
    && input.servicePricing
  ) {
    return calcServiceSuggestedPrice({
      hours: Number(input.horasEstimadas),
      hourlyRate: calcSuggestedHourlyRate(input.servicePricing),
      minimumServicePrice: input.servicePricing.valor_minimo_servico,
      technicalFactor: serviceTechnicalFactor(input.servicePricing, input.nivelTecnico)
    })
  }
  return roundMoney(Number(input.valorPadrao) || 0)
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
