# Voz v2 (IA + edição + ditado contínuo) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fala livre interpretada por IA gratuita (Groq → Gemini → parser local), capaz de criar, abrir e editar OS/cliente/veículo/agendamento e navegar, com ditado contínuo em partes.

**Architecture:** Funções puras em `layers/1.base/app/utils/voice/` (prompt, normalização, `appendText`) testadas com `node:test`. Rota `server/api/voice/interpret.post.ts` chama provedores OpenAI-compatíveis com fallback e devolve um `VoiceCommand` normalizado. `useVoiceCommand` resolve alvo/ids, grava draft (`useVoiceDraft`) e navega; páginas de detalhe consomem o draft e pré-preenchem (usuário salva).

**Tech Stack:** Nuxt 4 (Nitro), Vue 3, Nuxt UI v4, Supabase, Web Speech API, `fetch` nativo, `node:test` (Node 24 type stripping).

**Spec:** `docs/superpowers/specs/2026-09-29-voice-ai-edit-design.md`

## Global Constraints

- Sem dependências novas. IA só via `fetch` para endpoints OpenAI-compatíveis.
- A voz **nunca grava** no banco: só pré-preenche; usuário salva. Senha de colaborador nunca é preenchida.
- Chaves só no servidor: `runtimeConfig.groqApiKey`, `geminiApiKey`, `groqModel` (`openai/gpt-oss-120b`), `groqFallbackModel` (`openai/gpt-oss-20b`), `geminiModel` (`gemini-3.5-flash-lite`); env `NUXT_GROQ_API_KEY`, `NUXT_GEMINI_API_KEY`, `NUXT_GROQ_MODEL`, `NUXT_GROQ_FALLBACK_MODEL`, `NUXT_GEMINI_MODEL`. (Os trechos de código das tasks abaixo mostram a cadeia original; a implementada está na spec.)
- Endpoints: Groq `https://api.groq.com/openai/v1/chat/completions`; Gemini `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`.
- Código em inglês; UI/toasts/prompt em português.
- `layers/1.base/app/utils/voice/*.ts` e `server/utils/voice-providers.ts`: **TypeScript apagável**, **zero imports de Nuxt/Vue**, imports relativos **com extensão `.ts`** (rodam em `node --test`). Pasta `utils/voice/` não é auto-importada: importar explicitamente (em páginas de outras layers: `#layers/base/app/utils/voice/...`).
- Payloads/drafts **omitem chaves ausentes** (nunca `{ campo: undefined }`).
- Datas `YYYY-MM-DD` (hora local), horas `HH:MM`, placa `/^[A-Z]{3}\d[A-Z0-9]\d{2}$/`.
- Texto ditado em diagnóstico/reclamação/observações é **acrescentado** (`appendText`), nunca substitui.
- Commits: `:sparkles: feat(voice): ...` (Conventional Commits com emoji, inglês, imperativo, minúscula, sem ponto). `git add` **só os arquivos da task**; se houver `index.lock`, aguardar 2 s e repetir.
- Verificação: `pnpm test`, `npx nuxt typecheck`, `pnpm lint` (sem erros novos). Rodar pnpm/graphify fora do sandbox se falharem.
- Toda exploração começa com `graphify query "<pergunta>"` na raiz; depois Read/Grep.

---

## File Structure

| Arquivo | Task | Responsabilidade |
|---|---|---|
| `layers/1.base/app/utils/voice/types.ts` | 1 | Novas intenções, payloads, drafts, `VoicePage`, `VoiceNavTarget`, exemplos |
| `layers/1.base/app/utils/voice/normalize.ts` (+ `.test.ts`) | 1 | Fronteira de confiança da saída da IA |
| `layers/1.base/app/utils/voice/prompt.ts` (+ `.test.ts`) | 1 | Mensagens da IA, `voicePageFromPath`, `localDateInput` |
| `layers/1.base/app/utils/voice/text.ts` (+ `text.test.ts`) | 1 | `appendText` |
| `server/utils/voice-providers.ts` (+ `.test.ts`) | 2 | Fallback Groq → Gemini |
| `server/api/voice/interpret.post.ts` | 2 | Rota autenticada |
| `nuxt.config.ts`, `.env.example`, `package.json` | 2 | Config e script de teste |
| `layers/1.base/app/composables/useSpeechRecognition.ts` | 3 | Ditado contínuo |
| `layers/1.base/app/components/VoiceCommandButton.vue` | 3 | Modal acumulativo |
| `layers/1.base/app/composables/useVoiceLookup.ts` | 3 | `findOrderId`, `findNextAppointment` |
| `layers/1.base/app/composables/useVoiceCommand.ts` | 3 | IA + fallback + dispatch das novas intenções |
| `layers/1.base/app/composables/useVoiceDraft.ts` | 4 | Filtro `accept` |
| `layers/5.orders/app/composables/useOrderBudgetPage.ts`, `layers/5.orders/app/pages/orders-[id].vue` | 4 | `order.edit` |
| `layers/4.customers/app/pages/customers-[id].vue` | 4 | `customer.edit` |
| `layers/10.vehicles/app/pages/vehicles-[id].vue` | 4 | `vehicle.edit` |
| `layers/11.scheduling/app/pages/scheduling.vue`, `layers/11.scheduling/app/components/SchedulingFormSlideover.vue` | 4 | `appointment.reschedule` / `appointment.noShow` |

Ordem: **Task 1** → (**Task 2** ∥ **Task 3** ∥ **Task 4**) → **Task 5**.

---

### Task 1: Tipos + funções puras (normalize, prompt, appendText)

**Files:**
- Modify: `layers/1.base/app/utils/voice/types.ts`
- Create: `layers/1.base/app/utils/voice/normalize.ts`, `layers/1.base/app/utils/voice/normalize.test.ts`
- Create: `layers/1.base/app/utils/voice/prompt.ts`, `layers/1.base/app/utils/voice/prompt.test.ts`
- Modify: `layers/1.base/app/utils/voice/text.ts`, `layers/1.base/app/utils/voice/text.test.ts`

**Interfaces:**
- Produces:
  - `types.ts`: `VoiceIntent` (+ `'order.edit' | 'customer.edit' | 'vehicle.edit' | 'appointment.reschedule' | 'appointment.noShow' | 'navigate'`), `VoicePage`, `VoiceNavTarget`, `VoiceOrderStatus`, `VoiceContext`, payloads novos, `VoiceDraftMap` com drafts novos, `VOICE_EXAMPLES` novo.
  - `normalizeVoiceCommand(raw: unknown): VoiceCommand | null`
  - `buildVoiceMessages(text: string, context: VoiceContext): VoiceChatMessage[]`; `VoiceChatMessage = { role: 'system' | 'user', content: string }`
  - `voicePageFromPath(path: string): VoicePage`; `localDateInput(date: Date): string`
  - `appendText(current: string | null | undefined, addition: string | undefined): string`

- [ ] **Step 1: Estender `types.ts`**

Adicionar ao union `VoiceIntent` (depois de `'collaborator.create'`):

```ts
    | 'order.edit'
    | 'customer.edit'
    | 'vehicle.edit'
    | 'appointment.reschedule'
    | 'appointment.noShow'
    | 'navigate'
```

Adicionar após `VoicePapel`:

```ts
export type VoiceOrderStatus = 'aberta' | 'em_andamento' | 'concluida' | 'cancelada'
export type VoicePage = 'order-detail' | 'customer-detail' | 'vehicle-detail' | 'scheduling' | 'other'
export type VoiceNavTarget
  = | 'home' | 'orders' | 'scheduling' | 'customers' | 'vehicles'
    | 'finance' | 'team' | 'catalog' | 'suppliers' | 'pricing' | 'settings'

export interface VoiceContext {
  page: VoicePage
  today: string
}
```

Adicionar após `VoiceCollaboratorPayload`:

```ts
export interface VoiceOrderEditPayload {
  target?: { placa?: string, numero?: string, clienteNome?: string }
  km_entrada?: number
  reclamacao?: string
  diagnostico?: string
  observacoes?: string
  status?: VoiceOrderStatus
  itens?: VoiceBudgetItemPayload[]
}

export interface VoiceCustomerEditPayload {
  target?: { nome?: string }
  telefones?: string[]
  emails?: string[]
  documento?: string
  observacoes?: string
}

export interface VoiceVehicleEditPayload {
  target?: { placa?: string }
  km_atual?: number
  cor?: string
  observacoes?: string
}

export interface VoiceAppointmentReschedulePayload {
  placa?: string
  date?: string
  startTime?: string
}

export interface VoiceAppointmentNoShowPayload {
  placa?: string
}

export interface VoiceNavigatePayload {
  to: VoiceNavTarget
  date?: string
}

export type VoiceBudgetItemDraft = VoiceBudgetItemPayload & { catalogItemId?: string }
```

Em `VoicePayloadMap` acrescentar:

