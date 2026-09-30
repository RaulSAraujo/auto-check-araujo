# Voz — Controles de tela Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Buscar, filtrar, trocar aba/período, imprimir, baixar PDF e mandar WhatsApp por voz, na tela atual ou vindo de outra.

**Architecture:** A URL vira a fonte única dos controles das listas (`useRouteQueryState`). A voz só navega com parâmetros de um catálogo declarativo (`VOICE_VIEWS`) validados pelo normalizador; na mesma tela ela mescla com a query atual. Imprimir/PDF/WhatsApp são ações `direct` da OS tratadas em `orders-[id].vue`.

**Tech Stack:** Nuxt 4 layers, Vue 3, Nuxt UI v4 (`useToast`), `node:test` (`pnpm test`), TypeScript 6.

**Spec:** `docs/superpowers/specs/2026-09-30-voice-screen-controls-design.md`

## Global Constraints

- Código em inglês; textos de UI em português.
- Utils de voz em `layers/1.base/app/utils/voice/` são TS apagável: só `import type` para tipos, imports relativos com `.ts`, sem Nuxt/Vue — testados com `node --test`.
- Commits: `:emoji: tipo(escopo): descrição em inglês no imperativo, minúscula, sem ponto`.
- Nunca commitar `.env` nem `.superpowers/`. Tarefas não commitam `graphify-out/` (só o fechamento, em commit próprio).
- A voz nunca grava no banco sozinha; tudo que vem da IA passa por `normalizeVoiceCommand`.
- Comentários só para restrições que o código não mostra.
- Verificação por tarefa: `pnpm test` e `npx nuxt typecheck` (rodar com permissão total fora do sandbox). Lint: `pnpm lint`.

## Ordem / paralelismo

- Onda 1 (paralelo, arquivos disjuntos): Task 1, Task 2.
- Onda 2 (paralelo, arquivos disjuntos): Task 3, Task 4 (dependem da Task 2), Task 5 (depende da Task 1).

---

### Task 1: `navigate` com `query` a partir do catálogo de visões

**Files:**
- Create: `layers/1.base/app/utils/voice/views.ts`
- Modify: `layers/1.base/app/utils/voice/catalog.ts` (tipos `VoiceFieldType`, `VoiceField.max`, `VoiceAction.permission`)
- Modify: `layers/1.base/app/utils/voice/types.ts` (`VoiceCommand.date` → `query`; exemplos)
- Modify: `layers/1.base/app/utils/voice/normalize.ts`
- Modify: `layers/1.base/app/utils/voice/prompt.ts`
- Modify: `layers/1.base/app/composables/useVoiceCommand.ts`
- Test: `layers/1.base/app/utils/voice/normalize.test.ts`, `prompt.test.ts`, `catalog.test.ts`

**Interfaces:**
- Produces: `VOICE_VIEWS: Partial<Record<VoiceNavTarget, Record<string, VoiceField>>>`; `VoiceCommand.query?: Record<string, string>`; `VoiceFieldType` inclui `'month'`; `VoiceAction.permission?: PermissionAction` (ausente = basta acessar a tela).

- [ ] **Step 1: Testes que falham**

Em `normalize.test.ts`, substituir o teste `'navigate keeps date only for the agenda'` inteiro por:

```ts
test('navigate keeps only the query params the screen declares', () => {
  assert.deepEqual(n({ op: 'navigate', to: 'orders', query: { q: ' João ', status: 'aberta' } }), { op: 'navigate', to: 'orders', query: { q: 'João', status: 'aberta' } })
  assert.deepEqual(n({ op: 'navigate', to: 'orders', query: { status: 'perdida', page: '2' } }), { op: 'navigate', to: 'orders' })
  assert.deepEqual(n({ op: 'navigate', to: 'scheduling', query: { dia: '2026-10-02', vista: 'week' } }), { op: 'navigate', to: 'scheduling', query: { dia: '2026-10-02', vista: 'week' } })
  assert.deepEqual(n({ op: 'navigate', to: 'scheduling', query: { dia: '2026-02-30' } }), { op: 'navigate', to: 'scheduling' })
  assert.deepEqual(n({ op: 'navigate', to: 'finance', query: { mes: '2026-08', aba: 'contas' } }), { op: 'navigate', to: 'finance', query: { aba: 'contas', mes: '2026-08' } })
  assert.deepEqual(n({ op: 'navigate', to: 'finance', query: { mes: '2026-13' } }), { op: 'navigate', to: 'finance' })
  assert.equal(n({ op: 'navigate', to: 'orders', query: { q: 'x'.repeat(300) } })?.query?.q?.length, 100)
  assert.deepEqual(n({ op: 'navigate', to: 'team', query: { q: 'Pedro' } }), { op: 'navigate', to: 'team' })
  assert.deepEqual(n({ op: 'navigate', to: 'scheduling', date: '2026-10-02' }), { op: 'navigate', to: 'scheduling' })
  assert.equal(n({ op: 'navigate', to: 'moon' }), null)
})
```

Em `prompt.test.ts`, no teste `'prompt has date, page, text, detailed current entity and compact others'`, acrescentar antes do `})`:

```ts
  assert.match(system!.content, /- orders: q \(busca\), status \(all\|aberta\|em_andamento\|concluida\|cancelada\)/)
  assert.match(system!.content, /mes \(YYYY-MM\)/)
  assert.match(system!.content, /"query":\{/)
```

Em `catalog.test.ts`, trocar a linha

```ts
      assert.ok(PERMISSIONS.includes(action.permission), `${key}.${name}: permission`)
```

por

```ts
      if (action.permission) assert.ok(PERMISSIONS.includes(action.permission), `${key}.${name}: permission`)
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm test`
Expected: FAIL em `navigate keeps only the query params…` e no teste do prompt.

- [ ] **Step 3: Tipos em `catalog.ts`**

```ts
export type VoiceFieldType = 'text' | 'number' | 'money' | 'date' | 'month' | 'time' | 'bool' | 'enum' | 'placa' | 'digits' | 'email'
```

Em `VoiceField`, trocar `max?: number` por:

```ts
  /** number/money: max value; text: max length. */
  max?: number
```

Em `VoiceAction`, trocar `permission: PermissionAction` por:

```ts
  /** Absent: anyone who can open the screen (print, share). */
  permission?: PermissionAction
```

- [ ] **Step 4: Criar `views.ts`**

```ts
import type { VoiceField } from './catalog.ts'
import type { VoiceNavTarget } from './types.ts'

const q: VoiceField = { type: 'text', max: 100, hint: 'busca' }
const oneOf = (...values: string[]): VoiceField => ({ type: 'enum', values })

/** List controls each screen keeps in the URL query; voice navigates with them. */
export const VOICE_VIEWS: Partial<Record<VoiceNavTarget, Record<string, VoiceField>>> = {
  orders: { q, status: oneOf('all', 'aberta', 'em_andamento', 'concluida', 'cancelada') },
  customers: { q, status: oneOf('ativos', 'inativos', 'all') },
  vehicles: { q: { ...q, hint: 'placa' } },
  scheduling: { q, filtro: oneOf('all', 'agendados', 'nao_compareceu'), vista: oneOf('daily', 'week'), dia: { type: 'date' } },
  finance: { aba: oneOf('resumo', 'contas', 'recebiveis'), mes: { type: 'month' }, contas: oneOf('a_pagar', 'pagas', 'vencidas', 'todas') },
  catalog: { q, tipo: oneOf('all', 'servico', 'peca', 'kit') },
  suppliers: { q }
}
```

- [ ] **Step 5: `types.ts`**

Em `VoiceCommand`, trocar `date?: string` por:

