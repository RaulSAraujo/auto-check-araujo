# Voz — Perguntas livres Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Perguntar qualquer coisa sobre a oficina por voz, de qualquer tela, e receber resposta na tela e falada, com atalhos para os registros citados; a conversa lembra o contexto até fechar o painel.

**Architecture:** O `interpret` ganha `{"op":"ask"}`; nesse caso o painel vira conversa e cada fala vai para `POST /api/voice/ask`. O servidor roda um laço de tool calling no Groq sobre ferramentas só de leitura (Supabase do usuário + `can(papel)`), mascara CPF/CNPJ/telefone/e-mail antes de mandar à IA e desmascara a resposta. Só registros vistos nos resultados viram links.

**Tech Stack:** Nuxt 4 / Nitro, Supabase (`#supabase/server`), Groq (OpenAI-compatible tool calling), Vue 3 + Nuxt UI v4, `node:test` (`pnpm test`), TypeScript 6.

**Spec:** `docs/superpowers/specs/2026-09-30-voice-questions-design.md`

## Global Constraints

- Código em inglês; textos de UI e do prompt em português.
- Arquivos testados com `node --test` são TS apagável: só `import type` para tipos de módulos não relativos ou com alias (`#supabase/server`, `~~/…`), imports relativos com `.ts`, sem Nuxt/Vue em runtime.
- Commits: `:emoji: tipo(escopo): descrição em inglês no imperativo, minúscula, sem ponto`.
- Nunca commitar `.env` nem `.superpowers/`. Tarefas não commitam `graphify-out/` (só o fechamento, em commit próprio).
- A voz nunca grava no banco; as ferramentas só fazem `select`/`rpc` de leitura.
- Chaves só no `runtimeConfig` do servidor; só Groq na rota `ask` (sem Gemini).
- Sem logs de pergunta, resposta ou resultado de ferramenta — só o motivo de falha do provedor.
- Comentários só para restrições que o código não mostra; `ponytail:` para tetos conhecidos.
- Verificação por tarefa: `pnpm test` e `npx nuxt typecheck` (rodar com permissão total fora do sandbox). Lint: `pnpm lint`.
- Agentes em paralelo: `git add` só dos próprios arquivos; se `index.lock` existir, espere e tente de novo.

## Ordem / paralelismo

- Onda 1 (paralelo, arquivos disjuntos): Task 1, Task 2, Task 3, Task 4. A Task 3 usa só `import type` de `refs.ts` (Task 2) e `loop.ts` (Task 4) — os testes rodam sem eles; o typecheck completo fecha depois da onda.
- Onda 2 (paralelo): Task 5 (depende de 2, 3, 4), Task 6 (depende de 1).

---

### Task 1: `interpret` reconhece perguntas (`op: 'ask'`)

**Files:**
- Modify: `layers/1.base/app/utils/voice/types.ts`
- Modify: `layers/1.base/app/utils/voice/normalize.ts`
- Modify: `layers/1.base/app/utils/voice/prompt.ts`
- Modify: `layers/1.base/app/composables/useVoiceCommand.ts`
- Test: `layers/1.base/app/utils/voice/normalize.test.ts`, `layers/1.base/app/utils/voice/prompt.test.ts`

**Interfaces:**
- Produces: `VoiceOp` inclui `'ask'`; `normalizeVoiceCommand({ op: 'ask', ... })` → `{ op: 'ask' }`; `VoiceRunResult` sucesso = `{ ok: true, ask?: true }`.

- [ ] **Step 1: Testes que falham**

Em `normalize.test.ts`, junto dos testes de `navigate`:

```ts
test('ask carries no other fields', () => {
  assert.deepEqual(n({ op: 'ask' }), { op: 'ask' })
  assert.deepEqual(n({ op: 'ask', entity: 'order', to: 'home', query: { q: 'x' } }), { op: 'ask' })
})
```

Em `prompt.test.ts`, no teste `prompt has date, page, text, ...`, acrescente:

```ts
  assert.match(system!.content, /\{"op":"ask"\}/)
  assert.match(system!.content, /ask = pergunta sobre dados/)
```

- [ ] **Step 2: Rodar e ver falhar** — `pnpm test` (os dois novos asserts falham).

- [ ] **Step 3: Implementar**

`types.ts`:

```ts
export type VoiceOp = 'create' | 'edit' | 'action' | 'navigate' | 'ask'
```

No `VoiceCommand`, troque o doc de `entity` para `/** Absent for \`navigate\` and \`ask\`. */`.

Acrescente ao fim de `VOICE_EXAMPLES`:

```ts
  'Quantas OS estão abertas?',
  'Qual o telefone do João da Silva?',
  'Quanto faturei este mês?'
```

`normalize.ts`, logo após `if (!isObj(raw)) return null`:

```ts
  if (raw.op === 'ask') return { op: 'ask' }
```

`prompt.ts` (`buildVoiceMessages`): depois da linha do formato `navigate` e antes de `{"op":null}`, acrescente

```
{"op":"ask"} para perguntas sobre dados da oficina.
```

e nas Regras, logo após a linha que começa com `- navigate = abrir uma tela.`:

```
- ask = pergunta sobre dados que pede uma resposta, não uma tela ("quantas OS estão abertas?", "quanto faturei em agosto?", "qual o telefone do João?", "quando o ABC1D23 veio por último?", "tem pastilha em estoque?"). Pedido para mostrar/abrir/filtrar lista continua navigate.
```

`useVoiceCommand.ts`:

```ts
export type VoiceRunResult
  = | { ok: true, ask?: true }
    | { ok: false, reason: 'not_understood' | 'forbidden' | 'context' | 'cancelled' }
```

Em `run`, logo após `if (!command) return { ok: false, reason: 'not_understood' }`:

```ts
    if (command.op === 'ask') return { ok: true, ask: true }
```

- [ ] **Step 4: Verificar** — `pnpm test` (todos passam, inclusive `prompt stays under the token budget`), `npx nuxt typecheck`, `pnpm lint`.

- [ ] **Step 5: Commit**

```bash
git add layers/1.base/app/utils/voice/types.ts layers/1.base/app/utils/voice/normalize.ts layers/1.base/app/utils/voice/prompt.ts layers/1.base/app/composables/useVoiceCommand.ts layers/1.base/app/utils/voice/normalize.test.ts layers/1.base/app/utils/voice/prompt.test.ts
git commit -m ":sparkles: feat(voice): route data questions to ask mode"
```

---

### Task 2: Mascaramento e links de registros citados

**Files:**
- Create: `server/utils/voice-ask/mask.ts`, `server/utils/voice-ask/mask.test.ts`
- Create: `server/utils/voice-ask/refs.ts`, `server/utils/voice-ask/refs.test.ts`

**Interfaces:**
- Produces: `createMasker(seen?: readonly string[])` → `{ maskText(text), maskResult(value), unmask(text), unmaskArgs(value) }`.
- Produces: `type VoiceRefType = 'order' | 'customer' | 'vehicle' | 'appointment' | 'account'`, `interface VoiceLink { label: string, to: string }`, `createRefs()` → `{ add(type, id, row), links(raw) }`.

- [ ] **Step 1: Testes que falham**

`server/utils/voice-ask/mask.test.ts`:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { createMasker } from './mask.ts'

test('masks contact fields in tool results and keeps ids', () => {
  const m = createMasker()
  const masked = m.maskResult({
    id: '11988887777',
    cliente_id: 'abc',
    nome: 'João',
    telefones: ['(11) 98888-7777'],
    emails: ['Joao@Mail.com'],
    documento: '123.456.789-00',
    observacoes: 'ligar no 11 97777-6666'
  })
  assert.deepEqual(masked, {
    id: '11988887777',
    cliente_id: 'abc',
    nome: 'João',
    telefones: ['[telefone 1]'],
    emails: ['[email 2]'],
    documento: '[documento 3]',
    observacoes: 'ligar no [telefone 4]'
  })
})

test('masks patterns in user text; same value gives the same token', () => {
  const m = createMasker()
  assert.equal(m.maskText('de quem é o 11988887777?'), 'de quem é o [telefone 1]?')
  assert.equal(m.maskResult({ telefones: ['(11) 98888-7777'] }).telefones[0], '[telefone 1]')
  assert.equal(m.maskText('cpf 123.456.789-00 e cnpj 12.345.678/0001-90'), 'cpf [documento 2] e cnpj [documento 3]')
  assert.equal(m.maskText('documento 12345678900'), 'documento [documento 2]')
  assert.equal(m.maskText('email joao@mail.com'), 'email [email 4]')
  assert.equal(m.maskText('OS 1234 de 2026-09-30, R$ 150'), 'OS 1234 de 2026-09-30, R$ 150')
})

test('unmasks the answer and tool arguments; unknown tokens stay as text', () => {
  const m = createMasker()
  m.maskResult({ telefones: ['(11) 98888-7777'] })
  assert.equal(m.unmask('O telefone é [telefone 1].'), 'O telefone é (11) 98888-7777.')
  assert.equal(m.unmask('Ver [telefone 9].'), 'Ver [telefone 9].')
  assert.deepEqual(m.unmaskArgs({ telefone: '[telefone 1]', limit: 3 }), { telefone: '(11) 98888-7777', limit: 3 })
})