```ts
  'order.edit': VoiceOrderEditPayload
  'customer.edit': VoiceCustomerEditPayload
  'vehicle.edit': VoiceVehicleEditPayload
  'appointment.reschedule': VoiceAppointmentReschedulePayload
  'appointment.noShow': VoiceAppointmentNoShowPayload
  'navigate': VoiceNavigatePayload
```

Em `VoiceDraftMap`: trocar a linha de `budgetItem.create` por `'budgetItem.create': VoiceBudgetItemDraft & { orderId: string }` e acrescentar:

```ts
  'order.edit': Omit<VoiceOrderEditPayload, 'target' | 'itens'> & { orderId: string, item?: VoiceBudgetItemDraft }
  'customer.edit': Omit<VoiceCustomerEditPayload, 'target'> & { clienteId: string }
  'vehicle.edit': Omit<VoiceVehicleEditPayload, 'target'> & { veiculoId: string }
  'appointment.reschedule': { appointmentId: string, inicio: string, date?: string, startTime?: string }
  'appointment.noShow': { appointmentId: string, inicio: string }
  'navigate': VoiceNavigatePayload
```

Substituir `VOICE_EXAMPLES`:

```ts
export const VOICE_EXAMPLES: readonly string[] = [
  'Abre a OS do ABC1D23 e coloca no diagnóstico pastilha de freio gasta',
  'Cliente reclama de barulho na roda dianteira, km 45 mil (com a OS aberta)',
  'Adiciona duas pastilhas de freio a 150 reais cada',
  'Muda o status da OS para em andamento',
  'Nova OS para o ABC1D23, carro falhando na partida',
  'Novo cliente João da Silva, telefone 11 98888 7777',
  'Cadastra o veículo ABC1D23, Fiat Uno 2015 prata, do cliente João',
  'Atualiza o km do ABC1D23 para 52 mil',
  'Agenda o ABC1D23 amanhã às 14h para revisão',
  'Remarca o ABC1D23 para sexta às 10h',
  'Abre a agenda de amanhã',
  'Conta de energia de 350 reais vence dia 10'
]
```

- [ ] **Step 2: Escrever `normalize.test.ts` (falhando)**

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeVoiceCommand } from './normalize.ts'

test('rejects unknown, null and malformed input', () => {
  assert.equal(normalizeVoiceCommand(null), null)
  assert.equal(normalizeVoiceCommand('x'), null)
  assert.equal(normalizeVoiceCommand({ intent: null, payload: {} }), null)
  assert.equal(normalizeVoiceCommand({ intent: 'drop.table', payload: {} }), null)
  assert.equal(normalizeVoiceCommand({ intent: 'navigate', payload: { to: 'hack' } }), null)
})

test('order.edit keeps only valid fields', () => {
  assert.deepEqual(normalizeVoiceCommand({
    intent: 'order.edit',
    payload: {
      target: { placa: 'abc-1d23', numero: 'OS 0012', lixo: 1 },
      km_entrada: '45000',
      diagnostico: '  pastilha gasta ',
      reclamacao: '',
      status: 'em_andamento',
      itens: [{ tipo: 'peca', descricao: 'Pastilha', quantidade: 2, valor_unitario: 150.5 }, { tipo: 'x' }],
      senha: '123'
    }
  }), {
    intent: 'order.edit',
    payload: {
      target: { placa: 'ABC1D23', numero: '12' },
      km_entrada: 45000,
      diagnostico: 'pastilha gasta',
      status: 'em_andamento',
      itens: [
        { tipo: 'peca', descricao: 'Pastilha', quantidade: 2, valor_unitario: 150.5 },
        { tipo: 'servico' }
      ]
    }
  })
})

test('order.edit drops invalid status, plate and empty target', () => {
  assert.deepEqual(normalizeVoiceCommand({
    intent: 'order.edit',
    payload: { target: { placa: 'XYZ' }, status: 'voando', km_entrada: -3 }
  }), { intent: 'order.edit', payload: {} })
})

test('customer.edit normalizes contacts', () => {
  assert.deepEqual(normalizeVoiceCommand({
    intent: 'customer.edit',
    payload: { target: { nome: 'João' }, telefones: '(11) 98888-7777', emails: ['JOAO@Gmail.com', 'ruim'], documento: '123.456.789-09' }
  }), {
    intent: 'customer.edit',
    payload: { target: { nome: 'João' }, telefones: ['11988887777'], emails: ['joao@gmail.com'], documento: '12345678909' }
  })
})

test('appointment and navigate validate date and time', () => {
  assert.deepEqual(normalizeVoiceCommand({
    intent: 'appointment.reschedule',
    payload: { placa: 'ABC1D23', date: '2026-10-02', startTime: '9:30' }
  }), { intent: 'appointment.reschedule', payload: { placa: 'ABC1D23', date: '2026-10-02', startTime: '09:30' } })
  assert.deepEqual(normalizeVoiceCommand({
    intent: 'appointment.create',
    payload: { placa: 'ABC1D23', date: '2026-02-30', startTime: '25:00', problema: 'revisão' }
  }), { intent: 'appointment.create', payload: { placa: 'ABC1D23', problema: 'revisão' } })
  assert.deepEqual(normalizeVoiceCommand({
    intent: 'navigate',
    payload: { to: 'scheduling', date: '2026-09-30' }
  }), { intent: 'navigate', payload: { to: 'scheduling', date: '2026-09-30' } })
})

test('collaborator.create never carries a password', () => {
  assert.deepEqual(normalizeVoiceCommand({
    intent: 'collaborator.create',
    payload: { nome: 'Pedro', username: 'Pedro', papel: 'mecanico', senha: '1234', password: 'x' }
  }), { intent: 'collaborator.create', payload: { nome: 'Pedro', username: 'pedro', papel: 'mecanico' } })
})