```ts
  /** navigate: list controls declared in VOICE_VIEWS. */
  query?: Record<string, string>
```

Em `VOICE_EXAMPLES`, acrescentar ao fim da lista:

```ts
  'Mostra as OS abertas do João',
  'Contas vencidas do financeiro',
  'Manda o orçamento no WhatsApp (com a OS aberta)'
```

- [ ] **Step 6: `normalize.ts`**

Import: `import { VOICE_VIEWS } from './views.ts'`.

Junto das outras regex: `const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/`.

Depois de `function date(...)`:

```ts
function month(value: unknown): string | undefined {
  return typeof value === 'string' && MONTH_RE.test(value) ? value : undefined
}
```

Em `scalar`, trocar `case 'text': return str(value)` por:

```ts
    case 'text': {
      const s = str(value)
      return field.max ? s?.slice(0, field.max) : s
    }
    case 'month': return month(value)
```

Ramo `navigate` inteiro:

```ts
  if (raw.op === 'navigate') {
    const to = oneOf(raw.to, NAV_TARGETS)
    if (!to) return null
    const query = pick(VOICE_VIEWS[to] ?? {}, raw.query) as Record<string, string> | undefined
    return query ? { op: 'navigate', to, query } : { op: 'navigate', to }
  }
```

- [ ] **Step 7: `prompt.ts`**

Import: `import { VOICE_VIEWS } from './views.ts'`.

`TYPE_HINT`: acrescentar `month: 'YYYY-MM'`.

Em `buildVoiceMessages`, antes de `const system`:

```ts
  const views = Object.entries(VOICE_VIEWS).map(([to, spec]) => `- ${to}: ${describeFields(spec)}`).join('\n')
```

Trocar a linha do formato navigate por:

```
{"op":"navigate","to":"home"|"orders"|"scheduling"|"customers"|"vehicles"|"finance"|"team"|"catalog"|"suppliers"|"pricing"|"settings","query":{...}}
```

Depois do bloco `Outras entidades:\n${compact}` e antes de `Regras:`, inserir:

```
Filtros de lista (query do navigate):
${views}
```

(com uma linha em branco antes de `Regras:`). Nas regras, depois da linha que começa com `- create = cadastrar`, inserir:

```
- navigate = abrir uma tela. Para mostrar/buscar/filtrar uma lista ("mostra as OS abertas do João", "contas vencidas", "agenda da semana"), use navigate com query só com o que foi dito. Mês "YYYY-MM".
```

- [ ] **Step 8: `useVoiceCommand.ts`**

Ramo `navigate` de `run` inteiro:

```ts
    if (command.op === 'navigate') {
      const nav = NAV[command.to!]
      if (nav.permission && !can(nav.permission)) return forbidden()
      if (command.query && nav.path === here) {
        await navigateTo({ path: here, query: { ...currentRoute.value.query, ...command.query } }, { replace: true })
        toast.add({ title: 'Filtro aplicado por voz', color: 'info', icon: 'i-lucide-mic' })
        return { ok: true }
      }
      return go(command.query ? { path: nav.path, query: command.query, opened: true } : { path: nav.path }, here, isCancelled, false)
    }
```

Bloco de permissão (logo depois de `const entity = VOICE_CATALOG[entityKey]`) inteiro:

```ts
    const isAction = command.op === 'action'
    const permission = isAction
      ? entity.actions[command.action!]!.permission
      : entity.permission[command.op as 'create' | 'edit']
    if (!permission) {
      const screen = Object.values(NAV).find(nav => nav.path === SCREEN_PATH[entityKey])?.permission
      if (screen && !can(screen)) return forbidden()
      if (!isAction) return go({ path: SCREEN_PATH[entityKey], opened: true }, here, isCancelled, false)
    } else if (!can(permission)) {
      return forbidden()
    }
```

- [ ] **Step 9: Verificar**