test('new tokens start after the ones already in the history', () => {
  const m = createMasker(['O telefone é [telefone 2].', 'e o email?'])
  assert.equal(m.maskText('joao@mail.com'), '[email 3]')
})
```

`server/utils/voice-ask/refs.test.ts`:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { createRefs } from './refs.ts'

test('only refs seen in tool results become links, one URL per type', () => {
  const refs = createRefs()
  refs.add('order', 'o1', { numero: '1234' })
  refs.add('customer', 'c1', { nome: 'João' })
  refs.add('vehicle', 'v1', { placa: 'ABC1D23' })
  refs.add('appointment', 'a1', { inicio: '2026-10-02T13:00:00+00:00' })
  refs.add('account', 'f1', { descricao: 'Energia' })
  refs.add('account', 'f2', { descricao: 'Água' })
  assert.deepEqual(refs.links([
    { type: 'order', id: 'o1' },
    { type: 'order', id: 'nope' },
    { type: 'customer', id: 'c1' },
    { type: 'vehicle', id: 'v1' },
    { type: 'appointment', id: 'a1' },
    { type: 'account', id: 'f1' },
    { type: 'account', id: 'f2' },
    'lixo',
    { type: 'order' }
  ]), [
    { label: 'Abrir OS 1234', to: '/ordens/o1' },
    { label: 'Abrir João', to: '/clientes/c1' },
    { label: 'Abrir ABC1D23', to: '/veiculos/v1' },
    { label: 'Abrir agenda de 02/10', to: '/agendamentos?dia=2026-10-02' },
    { label: 'Abrir contas a pagar', to: '/gestao/financeiro?aba=contas' }
  ])
})

test('appointment day uses the shop timezone', () => {
  const refs = createRefs()
  refs.add('appointment', 'a1', { inicio: '2026-10-03T01:30:00+00:00' })
  assert.equal(refs.links([{ type: 'appointment', id: 'a1' }])[0]?.to, '/agendamentos?dia=2026-10-02')
})

test('at most 5 links; non-array refs give none', () => {
  const refs = createRefs()
  for (let i = 0; i < 7; i++) refs.add('order', `o${i}`, { numero: String(i) })
  assert.equal(refs.links(Array.from({ length: 7 }, (_, i) => ({ type: 'order', id: `o${i}` }))).length, 5)
  assert.deepEqual(refs.links(undefined), [])
})
```

- [ ] **Step 2: Rodar e ver falhar** — `pnpm test` (módulos inexistentes).

- [ ] **Step 3: Implementar**

`server/utils/voice-ask/mask.ts`:

```ts
type PiiKind = 'telefone' | 'email' | 'documento'

const TOKEN_RE = /\[(telefone|email|documento) (\d+)\]/g
const FIELD_KIND: Record<string, PiiKind> = {
  telefone: 'telefone',
  telefones: 'telefone',
  email: 'email',
  emails: 'email',
  documento: 'documento'
}
// ponytail: regex heuristics — a bare 11-digit number is a phone when its 3rd digit is 9 (mobile), otherwise a CPF; numbers spoken in other shapes slip through.
const PATTERNS: [PiiKind, RegExp][] = [
  ['email', /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g],
  ['documento', /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g],
  ['documento', /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g],
  ['telefone', /(?:\+?55[\s-]?)?(?:\(\d{2}\)|\b\d{2})[\s-]?9?\d{4}[\s-]?\d{4}\b/g],
  ['documento', /\b\d{11}\b/g]
]

function valueKey(kind: PiiKind, value: string): string {
  if (kind === 'email') return `email:${value.trim().toLowerCase()}`
  const digits = value.replace(/\D/g, '')
  return `${kind}:${kind === 'telefone' ? digits.replace(/^55(?=\d{10,11}$)/, '') : digits}`
}

/** Per-request map between personal data and the tokens the AI sees. */
export function createMasker(seen: readonly string[] = []) {
  let next = Math.max(0, ...seen.flatMap(text => [...text.matchAll(TOKEN_RE)].map(match => Number(match[2]))))
  const tokenByKey = new Map<string, string>()
  const valueByToken = new Map<string, string>()

  function token(kind: PiiKind, value: string): string {
    const key = valueKey(kind, value)
    let found = tokenByKey.get(key)
    if (!found) {
      found = `[${kind} ${++next}]`
      tokenByKey.set(key, found)
      valueByToken.set(found, value)
    }
    return found
  }

  function maskText(text: string): string {
    return PATTERNS.reduce((out, [kind, re]) => out.replace(re, match => token(kind, match)), text)
  }

  function maskResult(value: unknown, key = ''): any {
    if (typeof value === 'string') {
      const kind = FIELD_KIND[key]
      if (kind) return value ? token(kind, value) : value
      return key === 'id' || key.endsWith('_id') ? value : maskText(value)
    }
    if (Array.isArray(value)) return value.map(item => maskResult(item, key))
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, maskResult(v, k)]))
    }
    return value
  }

  function unmask(text: string): string {
    return text.replace(TOKEN_RE, found => valueByToken.get(found) ?? found)
  }

  function unmaskArgs(value: unknown): unknown {
    if (typeof value === 'string') return unmask(value)
    if (Array.isArray(value)) return value.map(unmaskArgs)
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, unmaskArgs(v)]))
    }
    return value
  }

  return { maskText, maskResult, unmask, unmaskArgs }
}
```

Se o lint reclamar do `any` em `maskResult`, troque o retorno por `unknown` e ajuste o teste para `(m.maskResult(...) as { telefones: string[] }).telefones[0]`.

`server/utils/voice-ask/refs.ts`:

```ts
export type VoiceRefType = 'order' | 'customer' | 'vehicle' | 'appointment' | 'account'

export interface VoiceLink {
  label: string
  to: string
}

type Row = Record<string, unknown>

const MAX_LINKS = 5
// ponytail: fixed America/Sao_Paulo offset (no DST since 2019); switch to Intl time zone math if DST returns.
const SHOP_OFFSET_MS = -3 * 60 * 60 * 1000

function shopDay(iso: unknown): string | undefined {
  const time = typeof iso === 'string' ? Date.parse(iso) : Number.NaN
  return Number.isNaN(time) ? undefined : new Date(time + SHOP_OFFSET_MS).toISOString().slice(0, 10)
}

const LINK: Record<VoiceRefType, (id: string, row: Row) => VoiceLink> = {
  order: (id, row) => ({ label: `Abrir OS ${row.numero}`, to: `/ordens/${id}` }),
  customer: (id, row) => ({ label: `Abrir ${row.nome}`, to: `/clientes/${id}` }),
  vehicle: (id, row) => ({ label: `Abrir ${row.placa}`, to: `/veiculos/${id}` }),
  appointment: (_id, row) => {
    const day = shopDay(row.inicio)
    return day
      ? { label: `Abrir agenda de ${day.slice(8, 10)}/${day.slice(5, 7)}`, to: `/agendamentos?dia=${day}` }
      : { label: 'Abrir agenda', to: '/agendamentos' }
  },
  account: () => ({ label: 'Abrir contas a pagar', to: '/gestao/financeiro?aba=contas' })
}

/** Records seen in this request's tool results; only those can become links. */
export function createRefs() {
  const seen = new Map<string, VoiceLink>()
  return {
    add(type: VoiceRefType, id: string, row: Row) {
      seen.set(`${type}:${id}`, LINK[type](id, row))
    },
    links(raw: unknown): VoiceLink[] {
      if (!Array.isArray(raw)) return []
      const out: VoiceLink[] = []
      for (const ref of raw) {
        if (!ref || typeof ref !== 'object') continue
        const { type, id } = ref as Row
        const link = typeof type === 'string' && typeof id === 'string' ? seen.get(`${type}:${id}`) : undefined
        if (link && !out.some(item => item.to === link.to)) out.push(link)
        if (out.length === MAX_LINKS) break
      }
      return out
    }
  }
}
```

- [ ] **Step 4: Verificar** — `pnpm test`, `pnpm lint`.

- [ ] **Step 5: Commit**

```bash
git add server/utils/voice-ask/mask.ts server/utils/voice-ask/mask.test.ts server/utils/voice-ask/refs.ts server/utils/voice-ask/refs.test.ts
git commit -m ":sparkles: feat(voice): add pii masking and record links for questions"
```

---

### Task 3: Ferramentas de leitura

**Files:**
- Create: `server/utils/voice-ask/tools.ts`, `server/utils/voice-ask/tools.test.ts`

**Interfaces:**
- Consumes (só tipos): `VoiceRefType` de `./refs.ts` (Task 2), `ToolSchema` de `./loop.ts` (Task 4); `can` de `layers/2.auth/app/utils/permissions.ts`; `ilikePattern` de `layers/1.base/app/utils/supabase-search.ts`.
- Produces: `VOICE_TOOL_SCHEMAS: ToolSchema[]`, `runVoiceTool(name, args, ctx): Promise<unknown>` (nunca lança), `interface ToolContext { db, papel, today, see }`.

- [ ] **Step 1: Testes que falham**

`server/utils/voice-ask/tools.test.ts`:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { runVoiceTool, VOICE_TOOL_SCHEMAS, type ToolContext } from './tools.ts'

type Result = { data?: unknown, count?: number, error?: unknown }

function fakeDb(results: Record<string, Result> = {}) {
  const calls: string[] = []
  const builder = (name: string) => {
    const result = { data: [], count: 0, error: null, ...results[name] }
    const proxy: unknown = new Proxy({}, {
      get(_target, prop) {
        if (prop === 'then') return (resolve: (value: unknown) => void) => resolve(result)
        return (...args: unknown[]) => {
          calls.push(`${name}.${String(prop)}(${args.map(arg => JSON.stringify(arg)).join(',')})`)
          return proxy
        }
      }
    })
    return proxy
  }
  const db = {
    from: (table: string) => builder(table),
    rpc: (fn: string, params?: unknown) => {
      calls.push(`rpc.${fn}(${JSON.stringify(params ?? null)})`)
      return builder(fn)
    }
  }
  return { db: db as never, calls }
}

function ctx(papel: ToolContext['papel'], results?: Record<string, Result>) {
  const { db, calls } = fakeDb(results)
  const seen: string[] = []
  const context: ToolContext = { db, papel, today: '2026-09-30', see: (type, id) => seen.push(`${type}:${id}`) }
  return { context, calls, seen }
}