test('create intents map money and numbers', () => {
  assert.deepEqual(normalizeVoiceCommand({
    intent: 'account.create',
    payload: { descricao: 'Energia', valor: '350,90', vencimento: '2026-10-10', categoriaNome: 'Luz' }
  }), { intent: 'account.create', payload: { descricao: 'Energia', valor: 350.9, vencimento: '2026-10-10', categoriaNome: 'Luz' } })
  assert.deepEqual(normalizeVoiceCommand({
    intent: 'catalogItem.create',
    payload: { nome: 'Alinhamento', valor_padrao: 80 }
  }), { intent: 'catalogItem.create', payload: { tipo: 'servico', nome: 'Alinhamento', valor_padrao: 80 } })
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `node --test layers/1.base/app/utils/voice/normalize.test.ts`
Expected: FAIL (`Cannot find module ... normalize.ts`).

- [ ] **Step 4: Implementar `normalize.ts`**

```ts
import type {
  VoiceBudgetItemPayload,
  VoiceCommand,
  VoiceIntent,
  VoiceItemTipo,
  VoiceNavTarget,
  VoiceOrderStatus,
  VoicePapel
} from './types.ts'

type Obj = Record<string, unknown>

const PLACA_RE = /^[A-Z]{3}\d[A-Z0-9]\d{2}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TIPOS: readonly VoiceItemTipo[] = ['servico', 'peca', 'kit']
const PAPEIS: readonly VoicePapel[] = ['recepcao', 'mecanico', 'gerente']
const STATUSES: readonly VoiceOrderStatus[] = ['aberta', 'em_andamento', 'concluida', 'cancelada']
const NAV_TARGETS: readonly VoiceNavTarget[] = [
  'home', 'orders', 'scheduling', 'customers', 'vehicles',
  'finance', 'team', 'catalog', 'suppliers', 'pricing', 'settings'
]

function isObj(value: unknown): value is Obj {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function compact<T extends Obj>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T
}

function str(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, 1000) : undefined
}

function num(value: unknown): number | undefined {
  const n = typeof value === 'string' ? Number(value.replace(',', '.')) : value
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 ? n : undefined
}

function digits(value: unknown): string | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined
  const only = String(value).replace(/\D/g, '')
  return only || undefined
}

function placa(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
  return PLACA_RE.test(normalized) ? normalized : undefined
}

function date(value: unknown): string | undefined {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return undefined
  const [y, m, d] = value.split('-').map(Number) as [number, number, number]
  const parsed = new Date(y, m - 1, d)
  return parsed.getFullYear() === y && parsed.getMonth() === m - 1 && parsed.getDate() === d ? value : undefined
}

function time(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const padded = value.trim().padStart(5, '0')
  return TIME_RE.test(padded) ? padded : undefined
}

function email(value: unknown): string | undefined {
  const s = str(value)?.toLowerCase().replace(/\s+/g, '')
  return s && EMAIL_RE.test(s) ? s : undefined
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return allowed.includes(value as T) ? value as T : undefined
}

function list<T>(value: unknown, pick: (item: unknown) => T | undefined): T[] | undefined {
  const items = Array.isArray(value) ? value : [value]
  const out = items.map(pick).filter((item): item is T => item !== undefined)
  return out.length ? out : undefined
}

function obj(value: unknown): Obj {
  return isObj(value) ? value : {}
}

function nonEmpty<T extends Obj>(value: T): T | undefined {
  const cleaned = compact(value)
  return Object.keys(cleaned).length ? cleaned : undefined
}

function budgetItem(value: unknown): VoiceBudgetItemPayload | undefined {
  if (!isObj(value)) return undefined
  return compact({
    tipo: oneOf(value.tipo, TIPOS) ?? 'servico',
    descricao: str(value.descricao),
    quantidade: num(value.quantidade),
    valor_unitario: num(value.valor_unitario)
  })
}

function orderNumero(value: unknown): string | undefined {
  return digits(value)?.replace(/^0+(?=\d)/, '')
}

const PICKERS: { [K in VoiceIntent]: (p: Obj) => Extract<VoiceCommand, { intent: K }>['payload'] | undefined } = {
  'customer.create': p => compact({
    nome: str(p.nome),
    telefones: list(p.telefones, digits),
    emails: list(p.emails, email),
    documento: digits(p.documento),
    observacoes: str(p.observacoes)
  }),
  'vehicle.create': p => compact({
    placa: placa(p.placa),
    marca: str(p.marca),
    modelo: str(p.modelo),
    ano: num(p.ano),
    cor: str(p.cor),
    km_atual: num(p.km_atual),
    observacoes: str(p.observacoes),
    clienteNome: str(p.clienteNome)
  }),
  'order.create': p => compact({
    placa: placa(p.placa),
    km_entrada: num(p.km_entrada),
    reclamacao: str(p.reclamacao),
    diagnostico: str(p.diagnostico),
    observacoes: str(p.observacoes)
  }),
  'appointment.create': p => compact({
    placa: placa(p.placa),
    date: date(p.date),
    startTime: time(p.startTime),
    problema: str(p.problema)
  }),
  'budgetItem.create': p => budgetItem(p),
  'account.create': p => compact({
    descricao: str(p.descricao),
    valor: num(p.valor),
    vencimento: date(p.vencimento),
    categoriaNome: str(p.categoriaNome),
    fornecedorNome: str(p.fornecedorNome),
    observacoes: str(p.observacoes)
  }),
  'catalogItem.create': p => compact({
    tipo: oneOf(p.tipo, TIPOS) ?? 'servico',
    nome: str(p.nome),
    valor_padrao: num(p.valor_padrao),
    custo: num(p.custo),
    estoque: num(p.estoque),
    horas_estimadas: num(p.horas_estimadas)
  }),
  'supplier.create': p => compact({
    nome: str(p.nome),
    telefone: digits(p.telefone),
    email: email(p.email),
    observacoes: str(p.observacoes)
  }),
  'collaborator.create': p => compact({
    nome: str(p.nome),
    username: str(p.username)?.toLowerCase().split(/\s+/)[0],
    papel: oneOf(p.papel, PAPEIS)
  }),
  'order.edit': (p) => {
    const t = obj(p.target)
    return compact({
      target: nonEmpty({ placa: placa(t.placa), numero: orderNumero(t.numero), clienteNome: str(t.clienteNome) }),
      km_entrada: num(p.km_entrada),
      reclamacao: str(p.reclamacao),
      diagnostico: str(p.diagnostico),
      observacoes: str(p.observacoes),
      status: oneOf(p.status, STATUSES),
      itens: list(p.itens, budgetItem)
    })
  },
  'customer.edit': (p) => {
    const t = obj(p.target)
    return compact({
      target: nonEmpty({ nome: str(t.nome) }),
      telefones: list(p.telefones, digits),
      emails: list(p.emails, email),
      documento: digits(p.documento),
      observacoes: str(p.observacoes)
    })
  },
  'vehicle.edit': (p) => {
    const t = obj(p.target)
    return compact({
      target: nonEmpty({ placa: placa(t.placa) }),
      km_atual: num(p.km_atual),
      cor: str(p.cor),
      observacoes: str(p.observacoes)
    })
  },
  'appointment.reschedule': p => compact({
    placa: placa(p.placa),
    date: date(p.date),
    startTime: time(p.startTime)
  }),
  'appointment.noShow': p => compact({ placa: placa(p.placa) }),
  'navigate': (p) => {
    const to = oneOf(p.to, NAV_TARGETS)
    return to ? compact({ to, date: date(p.date) }) : undefined
  }
}

/** Trust boundary: nothing produced by the AI reaches the app without passing here. */
export function normalizeVoiceCommand(raw: unknown): VoiceCommand | null {
  if (!isObj(raw) || typeof raw.intent !== 'string') return null
  if (!Object.hasOwn(PICKERS, raw.intent)) return null
  const intent = raw.intent as VoiceIntent
  const pick = PICKERS[intent] as (p: Obj) => VoiceCommand['payload'] | undefined
  const payload = pick(obj(raw.payload))
  return payload ? { intent, payload } as VoiceCommand : null
}
```

- [ ] **Step 5: Rodar normalize e ver passar**

Run: `node --test layers/1.base/app/utils/voice/normalize.test.ts`
Expected: PASS (7 testes).

- [ ] **Step 6: Escrever `prompt.test.ts` (falhando)**

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { buildVoiceMessages, localDateInput, voicePageFromPath } from './prompt.ts'

test('buildVoiceMessages embeds date, weekday, page and speech', () => {
  const messages = buildVoiceMessages('diagnóstico pastilha gasta', { page: 'order-detail', today: '2026-09-29' })
  assert.equal(messages.length, 2)
  assert.equal(messages[0]?.role, 'system')
  assert.match(messages[0]!.content, /2026-09-29/)
  assert.match(messages[0]!.content, /terça-feira/)
  assert.match(messages[0]!.content, /OS aberta/)
  assert.match(messages[0]!.content, /NUNCA inclua senha/)
  assert.deepEqual(messages[1], { role: 'user', content: 'diagnóstico pastilha gasta' })
})

test('voicePageFromPath', () => {
  assert.equal(voicePageFromPath('/ordens/abc-123'), 'order-detail')
  assert.equal(voicePageFromPath('/ordens/novo'), 'other')
  assert.equal(voicePageFromPath('/ordens'), 'other')
  assert.equal(voicePageFromPath('/clientes/xyz'), 'customer-detail')
  assert.equal(voicePageFromPath('/veiculos/xyz'), 'vehicle-detail')
  assert.equal(voicePageFromPath('/veiculos/novo'), 'other')
  assert.equal(voicePageFromPath('/agendamentos'), 'scheduling')
})

test('localDateInput uses local calendar date', () => {
  assert.equal(localDateInput(new Date(2026, 0, 5, 23, 59)), '2026-01-05')
})
```

- [ ] **Step 7: Rodar e ver falhar**

Run: `node --test layers/1.base/app/utils/voice/prompt.test.ts`
Expected: FAIL (módulo inexistente).

- [ ] **Step 8: Implementar `prompt.ts`**

```ts
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
```

- [ ] **Step 9: Rodar prompt e ver passar**

Run: `node --test layers/1.base/app/utils/voice/prompt.test.ts`
Expected: PASS (3 testes).

- [ ] **Step 10: Teste de `appendText` em `text.test.ts` (falhando)**

Acrescentar ao import existente `appendText` e ao fim do arquivo:

```ts
test('appendText', () => {
  assert.equal(appendText('', 'pastilha gasta'), 'pastilha gasta')
  assert.equal(appendText(null, 'pastilha gasta'), 'pastilha gasta')
  assert.equal(appendText('Barulho na roda', undefined), 'Barulho na roda')
  assert.equal(appendText('Barulho na roda', '  '), 'Barulho na roda')
  assert.equal(appendText('Barulho na roda', 'disco empenado'), 'Barulho na roda. disco empenado')
  assert.equal(appendText('Barulho na roda.', 'disco empenado'), 'Barulho na roda. disco empenado')
  assert.equal(appendText('Barulho na roda. Disco empenado', 'disco empenado'), 'Barulho na roda. Disco empenado')
})
```

Run: `node --test layers/1.base/app/utils/voice/text.test.ts` → Expected: FAIL (`appendText` não exportado).

- [ ] **Step 11: Implementar `appendText` em `text.ts`**

```ts
/** Voice adds to free-text fields instead of overwriting what was typed. */
export function appendText(current: string | null | undefined, addition: string | undefined): string {
  const base = (current ?? '').trim()
  const extra = (addition ?? '').trim()
  if (!extra) return base
  if (!base) return extra
  if (foldText(base).includes(foldText(extra))) return base
  return `${base}${/[.!?]$/.test(base) ? '' : '.'} ${extra}`
}
```

(`foldText` já existe em `text.ts`.)

- [ ] **Step 12: Rodar toda a suíte**

Run: `pnpm test`
Expected: PASS (todos os testes antigos + novos).

- [ ] **Step 13: Typecheck e lint**

`VOICE_INTENT_CONFIG` em `useVoiceCommand.ts` é `Record<VoiceIntent, ...>` e deixa de compilar com as intenções novas. Nesta task, só acrescente estas entradas a ele (a Task 3 reescreve o arquivo inteiro):

```ts
  'order.edit': { permission: 'orders.edit', path: null },
  'customer.edit': { permission: 'customers.write', path: null },
  'vehicle.edit': { permission: 'vehicles.write', path: null },
  'appointment.reschedule': { permission: 'scheduling.write', path: null },
  'appointment.noShow': { permission: 'scheduling.write', path: null },
  'navigate': { permission: 'orders.edit', path: null }
```

Run: `npx nuxt typecheck` e `pnpm lint`
Expected: exit 0.

- [ ] **Step 14: Commit**

```bash
git add layers/1.base/app/utils/voice/ layers/1.base/app/composables/useVoiceCommand.ts
git commit -m ":sparkles: feat(voice): add AI command normalization, prompt and edit intents"
```

---

### Task 2: Servidor — provedores com fallback + rota `/api/voice/interpret`

**Files:**
- Create: `server/utils/voice-providers.ts`, `server/utils/voice-providers.test.ts`
- Create: `server/api/voice/interpret.post.ts`
- Modify: `nuxt.config.ts` (bloco `runtimeConfig`), `.env.example`, `package.json` (script `test`)

**Interfaces:**
- Consumes (Task 1): `buildVoiceMessages`, `VoiceChatMessage`, `normalizeVoiceCommand`, `VoicePage`.
- Produces: `POST /api/voice/interpret` body `{ text: string, context: { page: VoicePage, today: 'YYYY-MM-DD' } }` → `200 { command: VoiceCommand | null }` | `400` | `401` | `503`.
- Produces: `completeWithFallback(providers: VoiceProvider[], messages: VoiceChatMessage[], options?: { fetch?: typeof fetch, timeoutMs?: number, onError?: (provider: string, reason: string) => void }): Promise<unknown | null>`; `VoiceProvider = { name: string, url: string, apiKey: string, model: string, extra?: Record<string, unknown> }`.

- [ ] **Step 1: Script de teste inclui `server/`**

Em `package.json`:

```json
"test": "node --test \"shared/**/*.test.ts\" \"layers/**/*.test.ts\" \"server/**/*.test.ts\""
```

- [ ] **Step 2: Escrever `voice-providers.test.ts` (falhando)**

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { completeWithFallback, type VoiceProvider } from './voice-providers.ts'

const messages = [{ role: 'user' as const, content: 'oi' }]
const groq: VoiceProvider = { name: 'groq', url: 'https://groq.test', apiKey: 'g', model: 'm1', extra: { reasoning_effort: 'low' } }
const gemini: VoiceProvider = { name: 'gemini', url: 'https://gemini.test', apiKey: 'k', model: 'm2' }

function reply(content: string, status = 200): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status })
}

function fakeFetch(handlers: Record<string, () => Response | Promise<Response>>) {
  const calls: { url: string, body: Record<string, unknown>, auth: string | null }[] = []
  const fn = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input)
    calls.push({ url, body: JSON.parse(String(init?.body)), auth: new Headers(init?.headers).get('Authorization') })
    const handler = handlers[url]
    if (!handler) throw new Error(`unexpected ${url}`)
    return handler()
  }) as typeof fetch
  return { fn, calls }
}

test('uses the first provider when it answers', async () => {
  const { fn, calls } = fakeFetch({ 'https://groq.test': () => reply('{"intent":"navigate","payload":{"to":"home"}}') })
  const result = await completeWithFallback([groq, gemini], messages, { fetch: fn })
  assert.deepEqual(result, { intent: 'navigate', payload: { to: 'home' } })
  assert.equal(calls.length, 1)
  assert.equal(calls[0]?.auth, 'Bearer g')
  assert.equal(calls[0]?.body.model, 'm1')
  assert.equal(calls[0]?.body.reasoning_effort, 'low')
  assert.deepEqual(calls[0]?.body.response_format, { type: 'json_object' })
})

test('falls back on 429', async () => {
  const errors: string[] = []
  const { fn, calls } = fakeFetch({
    'https://groq.test': () => new Response('limit', { status: 429 }),
    'https://gemini.test': () => reply('```json\n{"intent":null,"payload":{}}\n```')
  })
  const result = await completeWithFallback([groq, gemini], messages, { fetch: fn, onError: p => errors.push(p) })
  assert.deepEqual(result, { intent: null, payload: {} })
  assert.deepEqual(calls.map(c => c.url), ['https://groq.test', 'https://gemini.test'])
  assert.deepEqual(errors, ['groq'])
})

test('falls back on network error and invalid JSON', async () => {
  const { fn } = fakeFetch({
    'https://groq.test': () => { throw new Error('offline') },
    'https://gemini.test': () => reply('not json')
  })
  assert.equal(await completeWithFallback([groq, gemini], messages, { fetch: fn }), null)
})

test('falls back on timeout', async () => {
  const { fn } = fakeFetch({
    'https://groq.test': () => new Promise<Response>(() => {}),
    'https://gemini.test': () => reply('{"intent":null,"payload":{}}')
  })
  const slowAware = (async (input: string | URL | Request, init?: RequestInit) => {
    if (String(input) === 'https://groq.test') {
      return new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('timeout')))
      })
    }
    return fn(input, init)
  }) as typeof fetch
  const result = await completeWithFallback([groq, gemini], messages, { fetch: slowAware, timeoutMs: 20 })
  assert.deepEqual(result, { intent: null, payload: {} })
})

test('skips providers without key and returns null when none is configured', async () => {
  const { fn, calls } = fakeFetch({ 'https://gemini.test': () => reply('{"intent":null,"payload":{}}') })
  await completeWithFallback([{ ...groq, apiKey: '' }, gemini], messages, { fetch: fn })
  assert.deepEqual(calls.map(c => c.url), ['https://gemini.test'])
  assert.equal(await completeWithFallback([{ ...groq, apiKey: '' }], messages, { fetch: fn }), null)
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `node --test server/utils/voice-providers.test.ts`
Expected: FAIL (módulo inexistente).

- [ ] **Step 4: Implementar `server/utils/voice-providers.ts`**

```ts
export interface VoiceProvider {
  name: string
  url: string
  apiKey: string
  model: string
  extra?: Record<string, unknown>
}

export interface VoiceProviderMessage {
  role: 'system' | 'user'
  content: string
}

interface CompleteOptions {
  fetch?: typeof fetch
  timeoutMs?: number
  onError?: (provider: string, reason: string) => void
}

function parseContent(content: string): unknown {
  return JSON.parse(content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''))
}

/** Tries each configured OpenAI-compatible provider in order; any failure moves to the next one. */
export async function completeWithFallback(
  providers: VoiceProvider[],
  messages: VoiceProviderMessage[],
  options: CompleteOptions = {}
): Promise<unknown | null> {
  const doFetch = options.fetch ?? fetch
  for (const provider of providers) {
    if (!provider.apiKey) continue
    try {
      const response = await doFetch(provider.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`
        },
        body: JSON.stringify({
          model: provider.model,
          messages,
          temperature: 0,
          response_format: { type: 'json_object' },
          ...provider.extra
        }),
        signal: AbortSignal.timeout(options.timeoutMs ?? 10_000)
      })
      if (!response.ok) {
        options.onError?.(provider.name, `HTTP ${response.status}`)
        continue
      }
      const body = await response.json() as { choices?: { message?: { content?: string } }[] }
      const content = body.choices?.[0]?.message?.content
      if (!content) {
        options.onError?.(provider.name, 'empty response')
        continue
      }
      return parseContent(content)
    } catch (error) {
      options.onError?.(provider.name, error instanceof Error ? error.message : String(error))
    }
  }
  return null
}
```

Nota: o tipo de mensagem é declarado aqui (não importado de `layers/`) para o arquivo ficar autocontido em `node --test`; ele é estruturalmente idêntico a `VoiceChatMessage`.

- [ ] **Step 5: Rodar e ver passar**

Run: `node --test server/utils/voice-providers.test.ts`
Expected: PASS (5 testes).

- [ ] **Step 6: `runtimeConfig` e `.env.example`**

Em `nuxt.config.ts`, dentro de `runtimeConfig` (antes de `public`):

```ts
    groqApiKey: '',
    geminiApiKey: '',
    groqModel: 'openai/gpt-oss-120b',
    geminiModel: 'gemini-3.8-flash',
```

Ao fim de `.env.example`:

```bash

# Comandos de voz (IA gratuita). Groq primeiro; Gemini se o Groq falhar ou atingir o limite.
# Sem nenhuma chave, a voz usa o parser local de palavras-chave.
# https://console.groq.com/keys
NUXT_GROQ_API_KEY=
# https://aistudio.google.com/apikey
NUXT_GEMINI_API_KEY=
# Opcional: trocar modelos sem mexer no código
# NUXT_GROQ_MODEL=openai/gpt-oss-120b
# NUXT_GEMINI_MODEL=gemini-3.8-flash
```

- [ ] **Step 7: Rota `server/api/voice/interpret.post.ts`**

```ts
import { serverSupabaseUser } from '#supabase/server'
import { buildVoiceMessages } from '~~/layers/1.base/app/utils/voice/prompt'
import { normalizeVoiceCommand } from '~~/layers/1.base/app/utils/voice/normalize'
import type { VoicePage } from '~~/layers/1.base/app/utils/voice/types'
import { completeWithFallback } from '../../utils/voice-providers'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
const PAGES: readonly VoicePage[] = ['order-detail', 'customer-detail', 'vehicle-detail', 'scheduling', 'other']
const MAX_TEXT = 2000

type InterpretBody = {
  text?: unknown
  context?: { page?: unknown, today?: unknown }
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user?.sub) {
    throw createError({ statusCode: 401, message: 'Não autenticado' })
  }

  const body = await readBody<InterpretBody>(event)
  const text = typeof body?.text === 'string' ? body.text.trim() : ''
  const rawPage = body?.context?.page
  const page: VoicePage = PAGES.includes(rawPage as VoicePage) ? rawPage as VoicePage : 'other'
  const rawToday = body?.context?.today
  const today = typeof rawToday === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawToday) ? rawToday : ''

  if (!text || text.length > MAX_TEXT || !today) {
    throw createError({ statusCode: 400, message: 'Comando inválido' })
  }

  const config = useRuntimeConfig(event)
  const raw = await completeWithFallback(
    [
      { name: 'groq', url: GROQ_URL, apiKey: config.groqApiKey, model: config.groqModel, extra: { reasoning_effort: 'low' } },
      { name: 'gemini', url: GEMINI_URL, apiKey: config.geminiApiKey, model: config.geminiModel }
    ],
    buildVoiceMessages(text, { page, today }),
    { onError: (provider, reason) => console.warn(`[voice] ${provider} failed: ${reason}`) }
  )

  if (raw === null) {
    throw createError({ statusCode: 503, message: 'Interpretação por IA indisponível' })
  }

  return { command: normalizeVoiceCommand(raw) }
})
```

- [ ] **Step 8: Verificar**

Run: `pnpm test` → PASS. `npx nuxt typecheck` → exit 0. `pnpm lint` → exit 0.
Se o typecheck do servidor reclamar de import `.ts` dentro de `layers/1.base/app/utils/voice/*`, confirmar que `allowImportingTsExtensions` está `true` em `.nuxt/tsconfig.server.json` (está) e relatar o erro exato em vez de contornar.

- [ ] **Step 9: Smoke test da rota sem chave (opcional se `pnpm dev` não subir no sandbox)**

Com `pnpm dev` rodando: `curl -s -o /dev/null -w '%{http_code}' -X POST localhost:3000/api/voice/interpret -H 'content-type: application/json' -d '{"text":"oi","context":{"page":"other","today":"2026-09-29"}}'`
Expected: `401` (sem sessão). Parar o servidor depois.

- [ ] **Step 10: Commit**

```bash
git add server/utils/voice-providers.ts server/utils/voice-providers.test.ts server/api/voice/interpret.post.ts nuxt.config.ts .env.example package.json
git commit -m ":sparkles: feat(voice): add AI interpret endpoint with groq to gemini fallback"
```

---

### Task 3: Cliente — ditado contínuo, modal acumulativo, runtime com IA e novas intenções

**Files:**
- Modify: `layers/1.base/app/composables/useSpeechRecognition.ts` (reescrita)
- Modify: `layers/1.base/app/components/VoiceCommandButton.vue` (reescrita do script e rodapé)
- Modify: `layers/1.base/app/composables/useVoiceLookup.ts`
- Modify: `layers/1.base/app/composables/useVoiceCommand.ts` (reescrita)

**Interfaces:**
- Consumes (Task 1): tipos, `voicePageFromPath`, `localDateInput`, `VOICE_EXAMPLES`; (v1) `parseVoiceCommand`, `useVoiceDraft().setVoiceDraft/clearVoiceDraft`.
- Consumes (Task 2, só por contrato HTTP): `POST /api/voice/interpret` → `{ command }`; qualquer erro → parser local.
- Produces: `useSpeechRecognition()` → `{ supported, listening, interim, error, start, stop, cancel, onChunk }`; `useVoiceLookup()` → `{ findVehicleIdByPlaca, findUniqueIdByName, findOrderId, findNextAppointment }`; `useVoiceCommand().run(text): Promise<VoiceRunResult>` (mesmo contrato da v1).
- Drafts entregues (Task 4 consome): `order.edit` `{ orderId, ...campos, item? }`; `customer.edit` `{ clienteId, ... }`; `vehicle.edit` `{ veiculoId, ... }`; `appointment.reschedule` `{ appointmentId, inicio, date?, startTime? }`; `appointment.noShow` `{ appointmentId, inicio }`.

- [ ] **Step 1: Reescrever `useSpeechRecognition.ts`**

```ts
interface SpeechRecognitionResultLike {
  isFinal: boolean
  0?: { transcript: string }
}

interface SpeechRecognitionResultEventLike {
  resultIndex: number
  results: ArrayLike<SpeechRecognitionResultLike>
}

interface SpeechRecognitionErrorEventLike {
  error: string
}

interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  continuous: boolean
  maxAlternatives: number
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

function getRecognitionConstructor(): SpeechRecognitionConstructor | undefined {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

function errorMessage(code: string): string | null {
  if (code === 'not-allowed' || code === 'service-not-allowed') {
    return 'Permita o acesso ao microfone para usar comandos de voz.'
  }
  if (code === 'aborted' || code === 'no-speech') return null
  if (code === 'network') return 'Sem conexão para reconhecer a fala. Digite o comando.'
  return 'Não foi possível usar o microfone.'
}

export function useSpeechRecognition() {
  const supported = ref(false)
  const listening = ref(false)
  const interim = ref('')
  const error = ref<string | null>(null)
  const chunkCallbacks: Array<(text: string) => void> = []
  let recognition: SpeechRecognitionLike | null = null
  let keepListening = false
  let lastChunk = ''

  onMounted(() => {
    supported.value = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  })

  function emitChunk(text: string) {
    const chunk = text.trim()
    // Android Chrome may repeat the previous final result in continuous mode.
    if (!chunk || chunk === lastChunk) return
    lastChunk = chunk
    chunkCallbacks.forEach(cb => cb(chunk))
  }

  function start() {
    const Recognition = getRecognitionConstructor()
    if (!Recognition) return

    recognition?.abort()
    interim.value = ''
    error.value = null
    lastChunk = ''
    keepListening = true

    const instance = new Recognition()
    instance.lang = 'pt-BR'
    instance.interimResults = true
    instance.continuous = true
    instance.maxAlternatives = 1

    instance.onresult = (event) => {
      if (recognition !== instance) return
      let pending = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const text = result?.[0]?.transcript ?? ''
        if (result?.isFinal) emitChunk(text)
        else pending += text
      }
      interim.value = pending.trim()
    }
    instance.onerror = (event) => {
      if (recognition !== instance) return
      if (event.error !== 'no-speech') keepListening = false
      const message = errorMessage(event.error)
      if (message) error.value = message
    }
    instance.onend = () => {
      if (recognition !== instance) return
      interim.value = ''
      // Browsers end continuous sessions on silence/timeouts; resume until the user stops.
      if (keepListening) {
        try {
          instance.start()
          return
        } catch {
          keepListening = false
        }
      }
      recognition = null
      listening.value = false
    }

    recognition = instance
    listening.value = true
    try {
      instance.start()
    } catch {
      recognition = null
      listening.value = false
      keepListening = false
      error.value = errorMessage('')
    }
  }

  function stop() {
    keepListening = false
    recognition?.stop()
  }

  function cancel() {
    keepListening = false
    const r = recognition
    recognition = null
    r?.abort()
    listening.value = false
    interim.value = ''
  }

  function onChunk(cb: (text: string) => void) {
    chunkCallbacks.push(cb)
  }

  onScopeDispose(() => {
    chunkCallbacks.length = 0
    cancel()
  })

  return { supported, listening, interim, error, start, stop, cancel, onChunk }
}
```

- [ ] **Step 2: Reescrever o `<script setup>` de `VoiceCommandButton.vue`**

```ts
import type { ButtonProps } from '@nuxt/ui'
import { VOICE_EXAMPLES } from '../utils/voice/types'

defineOptions({ name: 'BaseVoiceCommandButton', inheritAttrs: false })

withDefaults(defineProps<{
  variant?: ButtonProps['variant']
  color?: ButtonProps['color']
  size?: ButtonProps['size']
}>(), {
  variant: 'ghost',
  color: 'neutral',
  size: 'md'
})

const toast = useToast()
const { supported, listening, interim, error, start, stop, cancel, onChunk } = useSpeechRecognition()
const { run } = useVoiceCommand()

const open = ref(false)
const text = ref('')
const notUnderstood = ref(false)
const running = ref(false)

onChunk((chunk) => {
  text.value = text.value.trim() ? `${text.value.trim()} ${chunk}` : chunk
})

watch(open, (value) => {
  if (!value) cancel()
})

function openModal() {
  open.value = true
  text.value = ''
  error.value = null
  notUnderstood.value = false
  if (supported.value) start()
}

function toggleListening() {
  if (listening.value) stop()
  else start()
}

function clearText() {
  text.value = ''
  notUnderstood.value = false
}

function pickExample(example: string) {
  cancel()
  text.value = example
}

async function submit() {
  const command = [text.value, interim.value].map(part => part.trim()).filter(Boolean).join(' ')
  cancel()
  if (!command || running.value) return
  text.value = command
  notUnderstood.value = false
  running.value = true
  try {
    const result = await run(command)
    if (!result.ok && result.reason === 'not_understood') notUnderstood.value = true
    else open.value = false
  } catch {
    toast.add({
      title: 'Não foi possível executar o comando',
      description: 'Tente de novo.',
      color: 'error'
    })
  } finally {
    running.value = false
  }
}
```

- [ ] **Step 3: Ajustar o template do modal**

Trocar a `description` do `UModal` por `"Fale à vontade, pode pausar. Toque em Enviar quando terminar e confira os dados antes de salvar."`.

Logo depois do `<UTextarea ...>`, adicionar a linha do parcial:

```vue
        <p
          v-if="interim"
          class="text-sm italic text-muted"
          aria-hidden="true"
        >
          {{ interim }}
        </p>
```

Trocar o `placeholder` do textarea por `"Ex.: abre a OS do ABC1D23 e coloca no diagnóstico pastilha gasta"`.

Substituir o `#footer` inteiro:

```vue
    <template #footer>
      <div class="flex w-full flex-wrap justify-end gap-2">
        <UButton
          v-if="supported"
          :icon="listening ? 'i-lucide-square' : 'i-lucide-mic'"
          :label="listening ? 'Parar' : 'Continuar ouvindo'"
          color="neutral"
          variant="outline"
          @click="toggleListening"
        />
        <UButton
          label="Limpar"
          color="neutral"
          variant="ghost"
          :disabled="!text.trim() || running"
          @click="clearText"
        />
        <UButton
          label="Enviar"
          icon="i-lucide-send"
          :disabled="!text.trim() && !interim"
          :loading="running"
          @click="submit()"
        />
      </div>
    </template>
```

(`VOICE_EXAMPLES` e a lista de exemplos continuam iguais no template.)

- [ ] **Step 4: `useVoiceLookup.ts` — `findOrderId` e `findNextAppointment`**

Acrescentar antes do `return` e incluí-las no objeto retornado:

```ts
  async function findOrderId(target: { placa?: string, numero?: string, clienteNome?: string }): Promise<string | undefined> {
    if (target.numero) {
      const { data, error } = await supabase
        .from('ordens_servico')
        .select('id')
        .like('numero', `OS-%-${target.numero.padStart(4, '0')}`)
        .order('aberta_em', { ascending: false })
        .limit(1)
      return error ? undefined : data?.[0]?.id
    }

    let vehicleIds: string[] = []
    if (target.placa) {
      const id = await findVehicleIdByPlaca(target.placa)
      if (id) vehicleIds = [id]
    } else if (target.clienteNome) {
      const clienteId = await findUniqueIdByName('clientes', target.clienteNome)
      if (clienteId) {
        const { data } = await supabase.from('veiculos').select('id').eq('cliente_id', clienteId)
        vehicleIds = (data ?? []).map(row => row.id)
      }
    }
    if (!vehicleIds.length) return undefined

    const { data, error } = await supabase
      .from('ordens_servico')
      .select('id')
      .in('veiculo_id', vehicleIds)
      .in('status', ['aberta', 'em_andamento'])
      .order('aberta_em', { ascending: false })
      .limit(1)
    return error ? undefined : data?.[0]?.id
  }

  async function findNextAppointment(veiculoId: string): Promise<{ id: string, inicio: string } | undefined> {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const { data, error } = await supabase
      .from('agendamentos')
      .select('id, inicio')
      .eq('veiculo_id', veiculoId)
      .in('status', ['agendado', 'confirmado'])
      .gte('inicio', startOfToday.toISOString())
      .order('inicio', { ascending: true })
      .limit(1)
    return error ? undefined : data?.[0]
  }

  return { findVehicleIdByPlaca, findUniqueIdByName, findOrderId, findNextAppointment }
```

- [ ] **Step 5: Reescrever `useVoiceCommand.ts`**

```ts
import type { PermissionAction } from '#layers/auth/app/utils/permissions'
import type {
  VoiceBudgetItemDraft,
  VoiceBudgetItemPayload,
  VoiceCommand,
  VoiceDraftMap,
  VoiceIntent,
  VoiceNavTarget,
  VoicePage
} from '../utils/voice/types'
import { parseVoiceCommand } from '../utils/voice/parser'
import { localDateInput, voicePageFromPath } from '../utils/voice/prompt'

export type VoiceRunResult
  = | { ok: true, intent: VoiceIntent }
    | { ok: false, reason: 'not_understood' | 'forbidden' | 'context' }

type Destination = { path: string, query?: Record<string, string> }

const INTENT_PERMISSION: Record<Exclude<VoiceIntent, 'navigate'>, PermissionAction> = {
  'customer.create': 'customers.write',
  'vehicle.create': 'vehicles.write',
  'order.create': 'orders.create',
  'appointment.create': 'scheduling.write',
  'budgetItem.create': 'budget.edit',
  'account.create': 'finance.view',
  'catalogItem.create': 'catalog.manage',
  'supplier.create': 'catalog.manage',
  'collaborator.create': 'collaborators.manage',
  'order.edit': 'orders.edit',
  'customer.edit': 'customers.write',
  'vehicle.edit': 'vehicles.write',
  'appointment.reschedule': 'scheduling.write',
  'appointment.noShow': 'scheduling.write'
}

const CREATE_PATH: Partial<Record<VoiceIntent, string>> = {
  'customer.create': APP_ROUTES.customersNew,
  'vehicle.create': APP_ROUTES.vehiclesNew,
  'order.create': APP_ROUTES.ordersNew,
  'appointment.create': APP_ROUTES.scheduling,
  'account.create': APP_ROUTES.finance,
  'catalogItem.create': APP_ROUTES.catalog,
  'supplier.create': APP_ROUTES.catalogSuppliers,
  'collaborator.create': APP_ROUTES.team
}

const NAV: Record<VoiceNavTarget, { path: string, permission?: PermissionAction }> = {
  home: { path: APP_ROUTES.home },
  orders: { path: APP_ROUTES.orders },
  scheduling: { path: APP_ROUTES.scheduling },
  customers: { path: APP_ROUTES.customers },
  vehicles: { path: APP_ROUTES.vehicles },
  finance: { path: APP_ROUTES.finance, permission: 'finance.view' },
  team: { path: APP_ROUTES.team, permission: 'collaborators.manage' },
  catalog: { path: APP_ROUTES.catalog, permission: 'catalog.manage' },
  suppliers: { path: APP_ROUTES.catalogSuppliers, permission: 'catalog.manage' },
  pricing: { path: APP_ROUTES.pricing, permission: 'catalog.manage' },
  settings: { path: APP_ROUTES.settings }
}

export function useVoiceCommand() {
  const { currentRoute } = useRouter()
  const toast = useToast()
  const { can } = usePermissions()
  const { setVoiceDraft, clearVoiceDraft } = useVoiceDraft()
  const { findVehicleIdByPlaca, findUniqueIdByName, findOrderId, findNextAppointment } = useVoiceLookup()

  async function interpret(text: string, page: VoicePage): Promise<VoiceCommand | null> {
    try {
      const { command } = await $fetch<{ command: VoiceCommand | null }>('/api/voice/interpret', {
        method: 'POST',
        body: { text, context: { page, today: localDateInput(new Date()) } }
      })
      return command ?? parseVoiceCommand(text)
    } catch {
      return parseVoiceCommand(text)
    }
  }

  function currentId(): string {
    return String(currentRoute.value.params.id)
  }

  async function budgetItemDraft(item: VoiceBudgetItemPayload): Promise<VoiceBudgetItemDraft> {
    const draft: VoiceBudgetItemDraft = { ...item }
    if (item.descricao) {
      const catalogItemId = await findUniqueIdByName('servicos_catalogo', item.descricao, { tipo: item.tipo })
      if (catalogItemId) draft.catalogItemId = catalogItemId
    }
    return draft
  }

  async function resolve(command: VoiceCommand, page: VoicePage, warnings: string[]): Promise<Destination | null> {
    switch (command.intent) {
      case 'navigate': {
        const { to, date } = command.payload
        if (to === 'scheduling' && date) return { path: APP_ROUTES.scheduling, query: { dia: date } }
        return { path: NAV[to].path }
      }
      case 'vehicle.create': {
        const { payload } = command
        const draft: VoiceDraftMap['vehicle.create'] = { ...payload }
        if (payload.clienteNome) {
          const clienteId = await findUniqueIdByName('clientes', payload.clienteNome)
          if (clienteId) draft.cliente_id = clienteId
          else warnings.push(`Cliente "${payload.clienteNome}" não encontrado ou ambíguo.`)
        }
        setVoiceDraft(command.intent, draft)
        return { path: APP_ROUTES.vehiclesNew }
      }
      case 'order.create':
      case 'appointment.create': {
        const { payload } = command
        const draft: VoiceDraftMap['order.create' | 'appointment.create'] = { ...payload }
        if (payload.placa) {
          const veiculoId = await findVehicleIdByPlaca(payload.placa)
          if (veiculoId) draft.veiculo_id = veiculoId
          else warnings.push(`Placa ${formatPlaca(payload.placa)} não encontrada.`)
        }
        setVoiceDraft(command.intent, draft)
        return { path: CREATE_PATH[command.intent]! }
      }
      case 'budgetItem.create': {
        if (page !== 'order-detail') {
          toast.add({ title: 'Abra uma OS', description: 'Para adicionar itens por voz, abra a ordem de serviço primeiro.', color: 'warning' })
          return null
        }
        setVoiceDraft(command.intent, { ...(await budgetItemDraft(command.payload)), orderId: currentId() })
        return { path: currentRoute.value.path }
      }
      case 'account.create': {
        const { payload } = command
        const draft: VoiceDraftMap['account.create'] = { ...payload }
        if (payload.categoriaNome) {
          const categoriaId = await findUniqueIdByName('financeiro_categorias', payload.categoriaNome)
          if (categoriaId) draft.categoria_id = categoriaId
          else warnings.push(`Categoria "${payload.categoriaNome}" não encontrada ou ambígua.`)
        }
        if (payload.fornecedorNome) {
          const fornecedorId = await findUniqueIdByName('fornecedores', payload.fornecedorNome)
          if (fornecedorId) draft.fornecedor_id = fornecedorId
          else warnings.push(`Fornecedor "${payload.fornecedorNome}" não encontrado ou ambíguo.`)
        }
        setVoiceDraft(command.intent, draft)
        return { path: APP_ROUTES.finance }
      }
      case 'order.edit': {
        const { target, itens, ...fields } = command.payload
        const orderId = target ? await findOrderId(target) : page === 'order-detail' ? currentId() : undefined
        if (!orderId) {
          toast.add({
            title: target ? 'Nenhuma OS em aberto encontrada' : 'Qual OS?',
            description: target ? 'Confira a placa, o número ou o cliente. Para criar, diga "nova OS".' : 'Diga a placa, o número da OS ou o cliente.',
            color: 'warning'
          })
          return null
        }
        const draft: VoiceDraftMap['order.edit'] = { ...fields, orderId }
        const [first] = itens ?? []
        if (first) {
          if (can('budget.edit')) draft.item = await budgetItemDraft(first)
          else warnings.push('Sem permissão para adicionar itens ao orçamento.')
        }
        if ((itens?.length ?? 0) > 1) warnings.push('Só o primeiro item foi preenchido. Dite o próximo em seguida.')
        setVoiceDraft(command.intent, draft)
        return { path: `/ordens/${orderId}` }
      }
      case 'customer.edit': {
        const { target, ...fields } = command.payload
        const clienteId = target?.nome
          ? await findUniqueIdByName('clientes', target.nome)
          : page === 'customer-detail' ? currentId() : undefined
        if (!clienteId) {
          toast.add({ title: target?.nome ? `Cliente "${target.nome}" não encontrado ou ambíguo.` : 'Qual cliente? Diga o nome.', color: 'warning' })
          return null
        }
        setVoiceDraft(command.intent, { ...fields, clienteId })
        return { path: `/clientes/${clienteId}` }
      }
      case 'vehicle.edit': {
        const { target, ...fields } = command.payload
        const veiculoId = target?.placa
          ? await findVehicleIdByPlaca(target.placa)
          : page === 'vehicle-detail' ? currentId() : undefined
        if (!veiculoId) {
          toast.add({ title: target?.placa ? `Placa ${formatPlaca(target.placa)} não encontrada.` : 'Qual veículo? Diga a placa.', color: 'warning' })
          return null
        }
        setVoiceDraft(command.intent, { ...fields, veiculoId })
        return { path: `/veiculos/${veiculoId}` }
      }
      case 'appointment.reschedule':
      case 'appointment.noShow': {
        const { placa } = command.payload
        const veiculoId = placa ? await findVehicleIdByPlaca(placa) : undefined
        const appointment = veiculoId ? await findNextAppointment(veiculoId) : undefined
        if (!appointment) {
          toast.add({ title: placa ? `Nenhum agendamento futuro para ${formatPlaca(placa)}.` : 'Diga a placa do agendamento.', color: 'warning' })
          return null
        }
        const base = { appointmentId: appointment.id, inicio: appointment.inicio }
        if (command.intent === 'appointment.reschedule') {
          const { date, startTime } = command.payload
          setVoiceDraft(command.intent, { ...base, ...(date ? { date } : {}), ...(startTime ? { startTime } : {}) })
        } else {
          setVoiceDraft(command.intent, base)
        }
        return { path: APP_ROUTES.scheduling, query: { dia: localDateInput(new Date(appointment.inicio)) } }
      }
      default:
        setVoiceDraft(command.intent, command.payload)
        return { path: CREATE_PATH[command.intent]! }
    }
  }

  async function run(text: string): Promise<VoiceRunResult> {
    const page = voicePageFromPath(currentRoute.value.path)
    const command = await interpret(text, page)
    if (!command) return { ok: false, reason: 'not_understood' }

    const permission = command.intent === 'navigate'
      ? NAV[command.payload.to].permission
      : INTENT_PERMISSION[command.intent]
    if (permission && !can(permission)) {
      toast.add({ title: 'Sem permissão', description: 'Seu perfil não pode fazer isso.', color: 'warning' })
      return { ok: false, reason: 'forbidden' }
    }

    const warnings: string[] = []
    const destination = await resolve(command, page, warnings)
    if (!destination) {
      clearVoiceDraft()
      return { ok: false, reason: 'context' }
    }

    if (destination.path !== currentRoute.value.path || destination.query) {
      await navigateTo({ path: destination.path, query: destination.query })
    }
    if (currentRoute.value.path !== destination.path) {
      clearVoiceDraft()
      return { ok: false, reason: 'context' }
    }

    if (command.intent !== 'navigate') {
      toast.add({ title: 'Preenchido por voz', description: 'Confira os dados e salve.', color: 'info', icon: 'i-lucide-mic' })
    }
    warnings.forEach(title => toast.add({ title, color: 'warning' }))
    return { ok: true, intent: command.intent }
  }

  return { run }
}
```

- [ ] **Step 6: Verificar**

Run: `pnpm test` → PASS. `npx nuxt typecheck` → exit 0. `pnpm lint` → exit 0.

- [ ] **Step 7: Commit**

```bash
git add layers/1.base/app/composables/useSpeechRecognition.ts layers/1.base/app/components/VoiceCommandButton.vue layers/1.base/app/composables/useVoiceLookup.ts layers/1.base/app/composables/useVoiceCommand.ts
git commit -m ":sparkles: feat(voice): interpret free speech with AI and dictate in chunks"
```

---

### Task 4: Páginas — consumir drafts de edição

**Files:**
- Modify: `layers/1.base/app/composables/useVoiceDraft.ts`
- Modify: `layers/5.orders/app/composables/useOrderBudgetPage.ts`
- Modify: `layers/5.orders/app/pages/orders-[id].vue`
- Modify: `layers/4.customers/app/pages/customers-[id].vue`
- Modify: `layers/10.vehicles/app/pages/vehicles-[id].vue`
- Modify: `layers/11.scheduling/app/pages/scheduling.vue`
- Modify: `layers/11.scheduling/app/components/SchedulingFormSlideover.vue`

**Interfaces:**
- Consumes (Task 1): `VoiceDraftMap['order.edit' | 'customer.edit' | 'vehicle.edit' | 'appointment.reschedule' | 'appointment.noShow']`, `VoiceBudgetItemDraft`, `appendText` (`#layers/base/app/utils/voice/text`).
- Produces: `onVoiceDraft(intent, handler, accept?)` — `accept(draft) === false` deixa o draft pendente para outra página; `useOrderBudgetPage` retorna também `openVoiceItem(item: VoiceBudgetItemDraft): Promise<void>`.

- [ ] **Step 1: `useVoiceDraft.ts` — filtro `accept`**

Substituir `onVoiceDraft`:

```ts
  function onVoiceDraft<K extends VoiceIntent>(
    intent: K,
    handler: (draft: VoiceDraftMap[K]) => void,
    accept?: (draft: VoiceDraftMap[K]) => boolean
  ) {
    watch(pending, (value) => {
      if (!value) return
      if (Date.now() - value.createdAt > DRAFT_TTL_MS) {
        pending.value = null
        return
      }
      if (value.intent !== intent) return
      const draft = value.draft as VoiceDraftMap[K]
      // Another page instance (e.g. the previous record during navigation) must not swallow the draft.
      if (accept && !accept(draft)) return
      pending.value = null
      handler(draft)
    }, { immediate: true })
  }
```

- [ ] **Step 2: `useOrderBudgetPage.ts` — extrair `openVoiceItem`**

Importar `import type { VoiceBudgetItemDraft } from '#layers/base/app/utils/voice/types'` e substituir o bloco `onVoiceDraft('budgetItem.create', ...)` por:

```ts
  async function openVoiceItem(voice: VoiceBudgetItemDraft) {
    if (!canEditItems.value) {
      useToast().add({
        title: 'Orçamento bloqueado',
        description: 'Este orçamento não pode receber itens agora.',
        color: 'warning'
      })
      return
    }
    Object.assign(draft, emptyOrderItemDraft(), { tipo: voice.tipo })
    if (voice.descricao) draft.descricao = voice.descricao
    selectedCatalogId.value = voice.catalogItemId
    applyCatalogEntry(voice.catalogItemId)
    // Spoken values must land after the selectedCatalogId watcher re-applies the catalog price.
    await nextTick()
    if (voice.quantidade != null) draft.quantidade = voice.quantidade
    if (voice.valor_unitario != null) draft.valor_unitario = voice.valor_unitario
    addModalOpen.value = true
  }

  const { onVoiceDraft } = useVoiceDraft()
  onVoiceDraft('budgetItem.create', openVoiceItem, voice => voice.orderId === toValue(orderId))
```

e adicionar `openVoiceItem` ao objeto retornado.

- [ ] **Step 3: `orders-[id].vue` — `order.edit`**

Adicionar import: `import { appendText } from '#layers/base/app/utils/voice/text'`.
Incluir `openVoiceItem` na desestruturação de `useOrderBudgetPage(...)`.
Depois do bloco `useOrderStatusEditor(...)`, adicionar:

```ts
const { onVoiceDraft } = useVoiceDraft()
onVoiceDraft('order.edit', async (voice) => {
  const hasFields = voice.km_entrada != null || !!voice.reclamacao || !!voice.diagnostico || !!voice.observacoes || !!voice.status
  if (hasFields && !canEdit.value) {
    useToast().add({ title: 'Esta OS não pode ser editada.', color: 'warning' })
  } else if (hasFields) {
    if (voice.km_entrada != null) state.km_entrada = voice.km_entrada
    state.reclamacao = appendText(state.reclamacao, voice.reclamacao)
    state.diagnostico = appendText(state.diagnostico, voice.diagnostico)
    state.observacoes = appendText(state.observacoes, voice.observacoes)
    if (voice.status) {
      if (statusItems.value.some(item => item.value === voice.status)) selectedStatus.value = voice.status
      else useToast().add({ title: 'Esse status não está disponível para esta OS.', color: 'warning' })
    }
  }
  if (voice.item) await openVoiceItem(voice.item)
}, voice => voice.orderId === id.value)
```

- [ ] **Step 4: `customers-[id].vue` — `customer.edit`**

Adicionar import: `import { appendText } from '#layers/base/app/utils/voice/text'` e `import { digitsOnly, formatDocumento, formatPhoneBr } from '../utils/customer-form'`.
Depois do bloco `useCustomerDetailPage(...)` e de `const { can } = usePermissions()`, adicionar:

```ts
const { onVoiceDraft } = useVoiceDraft()
onVoiceDraft('customer.edit', (voice) => {
  if (!can('customers.write')) return
  if (!editing.value) startEdit()
  const phones = state.telefones.filter(Boolean)
  for (const phone of voice.telefones ?? []) {
    if (!phones.some(existing => digitsOnly(existing) === phone)) phones.push(formatPhoneBr(phone))
  }
  state.telefones = phones
  const emails = state.emails.filter(Boolean)
  for (const email of voice.emails ?? []) {
    if (!emails.includes(email)) emails.push(email)
  }
  state.emails = emails
  if (voice.documento) state.documento = formatDocumento(voice.documento)
  state.observacoes = appendText(state.observacoes, voice.observacoes)
}, voice => voice.clienteId === id.value)
```

- [ ] **Step 5: `vehicles-[id].vue` — `vehicle.edit`**

Adicionar import: `import { appendText } from '#layers/base/app/utils/voice/text'`.
Depois de `const { can } = usePermissions()`:

```ts
const { onVoiceDraft } = useVoiceDraft()
onVoiceDraft('vehicle.edit', (voice) => {
  if (!can('vehicles.write')) return
  if (!editing.value) startEdit()
  if (voice.km_atual != null) state.km_atual = voice.km_atual
  if (voice.cor) state.cor = voice.cor
  state.observacoes = appendText(state.observacoes, voice.observacoes)
}, voice => voice.veiculoId === id.value)
```

- [ ] **Step 6: `SchedulingFormSlideover.vue` — sobrescrever data/hora na edição**

Substituir `resetDraft`:

```ts
function resetDraft() {
  if (props.appointment) {
    Object.assign(draft, appointmentToDraft(props.appointment))
    snapshot.value = JSON.stringify({ ...draft })
    // Voice reschedule: the new date/time land after the snapshot so the change is dirty.
    if (props.prefill?.date) draft.date = props.prefill.date
    if (props.prefill?.startTime) draft.startTime = props.prefill.startTime
    return
  }
  Object.assign(draft, emptyAppointmentDraft(props.day, props.prefill ?? undefined))
  snapshot.value = JSON.stringify(emptyAppointmentDraft(props.day, { hour: props.prefill?.hour }))
}
```

- [ ] **Step 7: `scheduling.vue` — `reschedule` e `noShow`**

Substituir `openEdit`:

```ts
function openEdit(appointment: SchedulingAppointment, override?: Pick<AppointmentCreatePrefill, 'date' | 'startTime'>) {
  createPrefill.value = override ?? null
  editingAppointment.value = appointment
  formOpen.value = true
}
```

Depois do handler `onVoiceDraft('appointment.create', ...)`, adicionar:

```ts
function whenAppointmentLoaded(id: string, inicio: string, action: (appointment: SchedulingAppointment) => void) {
  selectDay(new Date(inicio))
  let done = false
  const stop = watch(dayAppointments, (list) => {
    const found = list.find(item => item.id === id)
    if (!found || done) return
    done = true
    action(found)
    void nextTick(() => stop())
  }, { immediate: true })
  setTimeout(() => {
    if (done) return
    done = true
    stop()
    toast.add({ title: 'Agendamento não encontrado na agenda.', color: 'warning' })
  }, 10_000)
}

onVoiceDraft('appointment.reschedule', (draft) => {
  if (!canWrite.value) return
  whenAppointmentLoaded(draft.appointmentId, draft.inicio, appointment => openEdit(appointment, {
    ...(draft.date ? { date: draft.date } : {}),
    ...(draft.startTime ? { startTime: draft.startTime } : {})
  }))
})

onVoiceDraft('appointment.noShow', (draft) => {
  if (!canWrite.value) return
  whenAppointmentLoaded(draft.appointmentId, draft.inicio, appointment => requestNoShow(appointment.id))
})
```

(`toast` já está declarado no arquivo antes; se estiver declarado **depois** deste trecho, mover estes handlers para depois da declaração de `toast` e de `requestNoShow`.) Se `statusFilter`/`search` ocultarem o agendamento, o timeout avisa — aceitável.

- [ ] **Step 8: Verificar**

Run: `pnpm test` → PASS. `npx nuxt typecheck` → exit 0. `pnpm lint` → exit 0.

- [ ] **Step 9: Commit**

```bash
git add layers/1.base/app/composables/useVoiceDraft.ts layers/5.orders/app/composables/useOrderBudgetPage.ts "layers/5.orders/app/pages/orders-[id].vue" "layers/4.customers/app/pages/customers-[id].vue" "layers/10.vehicles/app/pages/vehicles-[id].vue" layers/11.scheduling/app/pages/scheduling.vue layers/11.scheduling/app/components/SchedulingFormSlideover.vue
git commit -m ":sparkles: feat(voice): prefill existing orders, customers, vehicles and appointments by voice"
```

---

### Task 5: Verificação final, revisão e graph

**Files:** nenhum novo (só correções apontadas pela revisão).

- [ ] **Step 1: Suíte completa**

Run: `pnpm test && npx nuxt typecheck && pnpm lint`
Expected: tudo exit 0.

- [ ] **Step 2: Build de produção (valida bundling do import `layers/…/voice/*.ts` no Nitro)**

Run: `npx nuxt build`
Expected: build conclui sem erro. Apagar `.output/` não é necessário (já ignorado pelo git; conferir com `git status`).

- [ ] **Step 3: Revisão final do diff da branch desde `2a695d8`**

Conferir contra o spec: fronteira `normalize`, 401/400/503, sem escrita no banco, `appendText` em todos os campos de texto, filtro `accept` em todos os consumidores de edição, senha nunca preenchida, ditado contínuo sem auto-envio.

- [ ] **Step 4: Graph**

Run: `graphify update .`

- [ ] **Step 5: Commit final**

```bash
git add graphify-out
git commit -m ":wrench: chore(graphify): update graph after voice v2"
```