Run: `pnpm test` → PASS (todos). Run: `npx nuxt typecheck` → sem erros.

- [ ] **Step 10: Commit**

```bash
git add layers/1.base/app/utils/voice layers/1.base/app/composables/useVoiceCommand.ts
git commit -m ":sparkles: feat(voice): navigate with list filters from a views catalog"
```

---

### Task 2: `useRouteQueryState` — controle de lista espelhado na URL

**Files:**
- Create: `layers/1.base/app/utils/route-query.ts`
- Create: `layers/1.base/app/composables/useRouteQueryState.ts`
- Test: `layers/1.base/app/utils/route-query.test.ts`

**Interfaces:**
- Produces: `useRouteQueryState<T extends string = string>(key: string, fallback: NoInfer<T>, check?: QueryCheck): Ref<T>` (auto-importado); `QueryCheck = readonly string[] | ((value: string) => boolean)`.

- [ ] **Step 1: Teste que falha** — `route-query.test.ts`

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { readQueryValue, withQueryValue } from './route-query.ts'

const isMonth = (value: string) => /^\d{4}-\d{2}$/.test(value)

test('readQueryValue falls back when missing, empty, repeated or not allowed', () => {
  assert.equal(readQueryValue(undefined, 'all'), 'all')
  assert.equal(readQueryValue('', 'all'), 'all')
  assert.equal(readQueryValue(['aberta'], 'all'), 'all')
  assert.equal(readQueryValue('aberta', 'all', ['all', 'aberta']), 'aberta')
  assert.equal(readQueryValue('perdida', 'all', ['all', 'aberta']), 'all')
  assert.equal(readQueryValue('2026-08', '2026-09', isMonth), '2026-08')
  assert.equal(readQueryValue('agosto', '2026-09', isMonth), '2026-09')
  assert.equal(readQueryValue('João ', ''), 'João ')
})