test('every tool has a schema', () => {
  assert.deepEqual(VOICE_TOOL_SCHEMAS.map(tool => tool.function.name), [
    'search_orders', 'get_order', 'search_customers', 'customer_summary', 'vehicle_history',
    'list_appointments', 'finance_summary', 'list_accounts', 'search_catalog', 'team_stats'
  ])
})

test('permission gating never queries', async () => {
  const mec = ctx('mecanico')
  assert.deepEqual(await runVoiceTool('finance_summary', {}, mec.context), { erro: 'sem_permissao', area: 'financeiro' })
  assert.deepEqual(await runVoiceTool('list_accounts', {}, mec.context), { erro: 'sem_permissao', area: 'financeiro' })
  assert.deepEqual(await runVoiceTool('search_catalog', {}, mec.context), { erro: 'sem_permissao', area: 'catálogo' })
  const rec = ctx('recepcao')
  assert.deepEqual(await runVoiceTool('team_stats', {}, rec.context), { erro: 'sem_permissao', area: 'equipe' })
  assert.deepEqual([...mec.calls, ...rec.calls], [])
  assert.deepEqual(await runVoiceTool('search_catalog', { nome: 'pastilha' }, rec.context), { total: 0, itens: [] })
})

test('invalid arguments never query', async () => {
  const { context, calls } = ctx('gerente')
  assert.deepEqual(await runVoiceTool('search_orders', { status: 'perdida' }, context), { erro: 'argumento_invalido', campo: 'status' })
  assert.deepEqual(await runVoiceTool('search_orders', { from: '2026-13-01' }, context), { erro: 'argumento_invalido', campo: 'from' })
  assert.deepEqual(await runVoiceTool('search_orders', { limit: 0 }, context), { erro: 'argumento_invalido', campo: 'limit' })
  assert.deepEqual(await runVoiceTool('get_order', {}, context), { erro: 'argumento_invalido', campo: 'id' })
  assert.deepEqual(await runVoiceTool('vehicle_history', { placa: 'XX' }, context), { erro: 'argumento_invalido', campo: 'placa' })
  assert.deepEqual(await runVoiceTool('customer_summary', { id: 'drop table' }, context), { erro: 'argumento_invalido', campo: 'id' })
  assert.deepEqual(await runVoiceTool('finance_summary', { mes: '2026-9' }, context), { erro: 'argumento_invalido', campo: 'mes' })
  assert.deepEqual(await runVoiceTool('nope', {}, context), { erro: 'ferramenta_desconhecida' })
  assert.deepEqual(calls, [])
})

test('search_orders filters, caps the limit and flattens rows', async () => {
  const row = {
    id: 'o1', numero: '1234', status: 'aberta', orcamento_status: 'rascunho', aberta_em: '2026-09-10T12:00:00+00:00',
    concluida_em: null, valor_total: 300, pago: false,
    veiculos: { id: 'v1', placa: 'ABC1D23', marca: 'Fiat', modelo: 'Uno', clientes: { id: 'c1', nome: 'João' } }
  }
  const { context, calls, seen } = ctx('mecanico', { ordens_servico: { data: [row], count: 1 } })
  const result = await runVoiceTool('search_orders', { status: 'aberta', from: '2026-09-01', to: '2026-09-30', limit: 50, pago: null }, context)
  assert.deepEqual(result, {
    total: 1,
    ordens: [{
      id: 'o1', numero: '1234', status: 'aberta', orcamento_status: 'rascunho', placa: 'ABC1D23', veiculo: 'Fiat Uno',
      cliente_id: 'c1', cliente: 'João', aberta_em: '2026-09-10T12:00:00+00:00', concluida_em: null, valor_total: 300, pago: false
    }]
  })
  assert.ok(calls.includes('ordens_servico.eq("status","aberta")'))
  assert.ok(calls.includes('ordens_servico.gte("aberta_em","2026-09-01T00:00:00-03:00")'))
  assert.ok(calls.includes('ordens_servico.lte("aberta_em","2026-09-30T23:59:59.999-03:00")'))
  assert.ok(calls.includes('ordens_servico.limit(10)'))
  assert.ok(!calls.some(call => call.includes('"pago"')))
  assert.deepEqual(seen, ['order:o1', 'customer:c1', 'vehicle:v1'])
})

test('search_orders with an unknown plate answers empty without listing orders', async () => {
  const { context, calls } = ctx('mecanico')
  assert.deepEqual(await runVoiceTool('search_orders', { placa: 'abc-1d23' }, context), { total: 0, ordens: [] })
  assert.ok(calls.includes('veiculos.eq("placa","ABC1D23")'))
  assert.ok(!calls.some(call => call.startsWith('ordens_servico')))
})

test('database errors become falha_consulta', async () => {
  const { context } = ctx('mecanico', { ordens_servico: { error: { message: 'boom' } } })
  assert.deepEqual(await runVoiceTool('search_orders', {}, context), { erro: 'falha_consulta' })
})

test('list_accounts maps the spoken status to the account filters', async () => {
  const { context, calls } = ctx('gerente', { financeiro_contas: { data: [{ id: 'f1', descricao: 'Energia', valor: 200, vencimento: '2026-09-20', status: 'a_pagar', pago_em: null, financeiro_categorias: { nome: 'Contas' } }], count: 1 } })
  const result = await runVoiceTool('list_accounts', { status: 'vencidas' }, context) as { soma: number, contas: unknown[] }
  assert.ok(calls.includes('financeiro_contas.eq("status","a_pagar")'))
  assert.ok(calls.includes('financeiro_contas.lt("vencimento","2026-09-30")'))
  assert.equal(result.soma, 200)
  assert.deepEqual(result.contas[0], { id: 'f1', descricao: 'Energia', valor: 200, vencimento: '2026-09-20', status: 'a_pagar', pago_em: null, categoria: 'Contas' })
})

test('search_customers by phone matches the digits whatever the stored format', async () => {
  const rows = [
    { id: 'c1', nome: 'João', ativo: true, telefones: ['(11) 98888-7777'], emails: [], documento: null, veiculos: [{ count: 2 }] },
    { id: 'c2', nome: 'Ana', ativo: true, telefones: ['(11) 91988-8877'], emails: [], documento: null, veiculos: [{ count: 0 }] }
  ]
  const { context, calls } = ctx('mecanico', { clientes: { data: rows } })
  const result = await runVoiceTool('search_customers', { telefone: '(11) 98888-7777' }, context) as { total: number, clientes: { id: string, veiculos: number }[] }
  assert.ok(calls.includes('clientes.ilike("contatos_busca","%1%1%9%8%8%8%8%7%7%7%7%")'))
  assert.equal(result.total, 1)
  assert.equal(result.clientes[0]?.id, 'c1')
  assert.equal(result.clientes[0]?.veiculos, 2)
})

test('finance_summary defaults to the current month', async () => {
  const { context, calls } = ctx('gerente', { finance_summary: { data: { entradas: 1000 } } })
  assert.deepEqual(await runVoiceTool('finance_summary', {}, context), { mes: '2026-09', resumo: { entradas: 1000 } })
  assert.deepEqual(calls, ['rpc.finance_summary({"p_mes":"2026-09-01"})'])
})
```

- [ ] **Step 2: Rodar e ver falhar** — `pnpm test`.

- [ ] **Step 3: Implementar** `server/utils/voice-ask/tools.ts`:

```ts
import type { serverSupabaseClient } from '#supabase/server'
import type { Database } from '../../../shared/types/database.ts'
import type { ColaboradorPapel } from '../../../shared/types/oficina.ts'
import { can, type PermissionAction } from '../../../layers/2.auth/app/utils/permissions.ts'
import { ilikePattern } from '../../../layers/1.base/app/utils/supabase-search.ts'
import type { ToolSchema } from './loop.ts'
import type { VoiceRefType } from './refs.ts'

type Db = Awaited<ReturnType<typeof serverSupabaseClient<Database>>>
type Args = Record<string, unknown>
type Row = Record<string, any>

export interface ToolContext {
  db: Db
  papel: ColaboradorPapel
  /** Shop-local YYYY-MM-DD sent by the client. */
  today: string
  see: (type: VoiceRefType, id: string, row: Row) => void
}

interface Tool {
  description: string
  parameters: Record<string, unknown>
  permission?: { anyOf: PermissionAction[], area: string }
  run: (args: Args, ctx: ToolContext) => Promise<unknown>
}

const MAX_ROWS = 10
const MAX_TEXT = 200
// ponytail: fixed America/Sao_Paulo offset (no DST since 2019); switch to Intl time zone math if DST returns.
const SHOP_OFFSET = '-03:00'
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/
const PLACA_RE = /^[A-Z]{3}\d[A-Z0-9]\d{2}$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ORDER_STATUS = ['aberta', 'em_andamento', 'concluida', 'cancelada'] as const
const APPOINTMENT_STATUS = ['agendado', 'confirmado', 'em_atendimento', 'concluido', 'nao_compareceu'] as const
const ACCOUNT_STATUS = ['a_pagar', 'pagas', 'vencidas'] as const
const CATALOG_TIPO = ['servico', 'peca', 'kit'] as const

const ORDER_SELECT = 'id, numero, status, orcamento_status, aberta_em, concluida_em, valor_total, pago, veiculos(id, placa, marca, modelo, clientes(id, nome))'
const ORDER_DETAIL_SELECT = `${ORDER_SELECT}, km_entrada, reclamacao, diagnostico, valor_cobrado, pago_em, forma_pagamento, parcelas`

class ArgError extends Error {
  constructor(readonly campo: string) {
    super(campo)
  }
}

const present = (value: unknown) => value !== undefined && value !== null && value !== ''

