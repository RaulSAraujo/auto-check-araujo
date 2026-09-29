import type { VoiceContext, VoicePage } from './types.ts'

export interface VoiceChatMessage {
  role: 'system' | 'user'
  content: string
}

const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']

const PAGE_LABEL: Record<VoicePage, string> = {
  'order-detail': 'OS aberta',
  'customer-detail': 'cliente aberto',
  'vehicle-detail': 'veículo aberto',
  'scheduling': 'agenda',
  'other': 'outra tela'
}

const DETAIL_RE = (prefix: string) => new RegExp(`^/${prefix}/(?!novo$)[^/]+$`)

export function voicePageFromPath(path: string): VoicePage {
  if (DETAIL_RE('ordens').test(path)) return 'order-detail'
  if (DETAIL_RE('clientes').test(path)) return 'customer-detail'
  if (DETAIL_RE('veiculos').test(path)) return 'vehicle-detail'
  if (path === '/agendamentos') return 'scheduling'
  return 'other'
}

export function localDateInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function weekday(today: string): string {
  const [y, m, d] = today.split('-').map(Number) as [number, number, number]
  return WEEKDAYS[new Date(y, m - 1, d).getDay()] ?? ''
}

export function buildVoiceMessages(text: string, context: VoiceContext): VoiceChatMessage[] {
  const system = `Você converte comandos falados de uma oficina mecânica brasileira em JSON.
Responda SOMENTE com um objeto JSON: {"intent": <intenção ou null>, "payload": {...}}.
Hoje é ${context.today} (${weekday(context.today)}). Tela atual do usuário: ${PAGE_LABEL[context.page]}.

Intenções e campos do payload (omita campos não ditos; nunca invente valores):
- "customer.create": nome, telefones (lista, só dígitos com DDD), emails (lista), documento (CPF/CNPJ só dígitos), observacoes
- "vehicle.create": placa, marca, modelo, ano (número), cor, km_atual (número), observacoes, clienteNome
- "order.create": criar NOVA OS. placa, km_entrada, reclamacao (o que o cliente relata), diagnostico (o que o mecânico constatou), observacoes
- "order.edit": abrir ou alterar OS EXISTENTE. target {placa | numero (só dígitos) | clienteNome} (omita target quando a frase se refere à OS aberta na tela), km_entrada, reclamacao, diagnostico, observacoes, status ("aberta"|"em_andamento"|"concluida"|"cancelada"), itens (lista de {tipo: "servico"|"peca"|"kit", descricao, quantidade, valor_unitario})
- "customer.edit": abrir ou alterar cliente EXISTENTE. target {nome} (omita se for o cliente aberto na tela), telefones, emails, documento, observacoes
- "vehicle.edit": abrir ou alterar veículo EXISTENTE. target {placa} (omita se for o veículo aberto na tela), km_atual, cor, observacoes
- "appointment.create": placa, date, startTime, problema
- "appointment.reschedule": remarcar agendamento. placa, date, startTime
- "appointment.noShow": cliente faltou / não compareceu. placa
- "account.create": conta a pagar. descricao, valor, vencimento (data), categoriaNome, fornecedorNome, observacoes
- "catalogItem.create": item do catálogo. tipo ("servico"|"peca"|"kit"), nome, valor_padrao, custo, estoque, horas_estimadas
- "supplier.create": fornecedor. nome, telefone, email, observacoes
- "collaborator.create": nome, username, papel ("recepcao"|"mecanico"|"gerente"). NUNCA inclua senha.
- "navigate": ir para uma tela. to ("home"|"orders"|"scheduling"|"customers"|"vehicles"|"finance"|"team"|"catalog"|"suppliers"|"pricing"|"settings"), date (só para a agenda)

Regras:
- "nova OS", "abrir uma OS", "criar OS" = order.create. "abre a OS do/da…", "vai na OS…" ou qualquer alteração de OS existente = order.edit.
- Na tela "OS aberta", frases como "diagnóstico…", "cliente reclama…", "km…", "adiciona…", "muda o status…" são order.edit sem target. Nas telas "cliente aberto" e "veículo aberto", o mesmo vale para customer.edit e vehicle.edit.
- Datas no formato "YYYY-MM-DD" calculadas a partir de hoje ("amanhã", "sexta", "dia 10"), sempre a data futura mais próxima. Horas "HH:MM" em 24h ("2 da tarde" = "14:00").
- Placa: 7 caracteres maiúsculos sem hífen (ex.: ABC1D23); converta letras e números soletrados.
- Valores em reais como número decimal (150.5). "45 mil" = 45000.
- Textos (reclamacao, diagnostico, observacoes, problema): português correto, frase curta, sem repetir o nome do campo.
- Se não for um comando reconhecível: {"intent": null, "payload": {}}.`

  return [
    { role: 'system', content: system },
    { role: 'user', content: text }
  ]
}
