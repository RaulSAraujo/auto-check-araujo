import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { OrdemItem } from '~~/shared/types/database'
import {
  ORCAMENTO_STATUS_LABEL,
  ORDEM_ITEM_TIPO_LABEL,
  type OrcamentoStatus
} from '~~/shared/types/oficina'
import { calcItemSubtotal, calcItemsTotal, formatMoney } from './budget'
import { WORKSHOP_NAME } from './print'

export type BudgetPdfInput = {
  numero: string
  abertaEm: string
  budgetStatus: OrcamentoStatus
  clienteNome: string | null
  placa: string | null
  veiculoLabel: string | null
  kmEntrada: number | null
  reclamacao: string | null
  diagnostico?: string | null
  items: Pick<OrdemItem, 'tipo' | 'descricao' | 'quantidade' | 'valor_unitario'>[]
}

function safeFilename(value: string): string {
  return value.replace(/[^\w.-]+/g, '_').replace(/_+/g, '_')
}

function formatPlacaPdf(placa: string | null): string {
  if (!placa) return '-'
  const clean = placa.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  if (clean.length === 7) return `${clean.slice(0, 3)}-${clean.slice(3)}`
  return placa
}

function addDocumentHeader(
  doc: jsPDF,
  title: string,
  metaRight: string[]
): number {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(WORKSHOP_NAME, 14, 18)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(title, 14, 26)

  doc.setFontSize(9)
  metaRight.forEach((line, index) => {
    doc.text(line, 196, 18 + index * 5, { align: 'right' })
  })

  return 34
}

function addMetaBlock(
  doc: jsPDF,
  startY: number,
  rows: [string, string][]
): number {
  let y = startY
  doc.setFontSize(9)

  for (const [label, value] of rows) {
    doc.setFont('helvetica', 'bold')
    doc.text(`${label}:`, 14, y)
    doc.setFont('helvetica', 'normal')
    doc.text(value || '-', 42, y)
    y += 5
  }

  return y + 4
}

export async function downloadBudgetPdf(input: BudgetPdfInput): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const title = `Orçamento - ${input.numero}`

  let y = addDocumentHeader(doc, title, [
    input.abertaEm,
    ORCAMENTO_STATUS_LABEL[input.budgetStatus]
  ])

  y = addMetaBlock(doc, y, [
    ['Cliente', input.clienteNome || '-'],
    ['Veículo', input.placa ? formatPlacaPdf(input.placa) : '-'],
    ['Modelo', input.veiculoLabel || '-'],
    ['Km entrada', input.kmEntrada != null ? input.kmEntrada.toLocaleString('pt-BR') : '-']
  ])

  if (input.reclamacao?.trim()) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('Reclamação', 14, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const lines = doc.splitTextToSize(input.reclamacao.trim(), 182)
    doc.text(lines, 14, y)
    y += lines.length * 4.5 + 4
  }

  if (input.diagnostico?.trim()) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('Diagnóstico', 14, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const lines = doc.splitTextToSize(input.diagnostico.trim(), 182)
    doc.text(lines, 14, y)
    y += lines.length * 4.5 + 4
  }

  const body = input.items.map(item => [
    ORDEM_ITEM_TIPO_LABEL[item.tipo as keyof typeof ORDEM_ITEM_TIPO_LABEL] || item.tipo,
    item.descricao,
    Number(item.quantidade).toLocaleString('pt-BR'),
    formatMoney(Number(item.valor_unitario)),
    formatMoney(calcItemSubtotal(item))
  ])

  autoTable(doc, {
    startY: y,
    head: [['Tipo', 'Descrição', 'Qtd', 'Valor unit.', 'Subtotal']],
    body,
    foot: [[
      '',
      '',
      '',
      'Total',
      formatMoney(calcItemsTotal(input.items))
    ]],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [27, 122, 206], textColor: 255 },
    footStyles: { fillColor: [245, 245, 245], textColor: 23, fontStyle: 'bold' },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' }
    },
    margin: { left: 14, right: 14 }
  })

  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y
  doc.setFontSize(8)
  doc.setTextColor(115)
  doc.text(
    'Valores sujeitos a alteração após diagnóstico. Validade do orçamento: 7 dias.',
    14,
    finalY + 10
  )

  doc.save(`${safeFilename(`orcamento-${input.numero}`)}.pdf`)
}