function text(args: Args, key: string, max = 100): string | undefined {
  const value = args[key]
  if (!present(value)) return undefined
  if (typeof value !== 'string' && typeof value !== 'number') throw new ArgError(key)
  return String(value).trim().slice(0, max) || undefined
}

function date(args: Args, key: string): string | undefined {
  const value = args[key]
  if (!present(value)) return undefined
  if (typeof value !== 'string' || !DATE_RE.test(value) || Number.isNaN(Date.parse(value))) throw new ArgError(key)
  return value
}

function month(args: Args, key: string): string | undefined {
  const value = args[key]
  if (!present(value)) return undefined
  if (typeof value !== 'string' || !MONTH_RE.test(value)) throw new ArgError(key)
  return value
}

function oneOf<T extends string>(args: Args, key: string, values: readonly T[]): T | undefined {
  const value = args[key]
  if (!present(value)) return undefined
  if (!values.includes(value as T)) throw new ArgError(key)
  return value as T
}

function bool(args: Args, key: string): boolean | undefined {
  const value = args[key]
  if (!present(value)) return undefined
  if (typeof value !== 'boolean') throw new ArgError(key)
  return value
}

function limit(args: Args): number {
  if (!present(args.limit)) return MAX_ROWS
  const n = Number(args.limit)
  if (!Number.isInteger(n) || n < 1) throw new ArgError('limit')
  return Math.min(n, MAX_ROWS)
}

function placa(args: Args, key: string): string | undefined {
  const value = text(args, key, 20)?.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (value === undefined) return undefined
  if (!PLACA_RE.test(value)) throw new ArgError(key)
  return value
}

function digits(args: Args, key: string): string | undefined {
  const value = text(args, key, 40)?.replace(/\D/g, '')
  if (value === undefined) return undefined
  if (!value) throw new ArgError(key)
  return value
}

function uuid(args: Args, key: string): string | undefined {
  const value = text(args, key, 40)
  if (value === undefined) return undefined
  if (!UUID_RE.test(value)) throw new ArgError(key)
  return value
}

function rows<T = Row>(result: { data: unknown, error: unknown }): T[] {
  if (result.error) throw result.error
  return (result.data ?? []) as T[]
}

const cut = (value: unknown) => typeof value === 'string' ? value.slice(0, MAX_TEXT) : value ?? null
const dayStart = (day: string) => `${day}T00:00:00${SHOP_OFFSET}`
const dayEnd = (day: string) => `${day}T23:59:59.999${SHOP_OFFSET}`
/** Matches the digits whatever the stored mask: "11988887777" → "%1%1%9%…%". */
const digitsPattern = (value: string) => `%${value.split('').join('%')}%`
const onlyDigits = (value: unknown) => String(value ?? '').replace(/\D/g, '')
const concludedTotal = (orders: Row[]) => orders.filter(o => o.status === 'concluida').reduce((sum, o) => sum + Number(o.valor_total ?? 0), 0)

async function vehicleIdsByPlaca(db: Db, value: string): Promise<string[]> {
  return rows<{ id: string }>(await db.from('veiculos').select('id').eq('placa', value)).map(v => v.id)
}

function orderSummary(row: Row, see: ToolContext['see']) {
  const vehicle = row.veiculos
  const customer = vehicle?.clientes
  see('order', row.id, row)
  if (customer) see('customer', customer.id, customer)
  if (vehicle) see('vehicle', vehicle.id, vehicle)
  return {
    id: row.id,
    numero: row.numero,
    status: row.status,
    orcamento_status: row.orcamento_status,
    placa: vehicle?.placa ?? null,
    veiculo: [vehicle?.marca, vehicle?.modelo].filter(Boolean).join(' ') || null,
    cliente_id: customer?.id ?? null,
    cliente: customer?.nome ?? null,
    aberta_em: row.aberta_em,
    concluida_em: row.concluida_em,
    valor_total: row.valor_total,
    pago: row.pago
  }
}

const s = (description: string) => ({ type: 'string', description })
const e = (values: readonly string[], description: string) => ({ type: 'string', enum: values, description })
const object = (properties: Record<string, unknown>, required: string[] = []) => ({ type: 'object', properties, required })
const FROM = s('Data inicial YYYY-MM-DD')
const TO = s('Data final YYYY-MM-DD')

