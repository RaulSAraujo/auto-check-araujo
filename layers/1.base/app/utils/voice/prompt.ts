import { VOICE_CATALOG, type VoiceEntity, type VoiceField } from './catalog.ts'
import type { VoiceContext, VoiceEntityKey, VoicePage } from './types.ts'

export interface VoiceChatMessage {
  role: 'system' | 'user'
  content: string
}

const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']

const PAGE_LABEL: Record<VoicePage, string> = {
  'order-detail': 'OS aberta',
  'order-new': 'nova OS',
  'customer-detail': 'cliente aberto',
  'customer-new': 'novo cliente',
  'vehicle-detail': 'veículo aberto',
  'vehicle-new': 'novo veículo',
  'scheduling': 'agenda',
  'finance': 'financeiro',
  'catalog': 'catálogo',
  'suppliers': 'fornecedores',
  'team': 'equipe',
  'pricing': 'precificação',
  'other': 'outra tela'
}

export const VOICE_PAGES = Object.keys(PAGE_LABEL) as VoicePage[]

const PAGE_BY_PATH: Record<string, VoicePage> = {
  '/ordens/novo': 'order-new',
  '/clientes/novo': 'customer-new',
  '/veiculos/novo': 'vehicle-new',
  '/agendamentos': 'scheduling',
  '/gestao/financeiro': 'finance',
  '/configuracao/catalogo': 'catalog',
  '/configuracao/fornecedores': 'suppliers',
  '/gestao/equipe': 'team',
  '/configuracao/precificacao': 'pricing'
}

const DETAIL_PAGES: [RegExp, VoicePage][] = [
  [/^\/ordens\/[^/]+$/, 'order-detail'],
  [/^\/clientes\/[^/]+$/, 'customer-detail'],
  [/^\/veiculos\/[^/]+$/, 'vehicle-detail']
]

const TYPE_HINT: Partial<Record<VoiceField['type'], string>> = {
  number: 'número', money: 'reais', date: 'YYYY-MM-DD', time: 'HH:MM', bool: 'true/false', placa: 'placa', digits: 'só dígitos', email: 'e-mail'
}

export function voicePageFromPath(path: string): VoicePage {
  return PAGE_BY_PATH[path] ?? DETAIL_PAGES.find(([re]) => re.test(path))?.[1] ?? 'other'
}

export function voiceEntitiesForPage(page: VoicePage): VoiceEntityKey[] {
  return (Object.keys(VOICE_CATALOG) as VoiceEntityKey[]).filter(key => VOICE_CATALOG[key].pages.includes(page))
}

export function localDateInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function weekday(today: string): string {
  const [y, m, d] = today.split('-').map(Number) as [number, number, number]
  return WEEKDAYS[new Date(y, m - 1, d).getDay()] ?? ''
}

function describeField(key: string, field: VoiceField): string {
  const hints = [
    field.values ? field.values.join('|') : TYPE_HINT[field.type],
    field.list ? 'lista' : undefined,
    field.hint
  ].filter(Boolean)
  return hints.length ? `${key} (${hints.join(', ')})` : key
}

function describeFields(spec: Record<string, VoiceField>): string {
  return Object.entries(spec).map(([key, field]) => describeField(key, field)).join(', ')
}

function describeDetailed(key: VoiceEntityKey, entity: VoiceEntity): string {
  const parts = [`- ${key} (${entity.label})`]
  const target = Object.keys(entity.target)
  if (target.length) parts.push(`target {${target.join(' | ')}}`)
  const fields = describeFields(entity.fields)
  if (fields) parts.push(`fields: ${fields}`)
  if (entity.items) parts.push(`items: [{${describeFields(entity.items)}}]`)
  const actions = Object.entries(entity.actions).map(([name, action]) => {
    const args = action.args ? `{${describeFields(action.args)}}` : ''
    return `${name}${args}${action.hint ? ` (${action.hint})` : ''}`
  })
  if (actions.length) parts.push(`actions: ${actions.join(', ')}`)
  return parts.join('; ')
}

function describeCompact(key: VoiceEntityKey, entity: VoiceEntity): string {
  const parts = [`- ${key} (${entity.label})`]
  const target = Object.keys(entity.target)
  if (target.length) parts.push(`target {${target.join(' | ')}}`)
  const fields = Object.keys(entity.fields)
  if (fields.length) parts.push(`fields: ${fields.join(', ')}`)
  if (entity.items) parts.push(`items: [{${Object.keys(entity.items).join(', ')}}]`)
  const actions = Object.entries(entity.actions).map(([name, action]) => action.args ? `${name}{${Object.keys(action.args).join(', ')}}` : name)
  if (actions.length) parts.push(`actions: ${actions.join(', ')}`)
  return parts.join('; ')
}

export function buildVoiceMessages(text: string, context: VoiceContext): VoiceChatMessage[] {
  const here = voiceEntitiesForPage(context.page)
  const all = Object.keys(VOICE_CATALOG) as VoiceEntityKey[]
  const detailed = here.map(key => describeDetailed(key, VOICE_CATALOG[key])).join('\n')
  const compact = all.filter(key => !here.includes(key)).map(key => describeCompact(key, VOICE_CATALOG[key])).join('\n')

  const system = `Você converte comandos falados de uma oficina mecânica brasileira em JSON.
Responda SOMENTE com um objeto JSON, em um destes formatos:
{"op":"create"|"edit","entity":"...","target":{...},"fields":{...},"items":[{...}]}
{"op":"action","entity":"...","target":{...},"action":"...","args":{...}}
{"op":"navigate","to":"home"|"orders"|"scheduling"|"customers"|"vehicles"|"finance"|"team"|"catalog"|"suppliers"|"pricing"|"settings","date":"YYYY-MM-DD só para a agenda"}
{"op":null} se não for um comando reconhecível.
Hoje é ${context.today} (${weekday(context.today)}). Tela atual: ${PAGE_LABEL[context.page]}.
${detailed ? `\nEntidades desta tela:\n${detailed}\n` : ''}
Outras entidades:
${compact}

Regras:
- create = cadastrar/criar/"nova OS"/"novo cliente". edit = abrir ou alterar registro existente ("abre a OS do…", "muda o km…"). action = executar uma ação da lista ("aprova", "paga", "remove", "desativa", "exclui", "faltou").
- target identifica o registro existente; omita target quando a frase se refere ao registro aberto na tela atual.
- Use só os nomes de fields/items/actions/args listados. Omita o que não foi dito; nunca invente valores. Nunca inclua senha.
- Vários itens na mesma frase: um objeto por item em "items".
- Datas "YYYY-MM-DD" a partir de hoje ("amanhã", "sexta", "dia 10"), sempre a data futura mais próxima. Horas "HH:MM" em 24h ("2 da tarde" = "14:00").
- Placa: 7 caracteres maiúsculos sem hífen (ABC1D23); converta letras e números soletrados.
- Valores em reais como número (150.5). "45 mil" = 45000. Porcentagem como número (10 = 10%).
- Textos: português correto, frase curta, sem repetir o nome do campo.`

  return [
    { role: 'system', content: system },
    { role: 'user', content: text }
  ]
}
