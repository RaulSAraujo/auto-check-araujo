import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { AgendamentoStatus } from '~~/shared/types/oficina'
import { AGENDAMENTO_STATUS_LABEL } from '~~/shared/types/oficina'
import { formatDayHeading, formatTimeRange } from './scheduling'

export type SchedulingPdfRow = {
  inicio: string
  fim: string
  clienteNome: string
  placa: string
  servico: string | null
  patioVaga: number | null
  status: AgendamentoStatus
}

function safeFilename(value: string): string {
  return value.replace(/[^\w.-]+/g, '_').replace(/_+/g, '_')
}

function toDateStamp(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function downloadSchedulingDayPdf(day: Date, rows: SchedulingPdfRow[]) {
  const doc = new jsPDF()
  const titleDate = formatDayHeading(day)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(BRAND.businessName, 14, 18)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text('Agenda do dia', 14, 26)
  doc.setFontSize(10)
  doc.text(titleDate, 14, 32)

  autoTable(doc, {
    startY: 38,
    head: [['Horário', 'Cliente', 'Placa', 'Serviço', 'Pátio', 'Status']],
    body: rows.map(row => [
      formatTimeRange(row.inicio, row.fim),
      row.clienteNome,
      formatPlaca(row.placa),
      row.servico?.trim() || '—',
      row.patioVaga ? `Vaga ${row.patioVaga}` : '—',
      AGENDAMENTO_STATUS_LABEL[row.status]
    ]),
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [27, 122, 206] }
  })

  doc.save(`agenda_${safeFilename(toDateStamp(day))}.pdf`)
}
