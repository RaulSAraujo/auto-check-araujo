/** Commission fallback until oficina_parametros is loaded. */
export const DEFAULT_COMMISSION_RATE = 0.1

export type SalesPeriodPreset = 'month' | 'quarter' | 'year'

export type SalesOrderRow = {
  id: string
  numero: string
  aberto_por: string
  concluida_em: string | null
  valor_total: number | null
  pago: boolean
  pago_em: string | null
  forma_pagamento: string | null
  veiculos: { placa: string } | null
  profiles: { nome: string } | null
}

export type SalesSummary = {
  totalFaturado: number
  totalPago: number
  totalPendente: number
  qtdOs: number
  qtdPago: number
  qtdPendente: number
  ticketMedio: number
  comissao: number
}

export type SalesCollaboratorRow = {
  id: string
  nome: string
  qtdOs: number
  totalFaturado: number
  ticketMedio: number
  comissao: number
}

export const SALES_PERIOD_ITEMS = [
  { label: 'Mês', value: 'month' as const },
  { label: 'Trimestre', value: 'quarter' as const },
  { label: 'Ano', value: 'year' as const }
] as const

export function salesPeriodBounds(
  preset: SalesPeriodPreset,
  reference = new Date()
): { start: string, end: string } {
  const year = reference.getFullYear()
  const month = reference.getMonth()

  if (preset === 'month') {
    const start = new Date(Date.UTC(year, month, 1))
    const end = new Date(Date.UTC(year, month + 1, 1))
    return { start: start.toISOString(), end: end.toISOString() }
  }

  if (preset === 'quarter') {
    const quarterStart = Math.floor(month / 3) * 3
    const start = new Date(Date.UTC(year, quarterStart, 1))
    const end = new Date(Date.UTC(year, quarterStart + 3, 1))
    return { start: start.toISOString(), end: end.toISOString() }
  }

  const start = new Date(Date.UTC(year, 0, 1))
  const end = new Date(Date.UTC(year + 1, 0, 1))
  return { start: start.toISOString(), end: end.toISOString() }
}

export function calcCommission(
  amount: number,
  rate = DEFAULT_COMMISSION_RATE
): number {
  return Math.round(amount * rate * 100) / 100
}

export function summarizeSalesOrders(
  orders: SalesOrderRow[],
  rate = DEFAULT_COMMISSION_RATE
): SalesSummary {
  let totalFaturado = 0
  let totalPago = 0
  let totalPendente = 0
  let qtdPago = 0
  let qtdPendente = 0

  for (const order of orders) {
    const value = Number(order.valor_total) || 0
    totalFaturado += value
    if (order.pago) {
      totalPago += value
      qtdPago += 1
    } else {
      totalPendente += value
      qtdPendente += 1
    }
  }

  const qtdOs = orders.length
  return {
    totalFaturado,
    totalPago,
    totalPendente,
    qtdOs,
    qtdPago,
    qtdPendente,
    ticketMedio: qtdOs > 0 ? totalFaturado / qtdOs : 0,
    comissao: calcCommission(totalFaturado, rate)
  }
}

export function rankSalesCollaborators(
  orders: SalesOrderRow[],
  rate = DEFAULT_COMMISSION_RATE
): SalesCollaboratorRow[] {
  const byId = new Map<string, SalesCollaboratorRow>()

  for (const order of orders) {
    const id = order.aberto_por
    const value = Number(order.valor_total) || 0
    const existing = byId.get(id)
    if (existing) {
      existing.qtdOs += 1
      existing.totalFaturado += value
    } else {
      byId.set(id, {
        id,
        nome: order.profiles?.nome?.trim() || 'Colaborador',
        qtdOs: 1,
        totalFaturado: value,
        ticketMedio: 0,
        comissao: 0
      })
    }
  }

  return Array.from(byId.values())
    .map(row => ({
      ...row,
      ticketMedio: row.qtdOs > 0 ? row.totalFaturado / row.qtdOs : 0,
      comissao: calcCommission(row.totalFaturado, rate)
    }))
    .sort((a, b) => b.totalFaturado - a.totalFaturado)
}

export function salesOrdersToCsv(orders: SalesOrderRow[]): string {
  const header = [
    'OS',
    'Placa',
    'Colaborador',
    'Concluida em',
    'Valor',
    'Pago',
    'Forma pagamento'
  ]

  const lines = orders.map((order) => {
    const placa = order.veiculos?.placa || ''
    const nome = order.profiles?.nome || ''
    const valor = order.valor_total != null ? String(order.valor_total) : ''
    return [
      order.numero,
      placa,
      nome,
      order.concluida_em || '',
      valor,
      order.pago ? 'sim' : 'nao',
      order.forma_pagamento || ''
    ]
      .map(escapeCsvCell)
      .join(',')
  })

  return [header.join(','), ...lines].join('\n')
}

function escapeCsvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`
  }
  return value
}