const TOOLS: Record<string, Tool> = {
  search_orders: {
    description: 'Lista ordens de serviço (OS) com filtros. Retorna até 10 e o total.',
    parameters: object({
      status: e(ORDER_STATUS, 'Situação da OS'),
      placa: s('Placa do veículo'),
      numero: s('Número da OS'),
      cliente: s('Nome do cliente'),
      from: s('Aberta a partir de YYYY-MM-DD'),
      to: s('Aberta até YYYY-MM-DD'),
      pago: { type: 'boolean', description: 'Pagamento recebido' },
      limit: { type: 'integer', description: 'Máximo 10' }
    }),
    async run(args, { db, see }) {
      const status = oneOf(args, 'status', ORDER_STATUS)
      const p = placa(args, 'placa')
      const numero = text(args, 'numero', 20)
      const cliente = text(args, 'cliente')
      const from = date(args, 'from')
      const to = date(args, 'to')
      const pago = bool(args, 'pago')
      const n = limit(args)

      let vehicleIds = p ? await vehicleIdsByPlaca(db, p) : undefined
      if (cliente) {
        const customerIds = rows<{ id: string }>(await db.from('clientes').select('id').ilike('nome', ilikePattern(cliente)).limit(50)).map(c => c.id)
        const ids = customerIds.length
          ? rows<{ id: string }>(await db.from('veiculos').select('id').in('cliente_id', customerIds)).map(v => v.id)
          : []
        vehicleIds = vehicleIds ? vehicleIds.filter(id => ids.includes(id)) : ids
      }
      if (vehicleIds && !vehicleIds.length) return { total: 0, ordens: [] }

      let query = db.from('ordens_servico').select(ORDER_SELECT, { count: 'exact' }).order('aberta_em', { ascending: false }).limit(n)
      if (status) query = query.eq('status', status)
      if (numero) query = query.eq('numero', numero)
      if (pago !== undefined) query = query.eq('pago', pago)
      if (from) query = query.gte('aberta_em', dayStart(from))
      if (to) query = query.lte('aberta_em', dayEnd(to))
      if (vehicleIds) query = query.in('veiculo_id', vehicleIds)
      const result = await query
      return { total: result.count ?? 0, ordens: rows(result).map(row => orderSummary(row, see)) }
    }
  },

  get_order: {
    description: 'Detalhe de uma OS: itens do orçamento, pagamento, reclamação e diagnóstico. Informe id, número ou placa (OS mais recente da placa).',
    parameters: object({ id: s('id da OS'), numero: s('Número da OS'), placa: s('Placa do veículo') }),
    async run(args, { db, see }) {
      const id = uuid(args, 'id')
      const numero = text(args, 'numero', 20)
      const p = placa(args, 'placa')
      if (!id && !numero && !p) throw new ArgError('id')

      let query = db.from('ordens_servico').select(ORDER_DETAIL_SELECT).order('aberta_em', { ascending: false }).limit(1)
      if (id) query = query.eq('id', id)
      else if (numero) query = query.eq('numero', numero)
      else {
        const vehicleIds = await vehicleIdsByPlaca(db, p!)
        if (!vehicleIds.length) return { encontrada: false }
        query = query.in('veiculo_id', vehicleIds)
      }
      const row = rows(await query)[0]
      if (!row) return { encontrada: false }

      const items = rows(await db.from('ordem_itens').select('tipo, descricao, quantidade, valor_unitario').eq('ordem_servico_id', row.id).order('ordem').limit(20))
      return {
        ...orderSummary(row, see),
        km_entrada: row.km_entrada,
        reclamacao: cut(row.reclamacao),
        diagnostico: cut(row.diagnostico),
        valor_cobrado: row.valor_cobrado,
        pago_em: row.pago_em,
        forma_pagamento: row.forma_pagamento,
        parcelas: row.parcelas,
        itens: items.map(item => ({ ...item, descricao: cut(item.descricao) }))
      }
    }
  },

  search_customers: {
    description: 'Busca clientes por nome, documento (CPF/CNPJ) ou telefone. Retorna contatos e quantidade de veículos.',
    parameters: object({ nome: s('Nome do cliente'), documento: s('CPF ou CNPJ'), telefone: s('Telefone') }),
    async run(args, { db, see }) {
      const nome = text(args, 'nome')
      const documento = digits(args, 'documento')
      const telefone = digits(args, 'telefone')
      if (!nome && !documento && !telefone) throw new ArgError('nome')

      let query = db.from('clientes').select('id, nome, ativo, telefones, emails, documento, veiculos(count)').order('nome').limit(50)
      if (nome) query = query.ilike('nome', ilikePattern(nome))
      if (documento) query = query.ilike('documento', digitsPattern(documento))
      if (telefone) query = query.ilike('contatos_busca', digitsPattern(telefone))
      // ponytail: digit filters run on the first 50 matches; a broader digit pattern can push the real match past them.
      const found = rows(await query).filter(row =>
        (!documento || onlyDigits(row.documento) === documento)
        && (!telefone || (row.telefones ?? []).some((phone: string) => onlyDigits(phone).endsWith(telefone)))
      )
      return {
        total: found.length,
        clientes: found.slice(0, MAX_ROWS).map((row) => {
          see('customer', row.id, row)
          return {
            id: row.id,
            nome: row.nome,
            ativo: row.ativo,
            telefones: (row.telefones ?? []).slice(0, 3),
            emails: (row.emails ?? []).slice(0, 3),
            documento: row.documento,
            veiculos: row.veiculos?.[0]?.count ?? 0
          }
        })
      }
    }
  },

  customer_summary: {
    description: 'Resumo de um cliente (id vindo de search_customers): veículos, número de OS, total gasto em OS concluídas e último atendimento.',
    parameters: object({ id: s('id do cliente') }, ['id']),
    async run(args, { db, see }) {
      const id = uuid(args, 'id')
      if (!id) throw new ArgError('id')
      const customer = rows(await db.from('clientes').select('id, nome, ativo').eq('id', id).limit(1))[0]
      if (!customer) return { encontrado: false }
      see('customer', customer.id, customer)

      const vehicles = rows(await db.from('veiculos').select('id, placa, marca, modelo, ano').eq('cliente_id', id).limit(MAX_ROWS))
      vehicles.forEach(vehicle => see('vehicle', vehicle.id, vehicle))
      // ponytail: totals over the latest 500 orders; move to an RPC if a customer ever passes that.
      const orders = vehicles.length
        ? rows(await db.from('ordens_servico').select('status, valor_total, aberta_em').in('veiculo_id', vehicles.map(v => v.id)).order('aberta_em', { ascending: false }).limit(500))
        : []
      return {
        id: customer.id,
        nome: customer.nome,
        ativo: customer.ativo,
        veiculos: vehicles,
        total_os: orders.length,
        total_gasto: concludedTotal(orders),
        ultimo_atendimento: orders[0]?.aberta_em ?? null
      }
    }
  },

  vehicle_history: {
    description: 'Histórico de um veículo pela placa: dono, últimas OS, total gasto e próximo agendamento.',
    parameters: object({ placa: s('Placa do veículo') }, ['placa']),
    async run(args, { db, see }) {
      const p = placa(args, 'placa')
      if (!p) throw new ArgError('placa')
      const vehicle = rows(await db.from('veiculos').select('id, placa, marca, modelo, ano, cor, km_atual, clientes(id, nome)').eq('placa', p).limit(1))[0]
      if (!vehicle) return { encontrado: false }
      see('vehicle', vehicle.id, vehicle)
      if (vehicle.clientes) see('customer', vehicle.clientes.id, vehicle.clientes)

      const [ordersResult, nextResult] = await Promise.all([
        db.from('ordens_servico').select('id, numero, status, aberta_em, concluida_em, valor_total, reclamacao').eq('veiculo_id', vehicle.id).order('aberta_em', { ascending: false }).limit(500),
        db.from('agendamentos').select('id, inicio, servico, status').eq('veiculo_id', vehicle.id).in('status', ['agendado', 'confirmado']).gte('inicio', new Date().toISOString()).order('inicio').limit(1)
      ])
      const orders = rows(ordersResult)
      const next = rows(nextResult)[0]
      if (next) see('appointment', next.id, next)
      return {
        placa: vehicle.placa,
        veiculo: [vehicle.marca, vehicle.modelo, vehicle.ano].filter(Boolean).join(' '),
        cor: vehicle.cor,
        km_atual: vehicle.km_atual,
        dono_id: vehicle.clientes?.id ?? null,
        dono: vehicle.clientes?.nome ?? null,
        total_os: orders.length,
        total_gasto: concludedTotal(orders),
        ultimas_os: orders.slice(0, 5).map((order) => {
          see('order', order.id, order)
          return { ...order, reclamacao: cut(order.reclamacao) }
        }),
        proximo_agendamento: next ? { ...next, servico: cut(next.servico) } : null
      }
    }
  },

  list_appointments: {
    description: 'Agendamentos num período (padrão: hoje). Filtros: placa, status.',
    parameters: object({ from: FROM, to: TO, placa: s('Placa do veículo'), status: e(APPOINTMENT_STATUS, 'Situação') }),
    async run(args, { db, today, see }) {
      const from = date(args, 'from') ?? today
      const to = date(args, 'to') ?? from
      const status = oneOf(args, 'status', APPOINTMENT_STATUS)
      const p = placa(args, 'placa')

      let query = db.from('agendamentos')
        .select('id, inicio, fim, servico, status, veiculos(id, placa, marca, modelo), clientes(id, nome)', { count: 'exact' })
        .gte('inicio', dayStart(from))
        .lte('inicio', dayEnd(to))
        .order('inicio')
        .limit(MAX_ROWS)
      if (status) query = query.eq('status', status)
      if (p) {
        const vehicleIds = await vehicleIdsByPlaca(db, p)
        if (!vehicleIds.length) return { total: 0, agendamentos: [] }
        query = query.in('veiculo_id', vehicleIds)
      }
      const result = await query
      return {
        total: result.count ?? 0,
        agendamentos: rows(result).map((row) => {
          see('appointment', row.id, row)
          if (row.veiculos) see('vehicle', row.veiculos.id, row.veiculos)
          if (row.clientes) see('customer', row.clientes.id, row.clientes)
          return {
            id: row.id,
            inicio: row.inicio,
            fim: row.fim,
            placa: row.veiculos?.placa ?? null,
            veiculo: [row.veiculos?.marca, row.veiculos?.modelo].filter(Boolean).join(' ') || null,
            cliente: row.clientes?.nome ?? null,
            servico: cut(row.servico),
            status: row.status
          }
        })
      }
    }
  },

  finance_summary: {
    description: 'Resumo financeiro do mês (faturamento, recebido, despesas, saldo). Padrão: mês atual.',
    parameters: object({ mes: s('Mês YYYY-MM') }),
    permission: { anyOf: ['finance.view'], area: 'financeiro' },
    async run(args, { db, today }) {
      const mes = month(args, 'mes') ?? today.slice(0, 7)
      const { data, error } = await db.rpc('finance_summary', { p_mes: `${mes}-01` })
      if (error) throw error
      return { mes, resumo: data }
    }
  },

  list_accounts: {
    description: 'Contas a pagar. status: a_pagar (todas em aberto, inclusive vencidas), vencidas (em aberto com vencimento passado), pagas. Período pelo vencimento. Retorna até 10, o total e a soma.',
    parameters: object({ status: e(ACCOUNT_STATUS, 'Situação'), from: s('Vencimento a partir de YYYY-MM-DD'), to: s('Vencimento até YYYY-MM-DD') }),
    permission: { anyOf: ['finance.view'], area: 'financeiro' },
    async run(args, { db, today, see }) {
      const status = oneOf(args, 'status', ACCOUNT_STATUS)
      const from = date(args, 'from')
      const to = date(args, 'to')

      // ponytail: sum over the first 200 accounts of the filter; enough for a workshop month, move to an RPC if it grows.
      let query = db.from('financeiro_contas')
        .select('id, descricao, valor, vencimento, status, pago_em, financeiro_categorias(nome)', { count: 'exact' })
        .order('vencimento')
        .limit(200)
      if (status === 'pagas') query = query.eq('status', 'pago')
      else if (status) query = query.eq('status', 'a_pagar')
      else query = query.neq('status', 'cancelado')
      if (status === 'vencidas') query = query.lt('vencimento', today)
      if (from) query = query.gte('vencimento', from)
      if (to) query = query.lte('vencimento', to)
      const result = await query
      const accounts = rows(result)
      return {
        total: result.count ?? accounts.length,
        soma: accounts.reduce((sum, row) => sum + Number(row.valor ?? 0), 0),
        contas: accounts.slice(0, MAX_ROWS).map((row) => {
          see('account', row.id, row)
          return {
            id: row.id,
            descricao: cut(row.descricao),
            valor: row.valor,
            vencimento: row.vencimento,
            status: row.status,
            pago_em: row.pago_em,
            categoria: row.financeiro_categorias?.nome ?? null
          }
        })
      }
    }
  },

  search_catalog: {
    description: 'Busca serviços, peças e kits do catálogo: preço padrão, estoque e se está ativo.',
    parameters: object({ nome: s('Nome do item'), tipo: e(CATALOG_TIPO, 'Tipo') }),
    permission: { anyOf: ['budget.edit', 'catalog.manage'], area: 'catálogo' },
    async run(args, { db }) {
      const nome = text(args, 'nome')
      const tipo = oneOf(args, 'tipo', CATALOG_TIPO)
      let query = db.from('servicos_catalogo').select('id, nome, tipo, valor_padrao, estoque, ativo', { count: 'exact' }).order('nome').limit(MAX_ROWS)
      if (nome) query = query.ilike('nome', ilikePattern(nome))
      if (tipo) query = query.eq('tipo', tipo)
      const result = await query
      return { total: result.count ?? 0, itens: rows(result).map(row => ({ ...row, nome: cut(row.nome) })) }
    }
  },

  team_stats: {
    description: 'Por colaborador: OS abertas por ele no período e quantas delas já foram concluídas. Padrão: mês atual até hoje.',
    parameters: object({ from: FROM, to: TO }),
    permission: { anyOf: ['collaborators.manage'], area: 'equipe' },
    async run(args, { db, today }) {
      const from = date(args, 'from') ?? `${today.slice(0, 7)}-01`
      const to = date(args, 'to') ?? today
      // ponytail: counts over the first 2000 orders of the period, in memory; move to an RPC if the shop outgrows it.
      const [collaborators, orders] = await Promise.all([
        db.rpc('list_collaborators'),
        db.from('ordens_servico').select('aberto_por, status').gte('aberta_em', dayStart(from)).lte('aberta_em', dayEnd(to)).limit(2000)
      ])
      const opened = rows(orders)
      return {
        from,
        to,
        colaboradores: rows(collaborators).slice(0, 20).map((person) => {
          const mine = opened.filter(order => order.aberto_por === person.id)
          return { nome: person.nome, papel: person.papel, os_abertas: mine.length, os_concluidas: mine.filter(order => order.status === 'concluida').length }
        })
      }
    }
  }
}

export const VOICE_TOOL_SCHEMAS: ToolSchema[] = Object.entries(TOOLS).map(([name, tool]) => ({
  type: 'function',
  function: { name, description: tool.description, parameters: tool.parameters }
}))