test('withQueryValue keeps other keys and omits the default or blank value', () => {
  assert.deepEqual(withQueryValue({ q: 'João' }, 'status', 'aberta', 'all'), { q: 'João', status: 'aberta' })
  assert.deepEqual(withQueryValue({ q: 'João', status: 'aberta' }, 'status', 'all', 'all'), { q: 'João' })
  assert.deepEqual(withQueryValue({ q: 'João', status: 'aberta' }, 'q', '  ', ''), { status: 'aberta' })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm test` → FAIL (módulo inexistente).

- [ ] **Step 3: `route-query.ts`**

```ts
export type RouteQuery = Record<string, string | null | (string | null)[] | undefined>
/** Allowed values, or a validator for open-ended ones (months). */
export type QueryCheck = readonly string[] | ((value: string) => boolean)

export function readQueryValue<T extends string>(raw: unknown, fallback: T, check?: QueryCheck): T {
  if (typeof raw !== 'string' || !raw) return fallback
  if (!check) return raw as T
  const ok = typeof check === 'function' ? check(raw) : check.includes(raw)
  return ok ? raw as T : fallback
}

export function withQueryValue(query: RouteQuery, key: string, value: string, fallback: string): RouteQuery {
  const { [key]: _omit, ...rest } = query
  return value.trim() && value !== fallback ? { ...rest, [key]: value } : rest
}
```

- [ ] **Step 4: `useRouteQueryState.ts`**

```ts
import type { Ref } from 'vue'
import { readQueryValue, withQueryValue, type QueryCheck } from '../utils/route-query'

/** A list control mirrored in the URL query, so links, back/forward and voice commands set it too. */
export function useRouteQueryState<T extends string = string>(key: string, fallback: NoInfer<T>, check?: QueryCheck): Ref<T> {
  const route = useRoute()
  const router = useRouter()
  const read = () => readQueryValue<T>(route.query[key], fallback, check)
  const state = ref(read()) as Ref<T>
  let writeTimer: ReturnType<typeof setTimeout> | undefined

  watch(() => route.query[key], () => {
    const next = read()
    if (next === state.value) return
    clearTimeout(writeTimer)
    state.value = next
  })

  // Debounced like the search box: an in-flight replace must not echo back over newer keystrokes.
  watch(state, (value) => {
    clearTimeout(writeTimer)
    writeTimer = setTimeout(() => {
      if (value !== read()) router.replace({ query: withQueryValue(route.query, key, value, fallback) })
    }, SEARCH_DEBOUNCE_MS)
  })

  onScopeDispose(() => clearTimeout(writeTimer))
  return state
}
```

- [ ] **Step 5: Verificar**

Run: `pnpm test` → PASS. Run: `npx nuxt typecheck` → sem erros.

- [ ] **Step 6: Commit**

```bash
git add layers/1.base/app/utils/route-query.ts layers/1.base/app/utils/route-query.test.ts layers/1.base/app/composables/useRouteQueryState.ts
git commit -m ":sparkles: feat(base): add useRouteQueryState to mirror list controls in the url"
```

---

### Task 3: OS, clientes e veículos lendo os controles da URL

**Files:**
- Modify: `layers/5.orders/app/composables/useOrdersList.ts`, `layers/5.orders/app/pages/orders.vue`
- Modify: `layers/4.customers/app/composables/useCustomersList.ts`, `layers/4.customers/app/pages/customers.vue`
- Modify: `layers/10.vehicles/app/composables/useVehiclesList.ts`

**Interfaces:**
- Consumes: `useRouteQueryState` (Task 2).
- Produces: `useOrdersList()` e `useCustomersList()` sem parâmetro.

- [ ] **Step 1: `useOrdersList.ts`**

Assinatura e início da função:

```ts
export async function useOrdersList() {
  const supabase = useTypedSupabaseClient()

  const statusFilter = useRouteQueryState<OrdemStatusFilter>('status', ORDEM_STATUS_FILTER_ALL, ORDEM_STATUS_FILTER_ITEMS.map(item => item.value))
  const q = useRouteQueryState('q', '')
  const debouncedQ = ref(q.value)
```

(substitui `const router = useRouter()`, `const statusFilter = ref<OrdemStatusFilter>(initialStatus)`, `const q = ref('')` e `const debouncedQ = ref('')`). Apagar o bloco `watch(statusFilter, (value) => { router.replace(...) })`.

- [ ] **Step 2: `orders.vue`**

Apagar `import type { OrdemStatus } ...`, `import { ORDEM_STATUS_FILTER_ALL } ...` e `const route = useRoute()`; a chamada vira `} = await useOrdersList()`.

- [ ] **Step 3: `useCustomersList.ts`**

```ts
export async function useCustomersList() {
  const supabase = useTypedSupabaseClient()

  const q = useRouteQueryState('q', '')
  const debouncedQ = ref(q.value)
  const statusFilter = useRouteQueryState<CustomerStatusFilter>('status', CUSTOMER_STATUS_FILTER_ACTIVE, CUSTOMER_STATUS_FILTER_ITEMS.map(item => item.value))
```

(substitui `initialStatus`, `router`, `q`, `debouncedQ` e `statusFilter` antigos). Apagar o bloco `watch(statusFilter, (value) => { router.replace(...) })`.

- [ ] **Step 4: `customers.vue`**

Apagar os dois imports de `../utils/customer-status` e `const route = useRoute()`; a chamada vira `} = await useCustomersList()`.

- [ ] **Step 5: `useVehiclesList.ts`**

```ts
  const q = useRouteQueryState('q', '')
  const debouncedQ = ref(q.value)
```

(substitui `const q = ref('')` e `const debouncedQ = ref('')`).

- [ ] **Step 6: Verificar**

Run: `npx nuxt typecheck` → sem erros. Run: `pnpm lint` → sem erros. Run: `pnpm test` → PASS.

- [ ] **Step 7: Commit**

```bash
git add layers/5.orders/app/composables/useOrdersList.ts layers/5.orders/app/pages/orders.vue layers/4.customers/app/composables/useCustomersList.ts layers/4.customers/app/pages/customers.vue layers/10.vehicles/app/composables/useVehiclesList.ts
git commit -m ":sparkles: feat(lists): keep orders, customers and vehicles filters in the url"
```

---

### Task 4: Catálogo, fornecedores e financeiro lendo os controles da URL

**Files:**
- Modify: `layers/6.configuration/app/composables/useCatalog.ts`, `layers/6.configuration/app/pages/catalog.vue`
- Modify: `layers/6.configuration/app/pages/catalog-suppliers.vue`
- Modify: `layers/8.management/app/composables/useFinanceWorkspace.ts`, `layers/8.management/app/composables/useFinanceReport.ts`

**Interfaces:**
- Consumes: `useRouteQueryState` (Task 2).
- Produces: `useCatalogList()` sem parâmetro; `useFinanceReport(selectedMonth: Ref<string> = ref(currentMonthValue()), options?)`.

- [ ] **Step 1: `useCatalog.ts` — `useCatalogList`**

```ts
export function useCatalogList() {
  const supabase = useTypedSupabaseClient()

  const q = useRouteQueryState('q', '')
  const debouncedQ = ref(q.value)
  const tipoFilter = useRouteQueryState<CatalogTipoFilter>('tipo', 'all', CATALOG_TIPO_FILTER_ITEMS.map(item => item.value))
```

(substitui parâmetro `initialTipo`, `router`, `route`, `q`, `debouncedQ`, `tipoFilter` antigos). Apagar o bloco `watch(tipoFilter, (value) => { ... router.replace(...) })`. Importar `CATALOG_TIPO_FILTER_ITEMS` de `'../utils/catalog'` (junto de `stockForTipo`).

- [ ] **Step 2: `catalog.vue`**

Apagar `const route = useRoute()` e o bloco `const initialTipo = ...`; a chamada vira `} = useCatalogList()`. Remover `type CatalogTipoFilter` do import se ficar sem uso.

- [ ] **Step 3: `catalog-suppliers.vue`**

Trocar `const supplierQ = ref('')` por `const supplierQ = useRouteQueryState('q', '')`.

- [ ] **Step 4: `useFinanceReport.ts`**

Assinatura e início:

```ts
export function useFinanceReport(selectedMonth: Ref<string> = ref(currentMonthValue()), options?: { enabled?: Ref<boolean> }) {
  const supabase = useTypedSupabaseClient()
  const enabled = options?.enabled ?? ref(true)
```

(apagar `const selectedMonth = ref(initialMonth)`; o resto usa `selectedMonth` como antes).

- [ ] **Step 5: `useFinanceWorkspace.ts`**

Import: acrescentar `ACCOUNTS_FILTER_ITEMS` ao import de `'../utils/accounts-payable'`. Acima de `export function useFinanceWorkspace`:

```ts
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/
```

Trocar `const tab = ref<FinanceTab>('resumo')` e `const accountsFilter = ref<AccountsFilter>('a_pagar')` por:

```ts
  const tab = useRouteQueryState<FinanceTab>('aba', 'resumo', FINANCE_TAB_ITEMS.map(item => item.value))
  const accountsFilter = useRouteQueryState<AccountsFilter>('contas', 'a_pagar', ACCOUNTS_FILTER_ITEMS.map(item => item.value))
  const month = useRouteQueryState('mes', currentMonthValue(), value => MONTH_RE.test(value))
```

E a chamada `useFinanceReport(currentMonthValue(), {` vira `useFinanceReport(month, {`.

- [ ] **Step 6: Verificar**

Run: `npx nuxt typecheck` → sem erros. Run: `pnpm lint` → sem erros. Run: `pnpm test` → PASS.

- [ ] **Step 7: Commit**

```bash
git add layers/6.configuration/app/composables/useCatalog.ts layers/6.configuration/app/pages/catalog.vue layers/6.configuration/app/pages/catalog-suppliers.vue layers/8.management/app/composables/useFinanceWorkspace.ts layers/8.management/app/composables/useFinanceReport.ts
git commit -m ":sparkles: feat(lists): keep catalog, suppliers and finance controls in the url"
```

---

### Task 5: Imprimir, baixar PDF e WhatsApp da OS por voz

**Files:**
- Modify: `layers/1.base/app/utils/voice/catalog.ts` (ações de `order`)
- Modify: `layers/5.orders/app/pages/orders-[id].vue` (`useVoiceForm('order', …)`)

**Interfaces:**
- Consumes: `VoiceAction.permission` opcional e o ramo de ação sem permissão em `useVoiceCommand` (Task 1).

- [ ] **Step 1: Ações no catálogo**

Em `VOICE_CATALOG.order.actions`, depois de `adicionarFoto: { kind: 'direct', permission: 'orders.edit' }` (acrescentar vírgula):

```ts
      imprimir: { kind: 'direct', hint: 'imprimir o orçamento' },
      baixarPdf: { kind: 'direct', hint: 'baixar o PDF do orçamento' },
      enviarWhatsApp: { kind: 'direct', hint: 'mandar o orçamento no WhatsApp do cliente' }
```

- [ ] **Step 2: `orders-[id].vue` — `unavailable`**

Primeiras linhas do corpo de `unavailable: (action, draft) => {`:

```ts
    if (['imprimir', 'baixarPdf', 'enviarWhatsApp'].includes(action) && !budgetItems.value?.length) return 'Adicione itens ao orçamento antes.'
    if (action === 'enviarWhatsApp' && !budgetWhatsappUrl.value) return 'Cliente sem telefone cadastrado.'
```

- [ ] **Step 3: `orders-[id].vue` — `actions`**

Depois de `usarSugestao: () => { ... },` dentro de `actions`:

```ts
    baixarPdf: () => onDownloadBudgetPdf(),
    // window.open outside a tap is blocked; the toast button supplies the gesture.
    imprimir: () => {
      useToast().add({
        title: 'Orçamento pronto para imprimir',
        color: 'info',
        icon: 'i-lucide-mic',
        duration: 15000,
        actions: [{ label: 'Imprimir', icon: 'i-lucide-printer', onClick: onPrintBudgetPdf }]
      })
    },
    enviarWhatsApp: () => {
      useToast().add({
        title: 'Orçamento pronto para o WhatsApp',
        color: 'info',
        icon: 'i-lucide-mic',
        duration: 15000,
        actions: [{ label: 'Abrir WhatsApp', icon: 'i-simple-icons-whatsapp', to: budgetWhatsappUrl.value!, target: '_blank' }]
      })
    }
```

- [ ] **Step 4: `ready` espera os itens do orçamento**

Trocar `ready: () => !!ordem.value` (no `useVoiceForm('order'` desta página) por:

```ts
  ready: () => !!ordem.value && !!budgetItems.value
```

- [ ] **Step 5: Verificar**

Run: `pnpm test` → PASS (catálogo aceita ação sem permissão). Run: `npx nuxt typecheck` → sem erros. Run: `pnpm lint` → sem erros.

- [ ] **Step 6: Commit**

```bash
git add layers/1.base/app/utils/voice/catalog.ts "layers/5.orders/app/pages/orders-[id].vue"
git commit -m ":sparkles: feat(orders): print, download and share the budget by voice"
```

---

## Fechamento

- [ ] `pnpm test`, `npx nuxt typecheck`, `pnpm lint`, `pnpm build` limpos.
- [ ] Revisão final do conjunto.
- [ ] `graphify update .` e commit separado de `graphify-out/` (`:wrench: chore: update graphify graph`).
