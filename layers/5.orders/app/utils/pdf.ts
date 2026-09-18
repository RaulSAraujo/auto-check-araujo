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
  doc.setTextColor(23, 43, 77)
  doc.setFontSize(16)
  doc.text(WORKSHOP_NAME, 14, 18)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(70, 84, 107)
  doc.setFontSize(10)
  doc.text(title, 14, 26)

  doc.setFontSize(8.5)
  metaRight.forEach((line, index) => {
    doc.text(line, 196, 18 + index * 5, { align: 'right' })
  })

  doc.setDrawColor(27, 122, 206)
  doc.setLineWidth(0.7)
  doc.line(14, 31, 196, 31)
  doc.setTextColor(0)

  return 34
}

function addMetaBlock(
  doc: jsPDF,
  startY: number,
  rows: [string, string][]
): number {
  let y = startY
  const values = rows.map(([, value]) => doc.splitTextToSize(value || '-', 142))
  const height = values.reduce((total, lines) => total + Math.max(7, lines.length * 4.5 + 2.5), 3)
  doc.setFillColor(247, 250, 252)
  doc.roundedRect(14, y - 4, 182, height, 1.5, 1.5, 'F')
  doc.setFontSize(9)

  for (const [index, [label]] of rows.entries()) {
    const lines = values[index]
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(70, 84, 107)
    doc.text(`${label}:`, 18, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0)
    doc.text(lines, 52, y)
    y += Math.max(7, lines.length * 4.5 + 2.5)
  }

  return y + 4
}

function addPageFooter(doc: jsPDF, pageNumber: number, pageCount: number): void {
  const pageHeight = doc.internal.pageSize.getHeight()
  doc.setDrawColor(220, 227, 235)
  doc.setLineWidth(0.2)
  doc.line(14, pageHeight - 15, 196, pageHeight - 15)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(90, 105, 125)
  doc.text('Orçamento de serviço', 14, pageHeight - 9)
  doc.text(`Página ${pageNumber} de ${pageCount}`, 196, pageHeight - 9, { align: 'right' })
  doc.setTextColor(0)
}

function ensureSpace(doc: jsPDF, y: number, requiredHeight: number, title: string): number {
  const pageHeight = doc.internal.pageSize.getHeight()
  if (y + requiredHeight <= pageHeight - 24) return y

  doc.addPage()
  return addDocumentHeader(doc, title, [])
}

function addTextSection(
  doc: jsPDF,
  startY: number,
  title: string,
  content: string,
  documentTitle: string
): number {
  const lines = doc.splitTextToSize(content.trim(), 182)
  const pageHeight = doc.internal.pageSize.getHeight()
  let y = startY
  let isFirstPage = true

  while (lines.length) {
    y = ensureSpace(doc, y, isFirstPage ? 14 : 5, documentTitle)
    if (isFirstPage) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text(title, 14, y)
      y += 5
    }

    const availableLines = Math.max(1, Math.floor((pageHeight - 24 - y) / 4.5))
    const pageLines = lines.splice(0, availableLines)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(pageLines, 14, y)
    y += pageLines.length * 4.5
    isFirstPage = false

    if (lines.length) {
      doc.addPage()
      y = addDocumentHeader(doc, documentTitle, [])
    }
  }

  return y + 6
}

function createBudgetPdf(input: BudgetPdfInput): jsPDF {
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
    y = addTextSection(doc, y, 'Reclamação', input.reclamacao, title)
  }

  if (input.diagnostico?.trim()) {
    y = addTextSection(doc, y, 'Diagnóstico', input.diagnostico, title)
  }

  y = ensureSpace(doc, y, 28, title)

  const body = input.items.length
    ? input.items.map(item => [
        ORDEM_ITEM_TIPO_LABEL[item.tipo as keyof typeof ORDEM_ITEM_TIPO_LABEL] || item.tipo,
        item.descricao,
        Number(item.quantidade).toLocaleString('pt-BR'),
        formatMoney(Number(item.valor_unitario)),
        formatMoney(calcItemSubtotal(item))
      ])
    : [['', 'Nenhum item adicionado ao orçamento.', '', '', '']]

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
    styles: { fontSize: 8.5, cellPadding: 2.5, valign: 'middle' },
    headStyles: { fillColor: [27, 122, 206], textColor: 255 },
    footStyles: { fillColor: [232, 241, 250], textColor: 23, fontStyle: 'bold' },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' }
    },
    margin: { left: 14, right: 14, bottom: 24 },
    showHead: 'everyPage'
  })

  let finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y
  finalY = ensureSpace(doc, finalY, 34, title)
  doc.setFontSize(8)
  doc.setTextColor(90, 105, 125)
  doc.text(
    'Valores sujeitos a alteração após diagnóstico. Validade do orçamento: 7 dias.',
    14,
    finalY + 10
  )
  doc.setDrawColor(90, 105, 125)
  doc.setLineWidth(0.2)
  doc.line(14, finalY + 27, 84, finalY + 27)
  doc.setFontSize(8)
  doc.text('Assinatura do cliente', 14, finalY + 32)

  const pageCount = doc.getNumberOfPages()
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
    doc.setPage(pageNumber)
    addPageFooter(doc, pageNumber, pageCount)
  }

  return doc
}

export function downloadBudgetPdf(input: BudgetPdfInput): void {
  const doc = createBudgetPdf(input)
  doc.save(`${safeFilename(`orcamento-${input.numero}`)}.pdf`)
}

export function printBudgetPdf(input: BudgetPdfInput): void {
  if (!import.meta.client) return

  const doc = createBudgetPdf(input)
  doc.autoPrint()
  window.open(doc.output('bloburl'), '_blank', 'noopener,noreferrer')
}