/** Never throws: errors become `{ erro }` results the AI can explain. */
export async function runVoiceTool(name: string, args: unknown, ctx: ToolContext): Promise<unknown> {
  const tool = Object.hasOwn(TOOLS, name) ? TOOLS[name] : undefined
  if (!tool) return { erro: 'ferramenta_desconhecida' }
  if (tool.permission && !tool.permission.anyOf.some(action => can(ctx.papel, action))) {
    return { erro: 'sem_permissao', area: tool.permission.area }
  }
  try {
    const safeArgs = args && typeof args === 'object' && !Array.isArray(args) ? args as Args : {}
    return await tool.run(safeArgs, ctx)
  } catch (error) {
    return error instanceof ArgError ? { erro: 'argumento_invalido', campo: error.campo } : { erro: 'falha_consulta' }
  }
}
```

Notas para o implementador:
- O typecheck pode reclamar das seleções embutidas do client tipado (`veiculos(count)`, relações aninhadas) e das chaves `any` em `Row`; resolva com casts locais (`as unknown as Row[]`) ou `// eslint-disable-next-line @typescript-eslint/no-explicit-any` na linha de `type Row`, sem mudar o comportamento. Até a Task 4 existir, o erro de `./loop.ts` não encontrado no typecheck é esperado — os testes passam porque `import type` é apagado.
- Os testes passam pelos `.ts` relativos; não use aliases (`~~`, `#layers`) em imports de runtime.

- [ ] **Step 4: Verificar** — `pnpm test`, `pnpm lint`. (`npx nuxt typecheck` completo só depois das Tasks 2 e 4.)

- [ ] **Step 5: Commit**

```bash
git add server/utils/voice-ask/tools.ts server/utils/voice-ask/tools.test.ts
git commit -m ":sparkles: feat(voice): add read-only data tools for questions"
```

---

### Task 4: Laço de tool calling e prompt das perguntas

**Files:**
- Create: `server/utils/voice-ask/loop.ts`, `server/utils/voice-ask/loop.test.ts`
- Create: `server/utils/voice-ask/prompt.ts`, `server/utils/voice-ask/prompt.test.ts`

**Interfaces:**
- Consumes: `VoiceProvider` (tipo) de `server/utils/voice-providers.ts`.
- Produces: `ToolSchema`, `AskMessage`, `askWithTools(options): Promise<{ answer: string, refs: unknown } | null>`; `buildAskSystemPrompt({ today, papel }): string`.

- [ ] **Step 1: Testes que falham**

`server/utils/voice-ask/loop.test.ts`:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import type { VoiceProvider } from '../voice-providers.ts'
import { askWithTools, type ToolSchema } from './loop.ts'

const main: VoiceProvider = { name: 'groq', url: 'https://main.test', apiKey: 'k', model: 'big', extra: { reasoning_effort: 'low' } }
const backup: VoiceProvider = { name: 'groq-fallback', url: 'https://backup.test', apiKey: 'k', model: 'small' }
const tools: ToolSchema[] = [{ type: 'function', function: { name: 'search_orders', description: 'x', parameters: { type: 'object', properties: {} } } }]
const base = [{ role: 'system' as const, content: 'sys' }, { role: 'user' as const, content: 'quantas OS abertas?' }]

type Body = { model: string, messages: Record<string, unknown>[], tools: ToolSchema[], tool_choice: unknown, reasoning_effort?: string }

function call(name: string, args: unknown, id = 'c1') {
  return { id, type: 'function', function: { name, arguments: typeof args === 'string' ? args : JSON.stringify(args) } }
}

function reply(message: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify({ choices: [{ message: { role: 'assistant', content: null, ...message } }] }), { status })
}

function fakeFetch(handlers: Record<string, (body: Body) => Response>) {
  const calls: { url: string, body: Body }[] = []
  const fn = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input)
    const body = JSON.parse(String(init?.body)) as Body
    calls.push({ url, body })
    const handler = handlers[url]
    if (!handler) throw new Error(`unexpected ${url}`)
    return handler(body)
  }) as typeof fetch
  return { fn, calls }
}

test('runs a data round, then returns final_answer', async () => {
  const executed: unknown[] = []
  const { fn, calls } = fakeFetch({
    'https://main.test': body => body.messages.some(m => m.role === 'tool')
      ? reply({ tool_calls: [call('final_answer', { answer: 'Há 7 OS abertas.', refs: [{ type: 'order', id: 'o1' }] }, 'c2')] })
      : reply({ tool_calls: [call('search_orders', { status: 'aberta' })] })
  })
  const result = await askWithTools({
    providers: [main, backup],
    messages: base,
    tools,
    execute: async (name, args) => {
      executed.push([name, args])
      return { total: 7 }
    },
    fetch: fn
  })
  assert.deepEqual(result, { answer: 'Há 7 OS abertas.', refs: [{ type: 'order', id: 'o1' }] })
  assert.deepEqual(executed, [['search_orders', { status: 'aberta' }]])
  assert.equal(calls[0]?.body.tool_choice, 'required')
  assert.equal(calls[0]?.body.reasoning_effort, 'low')
  assert.deepEqual(calls[0]?.body.tools.map(t => t.function.name), ['search_orders', 'final_answer'])
  const second = calls[1]!.body.messages
  assert.deepEqual(second.at(-2), { role: 'assistant', content: null, tool_calls: [call('search_orders', { status: 'aberta' })] })
  assert.deepEqual(second.at(-1), { role: 'tool', tool_call_id: 'c1', content: '{"total":7}' })
})

test('forces final_answer after 3 data rounds', async () => {
  const { fn, calls } = fakeFetch({
    'https://main.test': body => typeof body.tool_choice === 'object'
      ? reply({ tool_calls: [call('final_answer', { answer: 'Não encontrei.' }, 'f')] })
      : reply({ tool_calls: [call('search_orders', {})] })
  })
  const result = await askWithTools({ providers: [main], messages: base, tools, execute: async () => ({ total: 0 }), fetch: fn })
  assert.deepEqual(result, { answer: 'Não encontrei.', refs: undefined })
  assert.equal(calls.length, 4)
  assert.deepEqual(calls[3]?.body.tool_choice, { type: 'function', function: { name: 'final_answer' } })
})

test('falls back to the second model and keeps the conversation', async () => {
  const errors: string[] = []
  const { fn, calls } = fakeFetch({
    'https://main.test': () => new Response('limit', { status: 429 }),
    'https://backup.test': () => reply({ tool_calls: [call('final_answer', { answer: 'Oi.' })] })
  })
  const result = await askWithTools({ providers: [main, backup], messages: base, tools, execute: async () => ({}), fetch: fn, onError: (p, r) => errors.push(`${p}: ${r}`) })
  assert.equal(result?.answer, 'Oi.')
  assert.equal(calls[1]?.body.model, 'small')
  assert.deepEqual(errors, ['groq: HTTP 429'])
})

test('both models failing returns null', async () => {
  const { fn } = fakeFetch({
    'https://main.test': () => new Response('x', { status: 500 }),
    'https://backup.test': () => { throw new Error('network') }
  })
  assert.equal(await askWithTools({ providers: [main, backup], messages: base, tools, execute: async () => ({}), fetch: fn }), null)
})

test('invalid JSON arguments are answered with an error, not executed', async () => {
  let executed = false
  const { fn, calls } = fakeFetch({
    'https://main.test': body => body.messages.some(m => m.role === 'tool')
      ? reply({ tool_calls: [call('final_answer', { answer: 'Tente de novo.' }, 'c2')] })
      : reply({ tool_calls: [call('search_orders', '{oops')] })
  })
  await askWithTools({ providers: [main], messages: base, tools, execute: async () => { executed = true }, fetch: fn })
  assert.equal(executed, false)
  assert.deepEqual(calls[1]?.body.messages.at(-1), { role: 'tool', tool_call_id: 'c1', content: '{"erro":"argumento_invalido","campo":"json"}' })
})

test('plain text without tool calls is accepted as the answer; empty final answer is a failure', async () => {
  const text = fakeFetch({ 'https://main.test': () => reply({ content: ' Há 2 OS. ' }) })
  assert.deepEqual(await askWithTools({ providers: [main], messages: base, tools, execute: async () => ({}), fetch: text.fn }), { answer: 'Há 2 OS.', refs: [] })
  const empty = fakeFetch({ 'https://main.test': () => reply({ tool_calls: [call('final_answer', { answer: '  ' })] }) })
  assert.equal(await askWithTools({ providers: [main], messages: base, tools, execute: async () => ({}), fetch: empty.fn }), null)
})

test('stops when the total time budget is spent', async () => {
  const { fn, calls } = fakeFetch({ 'https://main.test': () => reply({ tool_calls: [call('search_orders', {})] }) })
  const result = await askWithTools({ providers: [main], messages: base, tools, execute: async () => ({}), fetch: fn, totalTimeoutMs: 0 })
  assert.equal(result, null)
  assert.equal(calls.length, 0)
})
```

`server/utils/voice-ask/prompt.test.ts`:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { buildAskSystemPrompt } from './prompt.ts'

test('ask prompt has date, weekday, role and the safety rules', () => {
  const prompt = buildAskSystemPrompt({ today: '2026-09-30', papel: 'recepcao' })
  assert.match(prompt, /Hoje é 2026-09-30 \(quarta-feira\)/)
  assert.match(prompt, /Perfil do usuário: recepção/)
  assert.match(prompt, /Nunca invente/)
  assert.match(prompt, /até 3 frases/)
  assert.match(prompt, /\[telefone 1\]/)
  assert.match(prompt, /final_answer/)
  assert.doesNotMatch(prompt, /senha:/i)
})
```

- [ ] **Step 2: Rodar e ver falhar** — `pnpm test`.

- [ ] **Step 3: Implementar**

`server/utils/voice-ask/loop.ts`:

```ts
import type { VoiceProvider } from '../voice-providers.ts'

export interface ToolSchema {
  type: 'function'
  function: { name: string, description: string, parameters: Record<string, unknown> }
}

interface ToolCall {
  id: string
  type: 'function'
  function: { name: string, arguments: string }
}

export type AskMessage
  = | { role: 'system' | 'user', content: string }
    | { role: 'assistant', content: string | null, tool_calls?: ToolCall[] }
    | { role: 'tool', tool_call_id: string, content: string }

interface AskOptions {
  providers: VoiceProvider[]
  messages: AskMessage[]
  tools: ToolSchema[]
  execute: (name: string, args: unknown) => Promise<unknown>
  fetch?: typeof fetch
  callTimeoutMs?: number
  totalTimeoutMs?: number
  onError?: (provider: string, reason: string) => void
}

type ModelMessage = { content?: string | null, tool_calls?: ToolCall[] }

const MAX_DATA_ROUNDS = 3
const MAX_CALLS_PER_ROUND = 5
const MAX_ANSWER = 1000

const FINAL_ANSWER: ToolSchema = {
  type: 'function',
  function: {
    name: 'final_answer',
    description: 'Entrega a resposta final ao usuário, quando já tiver os dados (ou souber que não há).',
    parameters: {
      type: 'object',
      properties: {
        answer: { type: 'string', description: 'Resposta curta em português para ser falada, até 3 frases.' },
        refs: {
          type: 'array',
          description: 'Registros citados na resposta, com type e id exatos vindos das ferramentas.',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['order', 'customer', 'vehicle', 'appointment', 'account'] },
              id: { type: 'string' }
            },
            required: ['type', 'id']
          }
        }
      },
      required: ['answer']
    }
  }
}

function parseArgs(raw: string | undefined): unknown {
  try {
    return JSON.parse(raw || '{}')
  } catch {
    return undefined
  }
}

async function complete(options: AskOptions, messages: AskMessage[], toolChoice: unknown, deadline: number): Promise<ModelMessage | null> {
  const doFetch = options.fetch ?? fetch
  for (const provider of options.providers) {
    if (!provider.apiKey) continue
    const left = deadline - Date.now()
    if (left <= 0) return null
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
          tools: [...options.tools, FINAL_ANSWER],
          tool_choice: toolChoice,
          temperature: 0,
          ...provider.extra
        }),
        signal: AbortSignal.timeout(Math.min(options.callTimeoutMs ?? 8_000, left))
      })
      if (!response.ok) {
        await response.body?.cancel()
        options.onError?.(provider.name, `HTTP ${response.status}`)
        continue
      }
      const body = await response.json() as { choices?: { message?: ModelMessage }[] }
      const message = body.choices?.[0]?.message
      if (!message?.tool_calls?.length && !message?.content?.trim()) {
        options.onError?.(provider.name, 'empty response')
        continue
      }
      return message
    } catch (error) {
      options.onError?.(provider.name, error instanceof Error ? error.message : String(error))
    }
  }
  return null
}

/** Tool-calling loop: up to 3 data rounds, then `final_answer` is forced. Null when every provider fails. */
export async function askWithTools(options: AskOptions): Promise<{ answer: string, refs: unknown } | null> {
  const deadline = Date.now() + (options.totalTimeoutMs ?? 25_000)
  const messages = [...options.messages]
  for (let round = 0; round <= MAX_DATA_ROUNDS; round++) {
    const toolChoice = round === MAX_DATA_ROUNDS ? { type: 'function', function: { name: 'final_answer' } } : 'required'
    const message = await complete(options, messages, toolChoice, deadline)
    if (!message) return null

    const calls = (message.tool_calls ?? []).slice(0, MAX_CALLS_PER_ROUND)
    const final = calls.find(item => item.function?.name === 'final_answer')
    if (final) {
      const args = parseArgs(final.function.arguments) as { answer?: unknown, refs?: unknown } | undefined
      const answer = typeof args?.answer === 'string' ? args.answer.trim().slice(0, MAX_ANSWER) : ''
      return answer ? { answer, refs: args?.refs } : null
    }
    if (!calls.length) {
      const answer = message.content?.trim().slice(0, MAX_ANSWER)
      return answer ? { answer, refs: [] } : null
    }

    messages.push({ role: 'assistant', content: message.content ?? null, tool_calls: calls })
    for (const item of calls) {
      const args = parseArgs(item.function?.arguments)
      const result = args === undefined
        ? { erro: 'argumento_invalido', campo: 'json' }
        : await options.execute(item.function.name, args)
      messages.push({ role: 'tool', tool_call_id: item.id, content: JSON.stringify(result) })
    }
  }
  return null
}
```

`server/utils/voice-ask/prompt.ts`:

```ts
import type { ColaboradorPapel } from '../../../shared/types/oficina.ts'

const PAPEL_LABEL: Record<ColaboradorPapel, string> = {
  recepcao: 'recepção',
  mecanico: 'mecânico',
  gerente: 'gerente'
}

export function buildAskSystemPrompt({ today, papel }: { today: string, papel: ColaboradorPapel }): string {
  const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', timeZone: 'UTC' }).format(new Date(`${today}T12:00:00Z`))
  return `Você é o assistente de uma oficina mecânica brasileira e responde perguntas sobre os dados da oficina.
Hoje é ${today} (${weekday}). Perfil do usuário: ${PAPEL_LABEL[papel]}.

Regras:
- Busque os dados com as ferramentas e responda só com o que elas retornarem. Nunca invente.
- Se não encontrar, diga que não encontrou. Se uma ferramenta responder sem_permissao, diga que o perfil do usuário não tem acesso a essa área. Se responder falha_consulta, diga que não conseguiu consultar agora.
- Datas das ferramentas em YYYY-MM-DD e meses em YYYY-MM, calculadas a partir de hoje ("este mês", "semana que vem", "agosto").
- "OS do Pedro": se Pedro for colaborador, são as OS abertas por ele (team_stats); se for cliente, busque pelo nome do cliente.
- Termine sempre chamando final_answer: resposta curta para ser falada (até 3 frases), valores em reais ("R$ 1.250,00"), datas por extenso ("2 de outubro").
- Em final_answer.refs, cite os registros mencionados com type e id exatos das ferramentas.
- Textos entre colchetes, como [telefone 1], são dados protegidos: repita exatamente como vieram, sem alterar.
- Nunca fale de senhas.`
}
```

- [ ] **Step 4: Verificar** — `pnpm test`, `pnpm lint`.

- [ ] **Step 5: Commit**

```bash
git add server/utils/voice-ask/loop.ts server/utils/voice-ask/loop.test.ts server/utils/voice-ask/prompt.ts server/utils/voice-ask/prompt.test.ts
git commit -m ":sparkles: feat(voice): add tool-calling loop and question prompt"
```

---

### Task 5: Rota `POST /api/voice/ask`

**Files:**
- Create: `server/api/voice/ask.post.ts`

**Interfaces:**
- Consumes: `createMasker` (Task 2), `createRefs`/`VoiceLink` (Task 2), `runVoiceTool`/`VOICE_TOOL_SCHEMAS` (Task 3), `askWithTools`/`AskMessage` (Task 4), `buildAskSystemPrompt` (Task 4).
- Produces: `POST /api/voice/ask` body `{ messages: { role: 'user' | 'assistant', content: string }[], today: 'YYYY-MM-DD' }` → `{ answer: string, refs: VoiceLink[], history: string }`; 400 inválido, 401 sem login, 403 sem papel, 503 IA indisponível.

- [ ] **Step 1: Implementar** `server/api/voice/ask.post.ts`:

```ts
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~~/shared/types/database'
import type { ColaboradorPapel } from '~~/shared/types/oficina'
import { askWithTools, type AskMessage } from '../../utils/voice-ask/loop'
import { createMasker } from '../../utils/voice-ask/mask'
import { buildAskSystemPrompt } from '../../utils/voice-ask/prompt'
import { createRefs } from '../../utils/voice-ask/refs'
import { runVoiceTool, VOICE_TOOL_SCHEMAS } from '../../utils/voice-ask/tools'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MAX_MESSAGES = 10
const MAX_CONTENT = 2000
const PAPEIS: readonly ColaboradorPapel[] = ['recepcao', 'mecanico', 'gerente']
const UNAVAILABLE = 'Não consegui responder agora. Tente de novo.'

type ChatMessage = { role: 'user' | 'assistant', content: string }

function parseMessages(raw: unknown): ChatMessage[] | null {
  if (!Array.isArray(raw)) return null
  const messages = raw.slice(-MAX_MESSAGES)
  const valid = messages.every(item =>
    item && typeof item === 'object'
    && (item.role === 'user' || item.role === 'assistant')
    && typeof item.content === 'string'
    && item.content.trim()
    && item.content.length <= MAX_CONTENT
  )
  if (!valid || messages.at(-1)?.role !== 'user') return null
  return messages.map(item => ({ role: item.role, content: item.content.trim() }))
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user?.sub) {
    throw createError({ statusCode: 401, message: 'Não autenticado' })
  }

  const body = await readBody<{ messages?: unknown, today?: unknown }>(event)
  const messages = parseMessages(body?.messages)
  const today = typeof body?.today === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.today) ? body.today : ''
  if (!messages || !today) {
    throw createError({ statusCode: 400, message: 'Pergunta inválida' })
  }

  const db = await serverSupabaseClient<Database>(event)
  const { data: profile } = await db.from('profiles').select('papel').eq('id', user.sub).single()
  const papel = PAPEIS.find(value => value === profile?.papel)
  if (!papel) {
    throw createError({ statusCode: 403, message: 'Sem perfil' })
  }

  const masker = createMasker(messages.map(item => item.content))
  const refs = createRefs()
  const config = useRuntimeConfig(event)
  const conversation: AskMessage[] = [
    { role: 'system', content: buildAskSystemPrompt({ today, papel }) },
    ...messages.map(item => ({ role: item.role, content: masker.maskText(item.content) }))
  ]

  const result = await askWithTools({
    providers: [
      { name: 'groq', url: GROQ_URL, apiKey: config.groqApiKey, model: config.groqModel, extra: { reasoning_effort: 'low' } },
      { name: 'groq-fallback', url: GROQ_URL, apiKey: config.groqApiKey, model: config.groqFallbackModel, extra: { reasoning_effort: 'low' } }
    ],
    messages: conversation,
    tools: VOICE_TOOL_SCHEMAS,
    execute: async (name, args) => masker.maskResult(await runVoiceTool(name, masker.unmaskArgs(args), { db, papel, today, see: refs.add })),
    onError: (provider, reason) => console.warn(`[voice-ask] ${provider} failed: ${reason}`)
  })

  if (!result) {
    throw createError({ statusCode: 503, message: UNAVAILABLE })
  }

  return { answer: masker.unmask(result.answer), refs: refs.links(result.refs), history: result.answer }
})
```

Se `ColaboradorPapel` não existir com esse nome em `shared/types/oficina.ts`, use o tipo que `permissions.ts` importa.

- [ ] **Step 2: Verificar** — `npx nuxt typecheck`, `pnpm lint`, `pnpm test`. Smoke sem login: com `pnpm dev` rodando, `curl -s -o /dev/null -w '%{http_code}' -X POST localhost:3000/api/voice/ask -H 'content-type: application/json' -d '{}'` → `401`.

- [ ] **Step 3: Commit**

```bash
git add server/api/voice/ask.post.ts
git commit -m ":sparkles: feat(voice): add ask endpoint"
```

---

### Task 6: Conversa no painel de voz

**Files:**
- Create: `layers/1.base/app/composables/useVoiceAsk.ts`
- Modify: `layers/1.base/app/components/VoiceCommandButton.vue`

**Interfaces:**
- Consumes: `VoiceRunResult` com `ask?: true` (Task 1); `POST /api/voice/ask` (Task 5).
- Produces: `useVoiceAsk()` → `{ messages, pending, muted, ask(question): Promise<boolean>, cancel(), reset(), stopSpeaking(), toggleMute() }`.

- [ ] **Step 1: Implementar** `layers/1.base/app/composables/useVoiceAsk.ts`:

```ts
import { localDateInput } from '../utils/voice/prompt'

export interface VoiceAskLink {
  label: string
  to: string
}

export interface VoiceAskMessage {
  role: 'user' | 'assistant' | 'error'
  content: string
  refs?: VoiceAskLink[]
}

type HistoryMessage = { role: 'user' | 'assistant', content: string }

const MUTE_KEY = 'voice-ask-muted'
const MAX_HISTORY = 10
const ERROR_TEXT = 'Não consegui responder agora. Tente de novo.'

/** Short conversation about the shop's data; lives until `reset` (panel closed). */
export function useVoiceAsk() {
  const messages = ref<VoiceAskMessage[]>([])
  const pending = ref(false)
  const muted = ref(false)
  // Assistant turns hold the masked answer the server returned, never the revealed one.
  let history: HistoryMessage[] = []
  let controller: AbortController | undefined

  onMounted(() => {
    muted.value = localStorage.getItem(MUTE_KEY) === '1'
  })

  function canSpeak() {
    return import.meta.client && 'speechSynthesis' in window
  }

  function stopSpeaking() {
    if (canSpeak()) window.speechSynthesis.cancel()
  }

  function speak(text: string) {
    if (muted.value || !canSpeak()) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'pt-BR'
    window.speechSynthesis.speak(utterance)
  }

  function toggleMute() {
    muted.value = !muted.value
    localStorage.setItem(MUTE_KEY, muted.value ? '1' : '0')
    if (muted.value) stopSpeaking()
  }

  function cancel() {
    controller?.abort()
    controller = undefined
    pending.value = false
  }

  function reset() {
    cancel()
    stopSpeaking()
    messages.value = []
    history = []
  }

  async function ask(question: string): Promise<boolean> {
    cancel()
    stopSpeaking()
    const current = new AbortController()
    controller = current
    messages.value.push({ role: 'user', content: question })
    pending.value = true
    const turn: HistoryMessage[] = [...history, { role: 'user' as const, content: question }].slice(-MAX_HISTORY)
    try {
      const response = await $fetch<{ answer: string, refs: VoiceAskLink[], history: string }>('/api/voice/ask', {
        method: 'POST',
        body: { messages: turn, today: localDateInput(new Date()) },
        signal: current.signal,
        // Server budget is 25 s for the whole tool loop.
        timeout: 30_000
      })
      if (current !== controller) return false
      history = [...turn, { role: 'assistant' as const, content: response.history }].slice(-MAX_HISTORY)
      messages.value.push({ role: 'assistant', content: response.answer, refs: response.refs })
      speak(response.answer)
      return true
    } catch {
      if (current !== controller) return false
      messages.value.push({ role: 'error', content: ERROR_TEXT })
      return false
    } finally {
      if (current === controller) {
        pending.value = false
        controller = undefined
      }
    }
  }

  onScopeDispose(reset)

  return { messages, pending, muted, ask, cancel, reset, stopSpeaking, toggleMute }
}
```

- [ ] **Step 2: Integrar no `VoiceCommandButton.vue`**

Script — após `const { run } = useVoiceCommand()`:

```ts
const { messages, pending, muted, ask, cancel: cancelAsk, reset: resetAsk, stopSpeaking, toggleMute } = useVoiceAsk()
const conversing = computed(() => messages.value.length > 0)
```

No `watch(open, …)`, depois de `runId++`, acrescente `resetAsk()`.

Em `toggleListening`, primeira linha: `stopSpeaking()`.

Nova função (antes de `submit`):

```ts
async function sendQuestion(question: string) {
  text.value = ''
  interim.value = ''
  const answered = await ask(question)
  if (!answered && open.value && !text.value) text.value = question
}
```

Em `submit`, troque o corpo do `try` por:

```ts
    if (conversing.value) {
      await sendQuestion(command)
      return
    }
    const result = await run(command, isCancelled)
    if (isCancelled()) return
    if (result.ok && result.ask) await sendQuestion(command)
    else if (!result.ok && result.reason === 'not_understood') notUnderstood.value = true
    else open.value = false
```

Template:

- `UModal`: `:title="conversing ? 'Pergunta por voz' : 'Comando de voz'"` e `:description="conversing ? 'Pergunte mais alguma coisa ou toque num atalho. A conversa some ao fechar.' : 'Fale à vontade, pode pausar. Toque em Enviar quando terminar e confira os dados antes de salvar.'"`.
- No início do `<div class="space-y-4">` do `#body`:

```vue
        <ol
          v-if="conversing"
          class="space-y-3"
          aria-live="polite"
        >
          <li
            v-for="(message, index) in messages"
            :key="index"
            class="flex flex-col gap-2"
            :class="message.role === 'user' ? 'items-end' : 'items-start'"
          >
            <p
              class="max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm"
              :class="{
                'bg-primary text-inverted': message.role === 'user',
                'bg-elevated text-default': message.role === 'assistant',
                'bg-error/10 text-error': message.role === 'error'
              }"
            >
              {{ message.content }}
            </p>
            <div
              v-if="message.refs?.length"
              class="flex flex-wrap gap-2"
            >
              <UButton
                v-for="link in message.refs"
                :key="link.to"
                :to="link.to"
                :label="link.label"
                size="xs"
                color="neutral"
                variant="outline"
                trailing-icon="i-lucide-arrow-up-right"
                @click="open = false"
              />
            </div>
          </li>
        </ol>

        <p
          v-if="pending"
          role="status"
          class="flex items-center gap-2 text-sm text-muted"
        >
          <UIcon
            name="i-lucide-loader-circle"
            class="size-4 animate-spin"
          />
          Consultando…
          <UButton
            label="Cancelar"
            color="neutral"
            variant="link"
            size="xs"
            @click="cancelAsk"
          />
        </p>
```

- `UTextarea`: `:placeholder="conversing ? 'Pergunte mais alguma coisa…' : 'Ex.: abre a OS do ABC1D23 e coloca no diagnóstico pastilha gasta'"`.
- `UAlert` de `notUnderstood`: `v-if="notUnderstood && !conversing"`.
- `UCollapsible` de exemplos: `v-if="!conversing"`.
- No `#footer`, primeiro filho do `div` de botões:

```vue
        <UButton
          v-if="conversing"
          :icon="muted ? 'i-lucide-volume-x' : 'i-lucide-volume-2'"
          :aria-label="muted ? 'Ativar leitura das respostas' : 'Silenciar respostas'"
          color="neutral"
          variant="ghost"
          class="me-auto"
          @click="toggleMute"
        />
```

- [ ] **Step 3: Verificar** — `npx nuxt typecheck`, `pnpm lint`, `pnpm test`.

- [ ] **Step 4: Commit**

```bash
git add layers/1.base/app/composables/useVoiceAsk.ts layers/1.base/app/components/VoiceCommandButton.vue
git commit -m ":sparkles: feat(voice): add conversation mode to voice panel"
```

---

## Fechamento

- [ ] Revisão final do conjunto (base `d070c57` → HEAD) e uma onda de correções.
- [ ] `pnpm test`, `npx nuxt typecheck`, `pnpm lint`, `pnpm build`.
- [ ] Teste ao vivo com chaves Groq válidas (hoje 401): "quantas OS estão abertas?", "quanto faturei este mês?" → "e em agosto?", "qual o telefone do <cliente>?" (número real na tela; servidor só mandou marcador), "quando o <placa> veio por último?" com atalho.
- [ ] `graphify update .` e commit separado `:wrench: chore: update graphify graph`.
