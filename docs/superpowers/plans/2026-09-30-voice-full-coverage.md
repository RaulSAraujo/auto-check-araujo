# Voz — Cobertura Total (Parte 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every field and action of every authenticated screen can be filled/triggered by voice, driven by one declarative catalog.

**Architecture:** A pure catalog (`utils/voice/catalog.ts`) describes each entity (fields, merge rules, target keys, actions, permissions). The AI prompt and the trust-boundary normalizer are generated from it. `useVoiceCommand` resolves target/refs into a generic `VoiceDraft` and navigates; each screen consumes drafts through one `useVoiceForm(entity, options)` call. Actions that write immediately go through a one-tap `BaseVoiceConfirm`.

**Tech Stack:** Nuxt 4 layers, Vue 3.5 `<script setup>`, Nuxt UI v4, Supabase, Nitro, `node:test` with TS type stripping.

**Spec:** `docs/superpowers/specs/2026-09-30-voice-full-coverage-design.md`

## Global Constraints

- Voice never saves a form and never deletes by itself. Forms: prefill → user clicks Salvar. Immediate-write actions: `BaseVoiceConfirm` → user taps Confirmar. Deletes: open the screen's existing delete dialog (`kind: 'direct'`), except finance accounts (no dialog exists) which use `BaseVoiceConfirm`.
- No password field in the catalog, ever. "Redefinir senha" only opens the existing dialog.
- The AI only receives the sentence, today's date and the current page. No DB data.
- Pure utils in `layers/1.base/app/utils/voice/`: erasable TypeScript only (no enums, no parameter properties, no namespaces), no Nuxt/Vue imports, relative imports **with `.ts` extension**, runnable by `node --test`. Type-only cross-layer imports use `import type` with a relative path.
- Composables/components/pages import voice utils with relative or `#layers/base/app/utils/voice/...` paths **without** extension (existing style).
- Code, identifiers, comments in English. UI copy in Portuguese. Commit messages: `:emoji: type(scope): description` in English, imperative, lowercase, no period (e.g. `:sparkles: feat(voice): add voice catalog`).
- Comments only for constraints the code can't show. Match surrounding style. Ponytail: minimum code, reuse existing helpers (`appendText`, `formatPhoneBr`, `formatDocumento`, `formatPlacaInput`, `normalizePlaca`, `formatPlaca`, `ilikePattern`, `digitsOnly`, `normalizeContactList` are auto-imported utils already used by the current handlers).
- Text merge: `merge: 'append'` only on long texts (`reclamacao`, `diagnostico`, `observacoes`, `problema`); other text fields replace; lists (`telefones`, `emails`) add without duplicates.
- Draft TTL 15 s, `ready`/`accept` semantics, modal-close cancellation, "clear draft if navigation fails", "edit without fields on the same record = Não entendi" — all kept from v2.
- After code changes: `graphify update .` (run from repo root). Run pnpm/graphify/nuxt with `required_permissions: ["all"]` if the sandbox blocks them.
- Verification commands: `pnpm test`, `npx nuxt typecheck`, `pnpm lint` (all must exit 0 at the end of Task 2 and every later task).
- Never commit `.env` or `.superpowers/`.

## File Map

| File | Status | Responsibility |
|---|---|---|
| `layers/1.base/app/utils/voice/types.ts` | rewrite | New command/draft/page types; `VOICE_EXAMPLES` |
| `layers/1.base/app/utils/voice/legacy-types.ts` | create | v1 parser intent types (moved from `types.ts`) |
| `layers/1.base/app/utils/voice/parser.ts` | modify (imports only) | v1 keyword parser, unchanged logic |
| `layers/1.base/app/utils/voice/catalog.ts` (+ test) | create | Entities, fields, actions, `voiceConfirmText` |
| `layers/1.base/app/utils/voice/normalize.ts` (+ test) | rewrite | Catalog-driven trust boundary |
| `layers/1.base/app/utils/voice/prompt.ts` (+ test) | rewrite | Catalog-driven prompt, `voicePageFromPath`, `VOICE_PAGES` |
| `layers/1.base/app/utils/voice/apply.ts` (+ test) | create | `applyVoiceFields`, `voiceBudgetItem` |
| `layers/1.base/app/utils/voice/legacy.ts` (+ test) | create | `legacyToCommand` (v1 parser → catalog command) |
| `server/api/voice/interpret.post.ts` | modify | Validate page with `VOICE_PAGES` |
| `layers/1.base/app/composables/useVoiceDraft.ts` | rewrite | Generic draft store + current-record registry |
| `layers/1.base/app/composables/useVoiceLookup.ts` | rewrite | Target/ref lookups returning `{ id, label }` |
| `layers/1.base/app/composables/useVoiceConfirm.ts` | create | Promise-based one-tap confirmation state |
| `layers/1.base/app/components/VoiceConfirm.vue` | create | `<BaseVoiceConfirm>` modal |
| `layers/1.base/app/layouts/default.vue` | modify | Mount `<BaseVoiceConfirm />` |
| `layers/1.base/app/composables/useVoiceForm.ts` | create | Screen binding: fields, items, actions |
| `layers/1.base/app/composables/useVoiceCommand.ts` | rewrite | Interpret → permission → target/refs → draft → navigate |
| 13 existing consumers | modify | `onVoiceDraft(intent…)` → `useVoiceForm(entity…)` |
| orders/customers/vehicles/scheduling/finance/catalog/suppliers/team/pricing screens | modify | New fields and actions (Tasks 3–5) |

Tasks 3, 4 and 5 touch disjoint files and may run in parallel after Task 2.

---

### Task 1: Pure voice core (catalog, types, normalize, prompt, apply, legacy)

A verified prototype of every file in this task exists in `.superpowers/sdd/proto/` (prompt ≤ 3.7k chars on every page; normalizer checked). Copy it as instructed; the code blocks below are the source of truth where they differ.

**Files:**
- Create: `layers/1.base/app/utils/voice/legacy-types.ts`, `catalog.ts`, `catalog.test.ts`, `apply.ts`, `apply.test.ts`, `legacy.ts`, `legacy.test.ts`
- Rewrite: `layers/1.base/app/utils/voice/types.ts`, `normalize.ts`, `normalize.test.ts`, `prompt.ts`, `prompt.test.ts`
- Modify: `layers/1.base/app/utils/voice/parser.ts:15` (imports), `server/api/voice/interpret.post.ts`

**Interfaces:**
- Produces (used by Tasks 2–5):
  - `types.ts`: `VoicePage`, `VoiceEntityKey`, `VoiceOp`, `VoiceValue`, `VoiceRecord`, `VoiceCommand`, `VoiceDraft`, `VoiceBudgetItemDraft`, `VoiceItemTipo`, `VoicePapel`, `VoiceOrderStatus`, `VoiceNavTarget`, `VoiceContext`, `VOICE_EXAMPLES`
  - `catalog.ts`: `VOICE_CATALOG: Record<VoiceEntityKey, VoiceEntity>`, `VoiceEntity`, `VoiceField`, `VoiceAction`, `VoiceRefKind`, `voiceConfirmText(template, values): string`, `FORMA_LABEL`, `PAPEL_LABEL`
  - `normalize.ts`: `normalizeVoiceCommand(raw: unknown): VoiceCommand | null`
  - `prompt.ts`: `buildVoiceMessages(text, context): VoiceChatMessage[]`, `voicePageFromPath(path): VoicePage`, `voiceEntitiesForPage(page): VoiceEntityKey[]`, `localDateInput(date): string`, `VOICE_PAGES: VoicePage[]`
  - `apply.ts`: `applyVoiceFields(state, fields, entity, { only?, format? }): string[]`, `voiceBudgetItem(item: VoiceRecord): VoiceBudgetItemDraft`
  - `legacy.ts`: `legacyToCommand(command: LegacyVoiceCommand | null): unknown`
- Consumes: `appendText`, `foldText` from `text.ts`; `parseVoiceCommand` from `parser.ts`.

**Expected state after this task:** `pnpm test` and `pnpm lint` pass. `npx nuxt typecheck` is expected to FAIL only in the files Task 2 rewrites (`useVoiceCommand.ts`, `useVoiceDraft.ts`, `useVoiceLookup.ts`, `useOrderBudgetPage.ts`, and the 13 page consumers listed in Task 2) because they still use v2 intent types. Report the error list; do not patch those files here.

- [ ] **Step 1: Move v1 types for the parser**

Create `layers/1.base/app/utils/voice/legacy-types.ts` by moving from the current `types.ts` exactly these declarations, renamed: `VoiceIntent` → `LegacyVoiceIntent` (only the 9 `*.create` members: `customer.create`, `vehicle.create`, `order.create`, `appointment.create`, `budgetItem.create`, `account.create`, `catalogItem.create`, `supplier.create`, `collaborator.create`), the payload interfaces `VoiceCustomerPayload`, `VoiceVehiclePayload`, `VoiceOrderPayload`, `VoiceAppointmentPayload`, `VoiceBudgetItemPayload`, `VoiceAccountPayload`, `VoiceCatalogItemPayload`, `VoiceSupplierPayload`, `VoiceCollaboratorPayload` (unchanged bodies), and:

```ts
import type { VoiceItemTipo, VoicePapel } from './types.ts'

export interface LegacyVoicePayloadMap {
  'customer.create': VoiceCustomerPayload
  'vehicle.create': VoiceVehiclePayload
  'order.create': VoiceOrderPayload
  'appointment.create': VoiceAppointmentPayload
  'budgetItem.create': VoiceBudgetItemPayload
  'account.create': VoiceAccountPayload
  'catalogItem.create': VoiceCatalogItemPayload
  'supplier.create': VoiceSupplierPayload
  'collaborator.create': VoiceCollaboratorPayload
}

export type LegacyVoiceCommand = {
  [K in LegacyVoiceIntent]: { intent: K, payload: LegacyVoicePayloadMap[K] }
}[LegacyVoiceIntent]
```

In `parser.ts:15` replace the import with:

```ts
import type { VoiceItemTipo, VoicePapel } from './types.ts'
import type { LegacyVoiceCommand as VoiceCommand, LegacyVoiceIntent as VoiceIntent } from './legacy-types.ts'
```

If `parser.test.ts` imports types from `types.ts`, point them to `legacy-types.ts` the same way.

- [ ] **Step 2: Rewrite `types.ts`**

Replace the whole file with the content of `.superpowers/sdd/proto/types.ts` (defines `VoiceItemTipo`, `VoicePapel`, `VoiceOrderStatus`, `VoicePage` with 13 pages, `VoiceNavTarget`, `VoiceContext`, `VoiceEntityKey`, `VoiceOp`, `VoiceValue`, `VoiceRecord`, `VoiceCommand`, `VoiceBudgetItemDraft`, `VoiceDraft`, `VOICE_EXAMPLES`). Key shapes:

```ts
export interface VoiceCommand {
  op: VoiceOp
  entity?: VoiceEntityKey
  target?: Record<string, string>
  fields?: VoiceRecord
  items?: VoiceRecord[]
  action?: string
  args?: VoiceRecord
  to?: VoiceNavTarget
  date?: string
}

export interface VoiceDraft {
  entity: VoiceEntityKey
  op: 'create' | 'edit' | 'action'
  id?: string
  label?: string
  fields: VoiceRecord
  items?: VoiceRecord[]
  action?: string
  args?: VoiceRecord
  inicio?: string
}
```

- [ ] **Step 3: Write the failing catalog test**

Create `layers/1.base/app/utils/voice/catalog.test.ts`:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { VOICE_CATALOG, voiceConfirmText } from './catalog.ts'

const PERMISSIONS = [
  'customers.write', 'customers.delete', 'vehicles.write', 'vehicles.delete', 'orders.create', 'orders.edit',
  'budget.edit', 'budget.approve', 'finance.view', 'catalog.manage', 'scheduling.write', 'collaborators.manage'
]

test('every entity has pages, valid permissions and confirm texts', () => {
  for (const [key, entity] of Object.entries(VOICE_CATALOG)) {
    assert.ok(entity.pages.length, `${key}: pages`)
    for (const permission of Object.values(entity.permission)) assert.ok(PERMISSIONS.includes(permission!), `${key}: ${permission}`)
    for (const [name, action] of Object.entries(entity.actions)) {
      assert.ok(PERMISSIONS.includes(action.permission), `${key}.${name}: permission`)
      if (action.kind === 'confirm') assert.ok(action.confirm, `${key}.${name}: confirm text`)
    }
  }
})

test('no password-like key in fields, items, targets or args', () => {
  for (const [key, entity] of Object.entries(VOICE_CATALOG)) {
    const specs = [entity.fields, entity.items ?? {}, entity.target, ...Object.values(entity.actions).map(a => a.args ?? {})]
    for (const spec of specs) {
      for (const field of Object.keys(spec)) assert.doesNotMatch(field, /senha|password/i, `${key}.${field}`)
    }
  }
})

test('ref fields map to a state key', () => {
  for (const entity of Object.values(VOICE_CATALOG)) {
    for (const spec of [entity.fields, entity.items ?? {}]) {
      for (const [name, field] of Object.entries(spec)) {
        if (field.ref && field.ref !== 'catalogItem') assert.ok(field.stateKey, name)
      }
    }
  }
})

test('voiceConfirmText fills label and args with Portuguese labels', () => {
  assert.equal(voiceConfirmText('Marcar a conta {label} como paga ({forma})?', { label: 'Energia', forma: 'pix' }), 'Marcar a conta Energia como paga (Pix)?')
  assert.equal(voiceConfirmText('Mudar o papel de {label} para {papel}?', { label: 'Pedro', papel: 'mecanico' }), 'Mudar o papel de Pedro para mecânico?')
  assert.equal(voiceConfirmText('Remover "{descricao}"?', {}), 'Remover "…"?')
})
```

- [ ] **Step 4: Run it to see it fail**

Run: `node --test layers/1.base/app/utils/voice/catalog.test.ts`
Expected: FAIL — cannot find module `./catalog.ts`.

- [ ] **Step 5: Create `catalog.ts`**

Copy `.superpowers/sdd/proto/catalog.ts` to `layers/1.base/app/utils/voice/catalog.ts` unchanged. Its first line `import type { PermissionAction } from '../../../../2.auth/app/utils/permissions.ts'` resolves to `layers/2.auth/app/utils/permissions.ts` from the final location (type-only, erased at runtime). Entities: `order`, `customer`, `vehicle`, `appointment`, `account`, `category`, `catalogItem`, `supplier`, `collaborator`, `pricing` — exactly as in the spec table, with these deliberate details:
- `category`: `permission { create, edit: 'finance.view' }`, `fields: { nome }`, actions `ativar`, `desativar` (create/rename are confirmed by the finance screen).
- `collaborator`: `permission { create, edit: 'collaborators.manage' }`; edit only changes `papel`.
- `account`: only `permission.create` (no voice edit form; edit opens the finance screen).
- `pricing`: empty `target`, only `permission.edit`.

- [ ] **Step 6: Run the catalog test**

Run: `node --test layers/1.base/app/utils/voice/catalog.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 7: Write the failing normalize test**

Replace `layers/1.base/app/utils/voice/normalize.test.ts` with:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeVoiceCommand as n } from './normalize.ts'

test('rejects non-objects, unknown ops and entities', () => {
  assert.equal(n(null), null)
  assert.equal(n('x'), null)
  assert.equal(n({ op: null }), null)
  assert.equal(n({ op: 'create', entity: 'boleto' }), null)
  assert.equal(n({ op: 'create', entity: '__proto__' }), null)
})

test('order edit keeps valid fields, target and items; drops unknown, password and create-only fields', () => {
  assert.deepEqual(n({
    op: 'edit',
    entity: 'order',
    target: { placa: 'abc-1d23', foo: 'x' },
    fields: { forma_pagamento: 'pix', parcelas: '3', senha: '1234', veiculo: 'ABC1D23', valor_cobrado: '1.500,5', status: 'voando' },
    items: [{ tipo: 'peca', descricao: 'Pastilha', quantidade: 2, valor_unitario: 150 }, { tipo: 'peca' }, 'x']
  }), {
    op: 'edit',
    entity: 'order',
    target: { placa: 'ABC1D23' },
    fields: { forma_pagamento: 'pix', parcelas: 3, valor_cobrado: 1500.5 },
    items: [{ tipo: 'peca', descricao: 'Pastilha', quantidade: 2, valor_unitario: 150 }]
  })
})

test('create ignores target and edit-only fields', () => {
  assert.deepEqual(n({ op: 'create', entity: 'order', target: { placa: 'ABC1D23' }, fields: { veiculo: 'abc1d23', status: 'aberta', reclamacao: ' barulho ' } }),
    { op: 'create', entity: 'order', fields: { veiculo: 'ABC1D23', reclamacao: 'barulho' } })
})

test('number limits and types', () => {
  assert.deepEqual(n({ op: 'edit', entity: 'order', fields: { parcelas: 13, km_entrada: -1, pago: 'true' } }),
    { op: 'edit', entity: 'order', fields: { pago: true } })
  assert.deepEqual(n({ op: 'edit', entity: 'pricing', fields: { valor_hora: '120', precificacao_automatica: false, margem_alvo: 'muito' } }),
    { op: 'edit', entity: 'pricing', fields: { valor_hora: 120, precificacao_automatica: false } })
})

test('lists keep valid items only, capped at 10', () => {
  const phones = Array.from({ length: 12 }, (_, i) => `11 9888${String(i).padStart(2, '0')}-7777`)
  const result = n({ op: 'create', entity: 'customer', fields: { telefones: phones, emails: ['A@B.COM', 'nope'] } })
  assert.equal((result?.fields?.telefones as string[]).length, 10)
  assert.equal((result?.fields?.telefones as string[])[0], '119888007777')
  assert.deepEqual(result?.fields?.emails, ['a@b.com'])
})

test('actions need a known name; args validated', () => {
  assert.deepEqual(n({ op: 'action', entity: 'account', target: { descricao: 'energia' }, action: 'pagar', args: { forma: 'pix', x: 1 } }),
    { op: 'action', entity: 'account', target: { descricao: 'energia' }, action: 'pagar', args: { forma: 'pix' } })
  assert.equal(n({ op: 'action', entity: 'account', action: 'voar' }), null)
  assert.equal(n({ op: 'action', entity: 'account', action: '__proto__' }), null)
  assert.deepEqual(n({ op: 'action', entity: 'order', action: 'aprovar', args: { forma: 'pix' } }), { op: 'action', entity: 'order', action: 'aprovar' })
})

test('edit with nothing valid is a plain open', () => {
  assert.deepEqual(n({ op: 'edit', entity: 'customer', target: { nome: 'João' }, fields: { senha: 'x' } }),
    { op: 'edit', entity: 'customer', target: { nome: 'João' } })
})

test('navigate keeps date only for the agenda', () => {
  assert.deepEqual(n({ op: 'navigate', to: 'scheduling', date: '2026-10-02' }), { op: 'navigate', to: 'scheduling', date: '2026-10-02' })
  assert.deepEqual(n({ op: 'navigate', to: 'finance', date: '2026-10-02' }), { op: 'navigate', to: 'finance' })
  assert.deepEqual(n({ op: 'navigate', to: 'scheduling', date: '2026-02-30' }), { op: 'navigate', to: 'scheduling' })
  assert.equal(n({ op: 'navigate', to: 'moon' }), null)
})

test('kit items need a non-enum value', () => {
  assert.deepEqual(n({ op: 'create', entity: 'catalogItem', fields: { tipo: 'kit', nome: 'Revisão' }, items: [{ item: 'Filtro de óleo', quantidade: 1 }, { quantidade: 0 }] }),
    { op: 'create', entity: 'catalogItem', fields: { tipo: 'kit', nome: 'Revisão' }, items: [{ item: 'Filtro de óleo', quantidade: 1 }] })
})
```

- [ ] **Step 8: Run it to see it fail**

Run: `node --test layers/1.base/app/utils/voice/normalize.test.ts`
Expected: FAIL (old normalizer returns `{ intent, payload }` / null).

- [ ] **Step 9: Rewrite `normalize.ts`**

Replace the file with the content of `.superpowers/sdd/proto/normalize.ts` (helpers `str`, `num`, `digits`, `placa`, `date`, `time`, `email`, `oneOf` are the v2 ones; adds `bool`, `scalar`, `fieldValue`, `pick`; limits `MAX_LIST = 10`, `MAX_ITEMS = 20`; strings ≤ 1000). Behavior:
- `navigate`: `to` whitelisted; `date` kept only for `scheduling` and only if a real date.
- `create|edit|action` + `entity` whitelisted with `Object.hasOwn(VOICE_CATALOG, …)`.
- `target` ignored on `create`.
- `action` must be `Object.hasOwn(entity.actions, name)`; args picked from `action.args`.
- `fields` respect `field.ops`; items kept only if they have a non-enum value.

- [ ] **Step 10: Run the normalize test**

Run: `node --test layers/1.base/app/utils/voice/normalize.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 11: Write the failing prompt test**

Replace `layers/1.base/app/utils/voice/prompt.test.ts` with:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { buildVoiceMessages, localDateInput, VOICE_PAGES, voiceEntitiesForPage, voicePageFromPath } from './prompt.ts'

test('voicePageFromPath maps every screen', () => {
  assert.equal(voicePageFromPath('/ordens/novo'), 'order-new')
  assert.equal(voicePageFromPath('/ordens/abc'), 'order-detail')
  assert.equal(voicePageFromPath('/ordens/abc/impressao'), 'other')
  assert.equal(voicePageFromPath('/clientes/novo'), 'customer-new')
  assert.equal(voicePageFromPath('/clientes/abc'), 'customer-detail')
  assert.equal(voicePageFromPath('/veiculos/novo'), 'vehicle-new')
  assert.equal(voicePageFromPath('/veiculos/abc'), 'vehicle-detail')
  assert.equal(voicePageFromPath('/agendamentos'), 'scheduling')
  assert.equal(voicePageFromPath('/gestao/financeiro'), 'finance')
  assert.equal(voicePageFromPath('/configuracao/catalogo'), 'catalog')
  assert.equal(voicePageFromPath('/configuracao/fornecedores'), 'suppliers')
  assert.equal(voicePageFromPath('/gestao/equipe'), 'team')
  assert.equal(voicePageFromPath('/configuracao/precificacao'), 'pricing')
  assert.equal(voicePageFromPath('/'), 'other')
})

test('every entity belongs to a page', () => {
  assert.deepEqual(voiceEntitiesForPage('finance'), ['account', 'category'])
  assert.deepEqual(voiceEntitiesForPage('other'), [])
})

test('prompt has date, page, text, detailed current entity and compact others', () => {
  const [system, user] = buildVoiceMessages('paga no pix', { page: 'order-detail', today: '2026-09-30' })
  assert.equal(user?.content, 'paga no pix')
  assert.match(system!.content, /2026-09-30 \(quarta-feira\)/)
  assert.match(system!.content, /Tela atual: OS aberta/)
  assert.match(system!.content, /forma_pagamento \(dinheiro\|pix\|cartao_credito\|cartao_debito\)/)
  assert.match(system!.content, /- account \(conta a pagar\); target \{descricao\}; fields: descricao, valor/)
  assert.match(system!.content, /Nunca inclua senha/)
})

test('prompt stays under the token budget on every page', () => {
  for (const page of VOICE_PAGES) {
    const [system] = buildVoiceMessages('x', { page, today: '2026-09-30' })
    assert.ok(system!.content.length <= 6000, `${page}: ${system!.content.length}`)
  }
})

test('localDateInput', () => {
  assert.equal(localDateInput(new Date(2026, 0, 5)), '2026-01-05')
})
```

- [ ] **Step 12: Run it to see it fail**

Run: `node --test layers/1.base/app/utils/voice/prompt.test.ts`
Expected: FAIL (`VOICE_PAGES`/`voiceEntitiesForPage` not exported).

- [ ] **Step 13: Rewrite `prompt.ts`**

Replace the file with the content of `.superpowers/sdd/proto/prompt.ts` (exports `VoiceChatMessage`, `VOICE_PAGES`, `voicePageFromPath`, `voiceEntitiesForPage`, `localDateInput`, `buildVoiceMessages`). The system prompt lists the 4 JSON shapes (`create|edit`, `action`, `navigate`, `{"op":null}`), today + weekday, current page label, detailed entities of the current page, compact line per other entity, and the rules (create/edit/action meaning, omit target for the record on screen, only listed names, never password, one object per item, dates/times/plate/money/percent, short Portuguese texts).

- [ ] **Step 14: Run the prompt test**

Run: `node --test layers/1.base/app/utils/voice/prompt.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 15: Write the failing apply test**

Create `layers/1.base/app/utils/voice/apply.test.ts`:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { applyVoiceFields, voiceBudgetItem } from './apply.ts'
import { VOICE_CATALOG } from './catalog.ts'

test('append, replace and ref stateKey', () => {
  const state: Record<string, unknown> = { reclamacao: 'Barulho', km_entrada: 10, veiculo_id: '' }
  const written = applyVoiceFields(state, { reclamacao: 'freio', km_entrada: 45000, veiculo: 'v1' }, VOICE_CATALOG.order)
  assert.deepEqual(state, { reclamacao: 'Barulho. freio', km_entrada: 45000, veiculo_id: 'v1' })
  assert.deepEqual(written, ['reclamacao', 'km_entrada', 'veiculo_id'])
})

test('lists add without duplicates (compared before formatting), ignoring blanks', () => {
  const state: Record<string, unknown> = { telefones: ['(11) 98888-7777', ''], emails: [] }
  applyVoiceFields(state, { telefones: ['11988887777', '11977776666', '11977776666'], emails: ['a@b.com'] }, VOICE_CATALOG.customer, {
    format: { telefones: v => `fmt:${String(v)}` }
  })
  assert.deepEqual(state.telefones, ['(11) 98888-7777', 'fmt:11977776666'])
  assert.deepEqual(state.emails, ['a@b.com'])
})

test('only restricts fields; unknown fields are ignored', () => {
  const state: Record<string, unknown> = {}
  applyVoiceFields(state, { pago: true, reclamacao: 'x', nope: 1 }, VOICE_CATALOG.order, { only: ['pago'] })
  assert.deepEqual(state, { pago: true })
})

test('text fields without append replace', () => {
  const state: Record<string, unknown> = { nome: 'João' }
  applyVoiceFields(state, { nome: 'João da Silva' }, VOICE_CATALOG.customer)
  assert.equal(state.nome, 'João da Silva')
})

test('voiceBudgetItem defaults tipo and copies known values', () => {
  assert.deepEqual(voiceBudgetItem({ descricao: 'Mão de obra', valor_unitario: 80, catalogItemId: 'c1' }),
    { tipo: 'servico', descricao: 'Mão de obra', valor_unitario: 80, catalogItemId: 'c1' })
})
```

- [ ] **Step 16: Run it to see it fail, then create `apply.ts`**

Run: `node --test layers/1.base/app/utils/voice/apply.test.ts` → FAIL (module missing).
Copy `.superpowers/sdd/proto/apply.ts` to `layers/1.base/app/utils/voice/apply.ts` (imports are already `./catalog.ts`, `./text.ts`, `./types.ts`).
Run again → PASS (5 tests).

- [ ] **Step 17: Write the failing legacy test**

Create `layers/1.base/app/utils/voice/legacy.test.ts`:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { legacyToCommand } from './legacy.ts'
import { normalizeVoiceCommand } from './normalize.ts'
import { parseVoiceCommand } from './parser.ts'

const run = (text: string) => normalizeVoiceCommand(legacyToCommand(parseVoiceCommand(text, new Date(2026, 8, 30))))

test('v1 phrases become catalog commands', () => {
  assert.deepEqual(run('novo cliente João da Silva'), { op: 'create', entity: 'customer', fields: { nome: 'João da Silva' } })
  assert.equal(run('nova OS placa ABC1D23')?.fields?.veiculo, 'ABC1D23')
  assert.equal(run('nova OS placa ABC1D23')?.entity, 'order')
  assert.deepEqual(run('adicionar serviço troca de óleo')?.items, [{ tipo: 'servico', descricao: 'troca de óleo' }])
  assert.equal(run('adicionar serviço troca de óleo')?.op, 'edit')
  assert.equal(run('novo fornecedor Auto Peças')?.entity, 'supplier')
  assert.equal(run('bom dia'), null)
})

test('legacyToCommand maps renamed fields', () => {
  assert.deepEqual(legacyToCommand({ intent: 'vehicle.create', payload: { placa: 'ABC1D23', clienteNome: 'João' } }),
    { op: 'create', entity: 'vehicle', fields: { placa: 'ABC1D23', dono: 'João' } })
  assert.deepEqual(legacyToCommand({ intent: 'account.create', payload: { descricao: 'Luz', categoriaNome: 'Contas', fornecedorNome: 'Enel' } }),
    { op: 'create', entity: 'account', fields: { descricao: 'Luz', categoria: 'Contas', fornecedor: 'Enel' } })
  assert.equal(legacyToCommand(null), null)
})
```

Before running, open `parser.test.ts` and confirm the exact v1 phrasings accepted for customer, order, budget item and supplier; if the parser's output differs (e.g. descricao casing), adjust only the expected values here to what `parseVoiceCommand` returns today.

- [ ] **Step 18: Run it to see it fail, then create `legacy.ts`**

Run: `node --test layers/1.base/app/utils/voice/legacy.test.ts` → FAIL.
Copy `.superpowers/sdd/proto/legacy.ts` to `layers/1.base/app/utils/voice/legacy.ts` (imports `LegacyVoiceCommand` from `./legacy-types.ts`; the proto's `legacy-types.ts` is a stub — use the Step 1 file).
Run again → PASS.

- [ ] **Step 19: Server route validates pages from `VOICE_PAGES`**

In `server/api/voice/interpret.post.ts` replace the local `PAGES` constant and import:

```ts
import { buildVoiceMessages, VOICE_PAGES } from '~~/layers/1.base/app/utils/voice/prompt'
```

and use `VOICE_PAGES.includes(rawPage as VoicePage)` where `PAGES.includes(...)` was. Nothing else changes (auth, limits, providers, `{ command: normalizeVoiceCommand(raw) }`).

- [ ] **Step 20: Run all tests and lint**

Run: `pnpm test && pnpm lint`
Expected: both exit 0 (all voice tests + existing parser/text/providers tests).
Run: `npx nuxt typecheck` — expected failures only in the Task 2 files listed above; paste the list in the report.

- [ ] **Step 21: Commit**

```bash
git add layers/1.base/app/utils/voice server/api/voice/interpret.post.ts
git commit -m ":sparkles: feat(voice): add catalog-driven command core"
```

---

### Task 2: Runtime (draft, lookup, confirm, form binding, command) + migrate current consumers

**Files:**
- Rewrite: `layers/1.base/app/composables/useVoiceDraft.ts`, `useVoiceLookup.ts`, `useVoiceCommand.ts`
- Create: `layers/1.base/app/composables/useVoiceConfirm.ts`, `useVoiceForm.ts`, `layers/1.base/app/components/VoiceConfirm.vue`
- Modify: `layers/1.base/app/layouts/default.vue`, `layers/1.base/app/components/VoiceCommandButton.vue` (only if types break), `layers/5.orders/app/composables/useOrderBudgetPage.ts`, and the 13 consumers: `customers-new.vue:34`, `customers-[id].vue:61`, `vehicles-new.vue:37`, `vehicles-[id].vue:54`, `orders-new.vue:75`, `orders-[id].vue:83`, `useOrderBudgetPage.ts:127`, `scheduling.vue:90,127,135`, `finance.vue:78`, `catalog.vue:98`, `catalog-suppliers.vue:93`, `team.vue:41`

**Interfaces:**
- Consumes: everything Task 1 produces.
- Produces (Tasks 3–5 rely on these exact names):
  - `useVoiceDraft(): { setVoiceDraft(draft: VoiceDraft), clearVoiceDraft(), onVoiceDraft(handles, handler, { ready? }), current: Ref<Partial<Record<VoiceEntityKey, VoiceCurrent>>> }`, `VoiceCurrent = { id: string, label?: string }`
  - `useVoiceConfirm(): { request, confirmVoice(req: { title: string, description?: string, confirmLabel?: string }): Promise<boolean>, settle(ok: boolean) }`
  - `useVoiceForm(entity: VoiceEntityKey, options: VoiceFormOptions): void` and exported types `VoiceFormOptions`, `VoiceActionResult = void | { unavailable?: string, message?: string }`
  - `useVoiceLookup(): { findVehicle, findNamed, findOrder, findAppointment, findAccount, findCollaborator }` returning `VoiceFound = { id: string, label: string, inicio?: string }`
  - `useVoiceCommand(): { run(text, isCancelled?): Promise<VoiceRunResult> }`, `VoiceRunResult = { ok: true } | { ok: false, reason: 'not_understood' | 'forbidden' | 'context' | 'cancelled' }`
  - `useOrderBudgetPage` returns also `fillVoiceItem(voice: VoiceBudgetItemDraft): Promise<boolean>` and `addVoiceItems(voice: VoiceBudgetItemDraft[]): Promise<void>` (used in Task 3).

Behavior after this task must equal v2 for all 13 existing flows (same fields, same toasts), now through the catalog.

- [ ] **Step 1: Rewrite `useVoiceDraft.ts`**

```ts
import type { VoiceDraft, VoiceEntityKey } from '../utils/voice/types'

type PendingVoiceDraft = { draft: VoiceDraft, createdAt: number }
export interface VoiceCurrent { id: string, label?: string }

const DRAFT_TTL_MS = 15_000

export function useVoiceDraft() {
  const pending = useState<PendingVoiceDraft | null>('voice-draft', () => null)
  /** Record open on screen per entity (detail page or edit slideover), used when a command has no target. */
  const current = useState<Partial<Record<VoiceEntityKey, VoiceCurrent>>>('voice-current', () => ({}))

  function setVoiceDraft(draft: VoiceDraft) {
    pending.value = { draft, createdAt: Date.now() }
  }

  function clearVoiceDraft() {
    pending.value = null
  }

  /** `handles` lets several registrations share an entity (e.g. the order page and its photos section). */
  function onVoiceDraft(
    handles: (draft: VoiceDraft) => boolean,
    handler: (draft: VoiceDraft) => void,
    options?: { ready?: () => boolean }
  ) {
    watch([pending, () => options?.ready?.() ?? true], ([value, ready]) => {
      if (!value) return
      if (Date.now() - value.createdAt > DRAFT_TTL_MS) {
        pending.value = null
        return
      }
      if (!handles(value.draft)) return
      // Lazy queries: wait for the record so form-sync watchers (registered earlier) run first.
      if (!ready) return
      pending.value = null
      handler(value.draft)
    }, { immediate: true })
  }

  return { setVoiceDraft, clearVoiceDraft, onVoiceDraft, current }
}
```

- [ ] **Step 2: Create `useVoiceConfirm.ts` and `VoiceConfirm.vue`, mount it**

`layers/1.base/app/composables/useVoiceConfirm.ts`:

```ts
export interface VoiceConfirmRequest {
  title: string
  description?: string
  confirmLabel?: string
}

// ponytail: one pending confirmation at a time; a new request resolves the previous one as cancelled.
let resolver: ((ok: boolean) => void) | null = null

export function useVoiceConfirm() {
  const request = useState<VoiceConfirmRequest | null>('voice-confirm', () => null)

  function confirmVoice(next: VoiceConfirmRequest): Promise<boolean> {
    resolver?.(false)
    request.value = next
    return new Promise((resolve) => {
      resolver = resolve
    })
  }

  function settle(ok: boolean) {
    const resolve = resolver
    resolver = null
    request.value = null
    resolve?.(ok)
  }

  return { request, confirmVoice, settle }
}
```

`layers/1.base/app/components/VoiceConfirm.vue`:

```vue
<script setup lang="ts">
defineOptions({ name: 'BaseVoiceConfirm' })

const { request, settle } = useVoiceConfirm()

const open = computed({
  get: () => !!request.value,
  set: (value: boolean) => {
    if (!value) settle(false)
  }
})
</script>

<template>
  <UModal
    v-model:open="open"
    :title="request?.title ?? ''"
    description="Comando de voz"
  >
    <template
      v-if="request?.description"
      #body
    >
      <p class="whitespace-pre-line text-sm text-muted">
        {{ request.description }}
      </p>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          label="Cancelar"
          color="neutral"
          variant="ghost"
          @click="settle(false)"
        />
        <UButton
          :label="request?.confirmLabel ?? 'Confirmar'"
          icon="i-lucide-check"
          autofocus
          @click="settle(true)"
        />
      </div>
    </template>
  </UModal>
</template>
```

In `layers/1.base/app/layouts/default.vue`, add `<BaseVoiceConfirm />` right after `<BaseAppHeader />`.

- [ ] **Step 3: Rewrite `useVoiceLookup.ts`**

Keep the current bodies of `findOrderId`'s numero/placa/cliente branches, `findVehicleIdByPlaca` and `findNextAppointment` where the code below matches them; the changes are the `{ id, label }` return shape, `includeInactive`, `noShow`, `findAccount` and `findCollaborator`.

```ts
import { foldText } from '../utils/voice/text'

export interface VoiceFound { id: string, label: string, inicio?: string }
type NamedKind = 'customer' | 'supplier' | 'category' | 'catalogItem'

const NAMED_TABLE = {
  customer: 'clientes',
  supplier: 'fornecedores',
  category: 'financeiro_categorias',
  catalogItem: 'servicos_catalogo'
} as const

function pickByName<T extends { id: string }>(rows: T[], name: string, labelOf: (row: T) => string): T | undefined {
  const target = foldText(name.trim())
  return rows.find(row => foldText(labelOf(row)) === target) ?? (rows.length === 1 ? rows[0] : undefined)
}

function dayMonth(isoDate: string): string {
  const [, m, d] = isoDate.split('-')
  return `${d}/${m}`
}

export function useVoiceLookup() {
  const supabase = useTypedSupabaseClient()

  async function findVehicle(placa: string): Promise<VoiceFound | undefined> {
    const { data, error } = await supabase.from('veiculos').select('id, placa').eq('placa', normalizePlaca(placa)).maybeSingle()
    return error || !data ? undefined : { id: data.id, label: formatPlaca(data.placa) }
  }

  async function findNamed(kind: NamedKind, name: string, options: { includeInactive?: boolean, tipo?: string } = {}): Promise<VoiceFound | undefined> {
    const pattern = ilikePattern(name)
    if (!pattern) return undefined
    let query = supabase.from(NAMED_TABLE[kind]).select('id, nome').ilike('nome', pattern)
    if (!options.includeInactive) query = query.eq('ativo', true)
    if (options.tipo) query = query.filter('tipo', 'eq', options.tipo)
    const { data, error } = await query.limit(5)
    if (error || !data) return undefined
    const row = pickByName(data, name, r => r.nome)
    return row && { id: row.id, label: row.nome }
  }

  async function findOrder(target: { placa?: string, numero?: string, clienteNome?: string }): Promise<VoiceFound | undefined> {
    if (target.numero) {
      const withYear = target.numero.match(/^(20\d{2})(\d{4,})$/)
      const query = supabase.from('ordens_servico').select('id, numero')
      const { data, error } = await (withYear
        ? query.eq('numero', `OS-${withYear[1]}-${withYear[2]}`)
        : query.like('numero', `OS-%-${target.numero.padStart(4, '0')}`))
        .order('aberta_em', { ascending: false })
        .limit(1)
      const row = error ? undefined : data?.[0]
      return row && { id: row.id, label: row.numero }
    }

    let vehicleIds: string[] = []
    if (target.placa) {
      const vehicle = await findVehicle(target.placa)
      if (vehicle) vehicleIds = [vehicle.id]
    } else if (target.clienteNome) {
      const customer = await findNamed('customer', target.clienteNome)
      if (customer) {
        const { data } = await supabase.from('veiculos').select('id').eq('cliente_id', customer.id)
        vehicleIds = (data ?? []).map(row => row.id)
      }
    }
    if (!vehicleIds.length) return undefined

    const { data, error } = await supabase
      .from('ordens_servico')
      .select('id, numero')
      .in('veiculo_id', vehicleIds)
      .in('status', ['aberta', 'em_andamento'])
      .order('aberta_em', { ascending: false })
      .limit(1)
    const row = error ? undefined : data?.[0]
    return row && { id: row.id, label: row.numero }
  }

  /** Next scheduled appointment of the vehicle, or its latest no-show when undoing one. */
  async function findAppointment(veiculoId: string, options: { noShow?: boolean } = {}): Promise<{ id: string, inicio: string } | undefined> {
    let query = supabase.from('agendamentos').select('id, inicio').eq('veiculo_id', veiculoId)
    if (options.noShow) {
      query = query.eq('status', 'nao_compareceu').order('inicio', { ascending: false })
    } else {
      const startOfToday = new Date()
      startOfToday.setHours(0, 0, 0, 0)
      query = query.in('status', ['agendado', 'confirmado']).gte('inicio', startOfToday.toISOString()).order('inicio', { ascending: true })
    }
    const { data, error } = await query.limit(1)
    return error ? undefined : data?.[0]
  }

  /** Open account due first; when reopening, the latest paid/cancelled one. */
  async function findAccount(descricao: string, options: { reopen?: boolean } = {}): Promise<VoiceFound | undefined> {
    const pattern = ilikePattern(descricao)
    if (!pattern) return undefined
    let query = supabase.from('financeiro_contas').select('id, descricao, vencimento').ilike('descricao', pattern)
    query = options.reopen
      ? query.neq('status', 'a_pagar').order('vencimento', { ascending: false })
      : query.eq('status', 'a_pagar').order('vencimento', { ascending: true })
    const { data, error } = await query.limit(5)
    if (error || !data?.length) return undefined
    const row = data.find(r => foldText(r.descricao) === foldText(descricao)) ?? data[0]!
    return { id: row.id, label: `${row.descricao} (venc. ${dayMonth(row.vencimento)})` }
  }

  async function findCollaborator(nome: string): Promise<VoiceFound | undefined> {
    const { data, error } = await supabase.rpc('list_collaborators')
    if (error || !data) return undefined
    const target = foldText(nome.trim())
    const matches = data.filter(row => foldText(row.nome).includes(target) || foldText(row.username) === target)
    const row = pickByName(matches, nome, r => r.nome)
    return row && { id: row.id, label: row.nome }
  }

  return { findVehicle, findNamed, findOrder, findAppointment, findAccount, findCollaborator }
}
```

- [ ] **Step 4: Create `useVoiceForm.ts`**

```ts
import { applyVoiceFields } from '../utils/voice/apply'
import { VOICE_CATALOG, voiceConfirmText } from '../utils/voice/catalog'
import type { VoiceDraft, VoiceEntityKey, VoiceRecord, VoiceValue } from '../utils/voice/types'

type MaybePromise<T> = T | Promise<T>
export type VoiceActionResult = void | { unavailable?: string, message?: string }

export interface VoiceFormOptions {
  /** Form drafts this screen takes. Default: create and edit. */
  ops?: readonly ('create' | 'edit')[]
  /** Form state written by `applyVoiceFields`. */
  state?: Record<string, unknown>
  format?: Record<string, (value: VoiceValue) => unknown>
  /** Prepares the form before fields are applied (startEdit, openCreate, openEdit by id). */
  open?: (draft: VoiceDraft) => MaybePromise<void>
  /** Replaces open + state for screens whose form needs special handling. */
  apply?: (draft: VoiceDraft) => MaybePromise<void>
  onItems?: (items: VoiceRecord[], draft: VoiceDraft) => MaybePromise<void>
  actions?: Record<string, (draft: VoiceDraft) => MaybePromise<VoiceActionResult>>
  /** Reason the action can't run now; checked before asking for confirmation. */
  unavailable?: (action: string, draft: VoiceDraft) => string | undefined
  currentId?: () => string | undefined
  label?: () => string | undefined
  accept?: (draft: VoiceDraft) => boolean
  ready?: () => boolean
}

export function useVoiceForm(entityKey: VoiceEntityKey, options: VoiceFormOptions) {
  const entity = VOICE_CATALOG[entityKey]
  const toast = useToast()
  const { onVoiceDraft, current } = useVoiceDraft()
  const { confirmVoice } = useVoiceConfirm()
  const ops = options.ops ?? ['create', 'edit']
  const takesForms = !!(options.state || options.apply || options.onItems)

  if (options.currentId) {
    watchEffect(() => {
      const id = options.currentId?.()
      current.value = { ...current.value, [entityKey]: id ? { id, label: options.label?.() } : undefined }
    })
    onScopeDispose(() => {
      current.value = { ...current.value, [entityKey]: undefined }
    })
  }

  function handles(draft: VoiceDraft): boolean {
    if (draft.entity !== entityKey) return false
    if (options.accept && !options.accept(draft)) return false
    if (draft.op === 'action') return !!draft.action && !!options.actions?.[draft.action]
    return takesForms && ops.includes(draft.op)
  }

  async function runAction(draft: VoiceDraft) {
    const name = draft.action!
    const action = entity.actions[name]
    const handler = options.actions?.[name]
    if (!action || !handler) return
    const reason = options.unavailable?.(name, draft)
    if (reason) {
      toast.add({ title: reason, color: 'warning' })
      return
    }
    if (action.kind === 'confirm') {
      const label = draft.label ?? options.label?.()
      const ok = await confirmVoice({ title: voiceConfirmText(action.confirm ?? name, { ...draft.args, label }) })
      if (!ok) return
    }
    const result = await handler(draft)
    if (result?.unavailable) toast.add({ title: result.unavailable, color: 'warning' })
    else if (result?.message) toast.add({ title: result.message, color: 'info', icon: 'i-lucide-mic' })
  }

  async function applyForm(draft: VoiceDraft) {
    if (options.apply) {
      await options.apply(draft)
    } else {
      await options.open?.(draft)
      if (options.state && Object.keys(draft.fields).length) {
        applyVoiceFields(options.state, draft.fields, entity, { format: options.format })
      }
    }
    if (draft.items?.length && options.onItems) await options.onItems(draft.items, draft)
  }

  onVoiceDraft(handles, (draft) => {
    const work = draft.op === 'action' ? runAction(draft) : applyForm(draft)
    work.catch(() => toast.add({ title: 'Não foi possível aplicar o comando de voz.', color: 'error' }))
  }, { ready: options.ready })
}
```

- [ ] **Step 5: Rewrite `useVoiceCommand.ts`**

```ts
import type { PermissionAction } from '#layers/auth/app/utils/permissions'
import { VOICE_CATALOG, type VoiceRefKind } from '../utils/voice/catalog'
import { legacyToCommand } from '../utils/voice/legacy'
import { normalizeVoiceCommand } from '../utils/voice/normalize'
import { parseVoiceCommand } from '../utils/voice/parser'
import { localDateInput, voicePageFromPath } from '../utils/voice/prompt'
import type { VoiceCommand, VoiceDraft, VoiceEntityKey, VoiceNavTarget, VoicePage, VoiceRecord } from '../utils/voice/types'
import type { VoiceFound } from './useVoiceLookup'

export type VoiceRunResult
  = | { ok: true }
    | { ok: false, reason: 'not_understood' | 'forbidden' | 'context' | 'cancelled' }

type Destination = { path: string, query?: Record<string, string>, opened?: true }

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

const RECORD_PATH: Partial<Record<VoiceEntityKey, (id: string) => string>> = {
  order: id => `/ordens/${id}`,
  customer: id => `/clientes/${id}`,
  vehicle: id => `/veiculos/${id}`
}

const CREATE_PATH: Partial<Record<VoiceEntityKey, string>> = {
  order: APP_ROUTES.ordersNew,
  customer: APP_ROUTES.customersNew,
  vehicle: APP_ROUTES.vehiclesNew
}

const SCREEN_PATH: Record<VoiceEntityKey, string> = {
  order: APP_ROUTES.orders,
  customer: APP_ROUTES.customers,
  vehicle: APP_ROUTES.vehicles,
  appointment: APP_ROUTES.scheduling,
  account: APP_ROUTES.finance,
  category: APP_ROUTES.finance,
  catalogItem: APP_ROUTES.catalog,
  supplier: APP_ROUTES.catalogSuppliers,
  collaborator: APP_ROUTES.team,
  pricing: APP_ROUTES.pricing
}

const REF_LABEL: Record<VoiceRefKind, string> = {
  vehicle: 'Placa',
  customer: 'Cliente',
  supplier: 'Fornecedor',
  category: 'Categoria',
  catalogItem: 'Item do catálogo'
}

export function useVoiceCommand() {
  const { currentRoute } = useRouter()
  const toast = useToast()
  const { can } = usePermissions()
  const { setVoiceDraft, clearVoiceDraft, current } = useVoiceDraft()
  const lookup = useVoiceLookup()

  async function interpret(text: string, page: VoicePage): Promise<VoiceCommand | null> {
    const local = () => normalizeVoiceCommand(legacyToCommand(parseVoiceCommand(text)))
    try {
      const { command } = await $fetch<{ command: VoiceCommand | null }>('/api/voice/interpret', {
        method: 'POST',
        body: { text, context: { page, today: localDateInput(new Date()) } },
        // Server worst case: 3 providers × 8 s.
        timeout: 30_000
      })
      return command ?? local()
    } catch {
      return local()
    }
  }

  function warn(title: string, description?: string) {
    toast.add({ title, description, color: 'warning' })
  }

  function findRef(kind: VoiceRefKind, value: string, tipo?: string): Promise<VoiceFound | undefined> {
    return kind === 'vehicle' ? lookup.findVehicle(value) : lookup.findNamed(kind, value, { tipo })
  }

  async function findTarget(entityKey: VoiceEntityKey, command: VoiceCommand): Promise<VoiceFound | undefined> {
    const t = command.target ?? {}
    switch (entityKey) {
      case 'order':
        return lookup.findOrder(t)
      case 'vehicle':
        return t.placa ? lookup.findVehicle(t.placa) : undefined
      case 'appointment': {
        const vehicle = t.placa ? await lookup.findVehicle(t.placa) : undefined
        const found = vehicle && await lookup.findAppointment(vehicle.id, { noShow: command.action === 'desfazerFalta' })
        return found && vehicle ? { id: found.id, inicio: found.inicio, label: vehicle.label } : undefined
      }
      case 'account':
        return t.descricao ? lookup.findAccount(t.descricao, { reopen: command.action === 'reabrir' }) : undefined
      case 'collaborator':
        return t.nome ? lookup.findCollaborator(t.nome) : undefined
      case 'customer':
      case 'supplier':
      case 'category':
      case 'catalogItem':
        return t.nome
          ? lookup.findNamed(entityKey, t.nome, { includeInactive: command.action === 'reativar' || command.action === 'ativar' })
          : undefined
      default:
        return undefined
    }
  }

  async function resolveRefs(entityKey: VoiceEntityKey, fields: VoiceRecord | undefined, warnings: string[]): Promise<VoiceRecord> {
    const out: VoiceRecord = { ...fields }
    const spec = VOICE_CATALOG[entityKey].fields
    for (const [key, value] of Object.entries(fields ?? {})) {
      const ref = spec[key]?.ref
      if (!ref || typeof value !== 'string') continue
      const found = await findRef(ref, value)
      if (found) {
        out[key] = found.id
      } else {
        delete out[key]
        warnings.push(`${REF_LABEL[ref]} "${ref === 'vehicle' ? formatPlaca(value) : value}" não encontrado ou ambíguo.`)
      }
    }
    return out
  }

  async function resolveItems(entityKey: VoiceEntityKey, items: VoiceRecord[] | undefined, warnings: string[]): Promise<VoiceRecord[] | undefined> {
    if (!items?.length) return undefined
    const spec = VOICE_CATALOG[entityKey].items ?? {}
    const resolved = await Promise.all(items.map(async (item) => {
      const out: VoiceRecord = { ...item }
      for (const [key, value] of Object.entries(item)) {
        const ref = spec[key]?.ref
        if (!ref || typeof value !== 'string') continue
        const found = await findRef(ref, value)
        if (!found) {
          warnings.push(`${REF_LABEL[ref]} "${value}" não encontrado ou ambíguo.`)
          return null
        }
        out[key] = found.id
      }
      if (entityKey === 'order' && typeof item.descricao === 'string') {
        const found = await findRef('catalogItem', item.descricao, typeof item.tipo === 'string' ? item.tipo : undefined)
        if (found) out.catalogItemId = found.id
      }
      return out
    }))
    const kept = resolved.filter((item): item is VoiceRecord => !!item)
    return kept.length ? kept : undefined
  }

  async function buildDraft(entityKey: VoiceEntityKey, command: VoiceCommand, page: VoicePage, warnings: string[]): Promise<VoiceDraft | null> {
    const entity = VOICE_CATALOG[entityKey]
    const op = command.op as VoiceDraft['op']
    const draft: VoiceDraft = { entity: entityKey, op, fields: {} }

    if (op !== 'create' && Object.keys(entity.target).length) {
      const onScreen = entity.pages.includes(page) ? current.value[entityKey] : undefined
      const found = command.target ? await findTarget(entityKey, command) : onScreen
      if (!found) {
        const said = Object.values(command.target ?? {})[0]
        if (said) warn(`Não encontrei ${entity.label} "${said}".`, 'Confira o nome, a placa ou o número.')
        else warn(`Qual ${entity.label}?`, 'Diga o nome, a placa ou o número.')
        return null
      }
      draft.id = found.id
      draft.label = found.label
      if (found.inicio) draft.inicio = found.inicio
    }

    draft.fields = await resolveRefs(entityKey, command.fields, warnings)
    if (entityKey === 'order' && command.items?.length && !can('budget.edit')) {
      warnings.push('Sem permissão para adicionar itens ao orçamento.')
    } else {
      const items = await resolveItems(entityKey, command.items, warnings)
      if (items) draft.items = items
    }
    if (command.action) draft.action = command.action
    if (command.args) draft.args = command.args
    return draft
  }

  function destinationFor(draft: VoiceDraft): Destination {
    const record = draft.id ? RECORD_PATH[draft.entity] : undefined
    if (draft.op === 'create') {
      const path = CREATE_PATH[draft.entity] ?? SCREEN_PATH[draft.entity]
      const day = draft.entity === 'appointment' && typeof draft.fields.date === 'string' ? draft.fields.date : undefined
      return day ? { path, query: { dia: day } } : { path }
    }
    if (record) return { path: record(draft.id!) }
    if (draft.entity === 'appointment' && draft.inicio) {
      return { path: SCREEN_PATH.appointment, query: { dia: localDateInput(new Date(draft.inicio)) } }
    }
    return { path: SCREEN_PATH[draft.entity] }
  }

  async function go(destination: Destination, here: string, isCancelled: () => boolean, filled: boolean, warnings: string[] = []): Promise<VoiceRunResult> {
    if (isCancelled()) {
      clearVoiceDraft()
      return { ok: false, reason: 'cancelled' }
    }
    if (destination.path !== here || destination.query) {
      try {
        await navigateTo({ path: destination.path, query: destination.query })
      } catch (error) {
        clearVoiceDraft()
        throw error
      }
    }
    if (currentRoute.value.path !== destination.path) {
      clearVoiceDraft()
      return { ok: false, reason: 'context' }
    }
    if (destination.opened) toast.add({ title: 'Aberto por voz', color: 'info', icon: 'i-lucide-mic' })
    else if (filled) toast.add({ title: 'Preenchido por voz', description: 'Confira os dados e salve.', color: 'info', icon: 'i-lucide-mic' })
    warnings.forEach(title => warn(title))
    return { ok: true }
  }

  function forbidden(): VoiceRunResult {
    warn('Sem permissão', 'Seu perfil não pode fazer isso.')
    return { ok: false, reason: 'forbidden' }
  }

  /** `isCancelled`: the AI call can take seconds; a closed modal must not navigate or prefill afterwards. */
  async function run(text: string, isCancelled: () => boolean = () => false): Promise<VoiceRunResult> {
    const here = currentRoute.value.path
    const page = voicePageFromPath(here)
    const command = await interpret(text, page)
    if (isCancelled()) return { ok: false, reason: 'cancelled' }
    if (!command) return { ok: false, reason: 'not_understood' }

    if (command.op === 'navigate') {
      const nav = NAV[command.to!]
      if (nav.permission && !can(nav.permission)) return forbidden()
      const query = command.to === 'scheduling' && command.date ? { dia: command.date } : undefined
      return go({ path: nav.path, query }, here, isCancelled, false)
    }

    const entityKey = command.entity!
    const entity = VOICE_CATALOG[entityKey]
    const permission = command.op === 'action'
      ? entity.actions[command.action!]!.permission
      : entity.permission[command.op as 'create' | 'edit']
    if (!permission) return go({ path: SCREEN_PATH[entityKey], opened: true }, here, isCancelled, false)
    if (!can(permission)) return forbidden()

    const warnings: string[] = []
    const draft = await buildDraft(entityKey, command, page, warnings)
    if (isCancelled()) return { ok: false, reason: 'cancelled' }
    if (!draft) return { ok: false, reason: 'context' }

    const destination = destinationFor(draft)
    const opened = draft.op === 'edit' && !!RECORD_PATH[entityKey] && !Object.keys(draft.fields).length && !draft.items?.length
    if (opened) {
      if (destination.path === here) return { ok: false, reason: 'not_understood' }
      destination.opened = true
    } else {
      setVoiceDraft(draft)
    }
    return go(destination, here, isCancelled, !opened && draft.op !== 'action', warnings)
  }

  return { run }
}
```

`VoiceCommandButton.vue` keeps using `run(command, isCancelled)` and `result.reason`; no change needed unless typecheck complains about the removed `intent` field.

- [ ] **Step 6: Budget page helpers for voice items**

In `layers/5.orders/app/composables/useOrderBudgetPage.ts`:
1. Replace the `openVoiceItem` function and the `onVoiceDraft('budgetItem.create', …)` block with:

```ts
  /** Fills the add-item draft from voice (catalog entry first, spoken values on top). */
  async function fillVoiceItem(voice: VoiceBudgetItemDraft): Promise<boolean> {
    if (!canEditItems.value) {
      useToast().add({
        title: 'Orçamento bloqueado',
        description: 'Este orçamento não pode receber itens agora.',
        color: 'warning'
      })
      return false
    }
    Object.assign(draft, emptyOrderItemDraft(), { tipo: voice.tipo })
    if (voice.descricao) draft.descricao = voice.descricao
    selectedCatalogId.value = voice.catalogItemId
    applyCatalogEntry(voice.catalogItemId)
    // Spoken values must land after the selectedCatalogId watcher re-applies the catalog price.
    await nextTick()
    if (voice.quantidade != null) draft.quantidade = voice.quantidade
    if (voice.valor_unitario != null) draft.valor_unitario = voice.valor_unitario
    return true
  }

  async function openVoiceItem(voice: VoiceBudgetItemDraft) {
    if (await fillVoiceItem(voice)) addModalOpen.value = true
  }

  /** Several spoken items: the page confirms the list first, then each one is inserted like the add modal does. */
  async function addVoiceItems(voice: VoiceBudgetItemDraft[]) {
    let nextOrdem = items.value?.length || 0
    for (const item of voice) {
      if (!await fillVoiceItem(item)) return
      if (!isOrderItemDraftValid(draft)) continue
      const { error } = await addOrderItem(toValue(orderId), { ...draft }, nextOrdem, { silent: true })
      if (error) break
      nextOrdem++
    }
    Object.assign(draft, emptyOrderItemDraft())
    selectedCatalogId.value = undefined
    await refreshItems()
  }
```

2. Add `isOrderItemDraftValid` to the existing `from '../utils/budget'` import (it exists at `budget.ts:29`).
3. Return `fillVoiceItem`, `openVoiceItem`, `addVoiceItems` (keep `openVoiceItem` in the return object).

- [ ] **Step 7: Migrate the 13 consumers (same behavior as v2)**

Replace each `onVoiceDraft(...)` block (and remove now-unused imports such as `useVoiceDraft` destructuring and v2 draft types):

`customers-new.vue:34`:

```ts
useVoiceForm('customer', {
  ops: ['create'],
  state,
  format: { telefones: v => formatPhoneBr(String(v)), documento: v => formatDocumento(String(v)) }
})
```

`customers-[id].vue:61`:

```ts
useVoiceForm('customer', {
  ops: ['edit'],
  state,
  format: { telefones: v => formatPhoneBr(String(v)), documento: v => formatDocumento(String(v)) },
  open: () => {
    if (!editing.value) startEdit()
  },
  currentId: () => id.value,
  label: () => cliente.value?.nome,
  accept: draft => draft.id === id.value,
  ready: () => !!cliente.value && can('customers.write')
})
```

`vehicles-new.vue:37`:

```ts
useVoiceForm('vehicle', {
  ops: ['create'],
  state,
  format: { placa: v => formatPlacaInput(String(v)) },
  open: (draft) => {
    if (typeof draft.fields.dono === 'string') preferredClienteId.value = draft.fields.dono
  }
})
```

`vehicles-[id].vue:54`:

```ts
useVoiceForm('vehicle', {
  ops: ['edit'],
  state,
  format: { placa: v => formatPlacaInput(String(v)) },
  open: () => {
    if (!editing.value) startEdit()
  },
  currentId: () => id.value,
  label: () => (veiculo.value ? formatPlaca(veiculo.value.placa) : undefined),
  accept: draft => draft.id === id.value,
  ready: () => !!veiculo.value && can('vehicles.write')
})
```

`orders-new.vue:75`:

```ts
useVoiceForm('order', {
  ops: ['create'],
  state,
  open: (draft) => {
    if (typeof draft.fields.veiculo === 'string') voiceVeiculoId.value = draft.fields.veiculo
  }
})
```

`orders-[id].vue:83` (fields, status and items; payment/actions come in Task 3):

```ts
const ORDER_FORM_FIELDS = ['km_entrada', 'reclamacao', 'diagnostico', 'observacoes'] as const

useVoiceForm('order', {
  ops: ['edit'],
  apply: (draft) => {
    const { status, ...rest } = draft.fields
    const hasForm = ORDER_FORM_FIELDS.some(key => key in rest)
    if ((hasForm || status) && !canEdit.value) {
      useToast().add({ title: 'Esta OS não pode ser editada.', color: 'warning' })
      return
    }
    applyVoiceFields(state, rest, VOICE_CATALOG.order, { only: ORDER_FORM_FIELDS })
    if (typeof status === 'string') {
      if (statusItems.value.some(item => item.value === status)) selectedStatus.value = status
      else useToast().add({ title: 'Esse status não está disponível para esta OS.', color: 'warning' })
    }
  },
  onItems: async (items) => {
    await openVoiceItem(voiceBudgetItem(items[0]!))
    if (items.length > 1) useToast().add({ title: 'Só o primeiro item foi preenchido. Dite o próximo em seguida.', color: 'warning' })
  },
  currentId: () => id.value,
  label: () => ordem.value?.numero,
  accept: draft => draft.id === id.value,
  ready: () => !!ordem.value
})
```

with imports:

```ts
import { applyVoiceFields, voiceBudgetItem } from '#layers/base/app/utils/voice/apply'
import { VOICE_CATALOG } from '#layers/base/app/utils/voice/catalog'
```

(`openVoiceItem` comes from the `useOrderBudgetPage` destructuring — add it if the page doesn't destructure it yet.)

`scheduling.vue:90,127,135` — replace the three blocks with one registration (keep `whenAppointmentLoaded` and `appointmentLookups`). `openCreate`'s prefill type must accept `veiculo_id` and `problema` as today's create handler does; if it doesn't, pass only what it accepts here and let Task 4 widen it:

```ts
useVoiceForm('appointment', {
  apply: (draft) => {
    if (!canWrite.value) return
    const { veiculo, date, startTime, problema } = draft.fields
    if (draft.op === 'create') {
      if (typeof date === 'string') selectDay(combineLocalDateTime(date, '00:00'))
      openCreate({
        veiculo_id: typeof veiculo === 'string' ? veiculo : undefined,
        date: typeof date === 'string' ? date : undefined,
        startTime: typeof startTime === 'string' ? startTime : undefined,
        problema: typeof problema === 'string' ? problema : undefined
      })
      return
    }
    const override = {
      ...(typeof date === 'string' ? { date } : {}),
      ...(typeof startTime === 'string' ? { startTime } : {})
    }
    // No plate spoken: the runtime used the appointment open in the slideover (no `inicio`).
    if (editingAppointment.value && draft.id === editingAppointment.value.id) return openEdit(editingAppointment.value, override)
    if (!draft.id || !draft.inicio) return
    whenAppointmentLoaded(draft.id, draft.inicio, appointment => openEdit(appointment, override))
  },
  actions: {
    faltou: (draft) => {
      if (!canWrite.value || !draft.id || !draft.inicio) return
      whenAppointmentLoaded(draft.id, draft.inicio, appointment => requestNoShow(appointment.id))
    }
  },
  currentId: () => editingAppointment.value?.id
})
```

`finance.vue:78`:

```ts
useVoiceForm('account', {
  ops: ['create'],
  state: accountDraft,
  open: () => {
    tab.value = 'contas'
    Object.assign(accountDraft, emptyFinanceAccountDraft())
    accountCreateOpen.value = true
  }
})
```

`catalog.vue:98`:

```ts
useVoiceForm('catalogItem', {
  ops: ['create'],
  apply: async (draft) => {
    openCreate()
    await nextTick()
    const { tipo, usar_preco_sugerido, valor_padrao, ...rest } = draft.fields
    if (typeof tipo === 'string') budgetDraft.tipo = tipo as CatalogItemDraft['tipo']
    // CatalogForm's tipo watcher resets custo/estoque/horas/preco_manual; let it run before applying spoken values.
    await nextTick()
    applyVoiceFields(budgetDraft, rest, VOICE_CATALOG.catalogItem)
    if (typeof valor_padrao === 'number') {
      if (budgetDraft.tipo === 'servico') budgetDraft.preco_manual = true
      budgetDraft.valor_padrao = valor_padrao
    }
    if (typeof usar_preco_sugerido === 'boolean') budgetDraft.preco_manual = !usar_preco_sugerido
  }
})
```

(`budgetDraft` is typed `CatalogItemDraft`; pass it as `budgetDraft as unknown as Record<string, unknown>` to `applyVoiceFields` if TS complains. Same cast pattern is acceptable for every typed reactive form in this plan.)

`catalog-suppliers.vue:93`:

```ts
useVoiceForm('supplier', {
  ops: ['create'],
  state: supplierDraft,
  open: () => openCreate()
})
```

`team.vue:41`:

```ts
useVoiceForm('collaborator', {
  ops: ['create'],
  apply: (draft) => {
    voiceCollaborator.value = { ...draft.fields } as typeof voiceCollaborator.value
    createOpen.value = true
  }
})
```

- [ ] **Step 8: Verify**

Run: `pnpm test && npx nuxt typecheck && pnpm lint`
Expected: all exit 0. Then grep: `rg "onVoiceDraft\(" layers --glob '!**/useVoiceDraft.ts' --glob '!**/useVoiceForm.ts'` → no results.

- [ ] **Step 9: Commit**

```bash
git add layers/1.base layers/4.customers layers/5.orders layers/6.configuration layers/8.management layers/10.vehicles layers/11.scheduling
git commit -m ":recycle: refactor(voice): route drafts through catalog runtime and useVoiceForm"
```

---

### Task 3: Orders — payment, budget actions, several items, photos, diagnosis on new OS

**Files:**
- Modify: `layers/5.orders/app/pages/orders-[id].vue` (the `useVoiceForm('order', …)` from Task 2)
- Modify: `layers/5.orders/app/components/OrdersPhotosSection.vue`
- Modify: `layers/5.orders/app/components/OrdersNewForm.vue` (Diagnóstico field)

**Interfaces:**
- Consumes: `useVoiceForm`, `useVoiceConfirm().confirmVoice`, `applyVoiceFields`, `voiceBudgetItem`, `VOICE_CATALOG`, `formatMoney` (auto-imported), from `useOrderBudgetPage`: `openVoiceItem`, `addVoiceItems`, `onDeleteItem(itemId)`, `onSubmitForApproval()`, `onApprove()`, `onReject()`, `canEditItems`, `canApproveBudget`, `budgetStatus`; from `useOrderPayment`: `state: paymentState`, `canEditPayment`, `showPaymentSection`, `applySuggestedCharge()`; from `useOrderPhotos` (inside the section): `photos`, `updateCaption(photoId, legenda)`, `removePhoto(photo)`.
- Produces: nothing for other tasks.

- [ ] **Step 1: Payment fields in the order `apply`**

In the Task 2 `useVoiceForm('order', …)` of `orders-[id].vue`, extend `apply`:

```ts
const PAYMENT_FIELDS = ['pago', 'forma_pagamento', 'parcelas', 'valor_cobrado'] as const
```

and at the end of `apply` (before the status block):

```ts
    if (PAYMENT_FIELDS.some(key => key in rest)) {
      if (!canEditPayment.value || !showPaymentSection.value) {
        useToast().add({ title: 'O pagamento desta OS não pode ser editado agora.', color: 'warning' })
      } else {
        applyVoiceFields(paymentState, rest, VOICE_CATALOG.order, { only: PAYMENT_FIELDS })
        if (rest.forma_pagamento && rest.forma_pagamento !== 'cartao_credito') paymentState.parcelas = null
      }
    }
```

Move the `useVoiceForm('order', …)` call below the `useOrderPayment` destructuring (currently at `orders-[id].vue:100`) so `paymentState` is defined. The existing `isPaymentDirty` + Salvar bar handle saving.

- [ ] **Step 2: Several items → one confirmation**

Replace the Task 2 `onItems` with:

```ts
  onItems: async (items) => {
    const voice = items.map(voiceBudgetItem)
    if (voice.length === 1) return openVoiceItem(voice[0]!)
    if (!canEditItems.value) {
      useToast().add({ title: 'Orçamento bloqueado', description: 'Este orçamento não pode receber itens agora.', color: 'warning' })
      return
    }
    const lines = voice.map(item => `${item.quantidade ?? 1}× ${item.descricao ?? 'item'}${item.valor_unitario != null ? ` — ${formatMoney(item.valor_unitario)}` : ''}`)
    const ok = await confirmVoice({ title: `Adicionar ${voice.length} itens ao orçamento?`, description: lines.join('\n') })
    if (ok) await addVoiceItems(voice)
  },
```

with `const { confirmVoice } = useVoiceConfirm()` near the other composables, and `addVoiceItems`, `canEditItems` from the `useOrderBudgetPage` destructuring.

- [ ] **Step 3: Budget and payment actions**

Add to the same `useVoiceForm('order', …)` call:

```ts
  unavailable: (action) => {
    if (['enviarAprovacao', 'removerItem'].includes(action) && !canEditItems.value) return 'Este orçamento não pode ser alterado agora.'
    if (action === 'enviarAprovacao' && budgetStatus.value === 'aguardando_aprovacao') return 'O orçamento já está aguardando aprovação.'
    if (['aprovar', 'rejeitar'].includes(action) && budgetStatus.value !== 'aguardando_aprovacao') return 'O orçamento não está aguardando aprovação.'
    if (action === 'usarSugestao' && (!canEditPayment.value || !showPaymentSection.value)) return 'O pagamento desta OS não pode ser editado agora.'
    return undefined
  },
  actions: {
    enviarAprovacao: () => onSubmitForApproval(),
    aprovar: () => onApprove(),
    rejeitar: () => onReject(),
    removerItem: async (draft) => {
      const spoken = typeof draft.args?.descricao === 'string' ? foldText(draft.args.descricao) : ''
      const matches = (items.value ?? []).filter(item => spoken && foldText(item.descricao).includes(spoken))
      if (matches.length !== 1) return { unavailable: matches.length ? 'Mais de um item com esse nome. Diga o nome completo.' : 'Item não encontrado no orçamento.' }
      await onDeleteItem(matches[0]!.id)
    },
    usarSugestao: () => {
      applySuggestedCharge()
      return { message: 'Valor sugerido aplicado. Confira e salve.' }
    }
  },
```

Import `foldText` from `#layers/base/app/utils/voice/text`. `items` is the page's order items ref (from `useOrderItemsQuery`, passed to `useOrderBudgetPage`); use the name the page already has. Approval permissions are enforced by the runtime (`budget.edit` / `budget.approve` from the catalog) and again by RLS.

Note: `removerItem`'s confirmation text uses the spoken `descricao` ("Remover "pastilha" do orçamento da OS-2026-0012?"). The existing toast "Item removido / Desfazer" from `onDeleteItem` stays.

- [ ] **Step 4: Photos section actions**

In `layers/5.orders/app/components/OrdersPhotosSection.vue` `<script setup>`, after `useOrderPhotos(...)` and `inputRef`:

```ts
const sectionRef = ref<HTMLElement | null>(null)

function photoAt(draft: VoiceDraft) {
  const n = Number(draft.args?.numero)
  return Number.isInteger(n) && n >= 1 ? photos.value?.[n - 1] : undefined
}

useVoiceForm('order', {
  accept: draft => draft.id === props.ordemId,
  unavailable: (action, draft) => {
    if (!props.canEdit) return 'As fotos desta OS não podem ser alteradas.'
    if (action !== 'adicionarFoto' && !photoAt(draft)) return `Foto ${draft.args?.numero ?? ''} não encontrada.`
    return undefined
  },
  actions: {
    legendarFoto: async (draft) => {
      const photo = photoAt(draft)
      if (photo && typeof draft.args?.legenda === 'string') await updateCaption(photo.id, draft.args.legenda)
    },
    removerFoto: async (draft) => {
      const photo = photoAt(draft)
      if (photo) await removePhoto(photo)
    },
    adicionarFoto: () => {
      sectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return { message: 'Toque em Adicionar foto para usar a câmera.' }
    }
  }
})
```

Add `ref="sectionRef"` to the section's root element, and `import type { VoiceDraft } from '#layers/base/app/utils/voice/types'`. Use the exact names returned by `useOrderPhotos` in this component (`photos`, `updateCaption`, `removePhoto` per `useOrderPhotos.ts:13,142,168`). Photos are ordered by `created_at` ascending, so "foto 2" = `photos[1]`.

`removePhoto` may have its own confirm/undo today — keep whatever it does; the voice confirmation happens before it.

- [ ] **Step 5: Diagnóstico field on /ordens/novo**

In `OrdersNewForm.vue`, add a Diagnóstico reveal right after the Observações reveal, copying its pattern (`showNotes` at L39, button + `v-if` field at L277–326):

```ts
const showDiagnosis = ref(Boolean(state.value.diagnostico.trim()))
watch(() => state.value.diagnostico, (value) => {
  if (value.trim()) showDiagnosis.value = true
})
```

(adapt `state.value` vs `state` to how the component accesses its `v-model`), and a `UFormField label="Diagnóstico"` with a `UTextarea v-model="state.diagnostico" autoresize :rows="3"` shown when `showDiagnosis`, plus the reveal button "Adicionar diagnóstico" styled like "Adicionar observação". The `watch` also opens it when voice fills the field.

- [ ] **Step 6: Verify and commit**

Run: `pnpm test && npx nuxt typecheck && pnpm lint` → exit 0.

```bash
git add layers/5.orders
git commit -m ":sparkles: feat(voice): cover order payment, budget actions and photos"
```

---

### Task 4: Customers, vehicles and agenda — remaining fields and actions

**Files:**
- Modify: `layers/4.customers/app/pages/customers-[id].vue`
- Modify: `layers/10.vehicles/app/pages/vehicles-[id].vue`
- Modify: `layers/11.scheduling/app/pages/scheduling.vue`, `layers/11.scheduling/app/components/SchedulingFormSlideover.vue`, `layers/11.scheduling/app/utils/scheduling.ts` (only if the prefill type needs widening)

**Interfaces:**
- Consumes: Task 2 `useVoiceForm`; `toggleAtivo()`, `deleteOpen` (customer, `useCustomerDetailPage`); `deleteOpen` (vehicle, `useVehicleDetailPage`); scheduling `openEdit`, `requestNoShow`, `onUndoNoShow(id)`, `whenAppointmentLoaded`, `ORDER_ROUTES.newFromAppointment(veiculoId, agendamentoId)` from `#layers/orders/app/utils/order-routes`.

- [ ] **Step 1: Customer name and actions**

The Task 2 customer `useVoiceForm` already applies `nome` (it is in the catalog). Add to it:

```ts
  unavailable: (action) => {
    if (action === 'desativar' && cliente.value && !cliente.value.ativo) return 'Este cliente já está inativo.'
    if (action === 'reativar' && cliente.value?.ativo) return 'Este cliente já está ativo.'
    return undefined
  },
  actions: {
    desativar: () => toggleAtivo(),
    reativar: () => toggleAtivo(),
    excluir: () => {
      deleteOpen.value = true
    }
  },
```

Change `ready` to `() => !!cliente.value` (form edits still check `can('customers.write')` inside `open`: `if (!can('customers.write')) return` before `startEdit()`; the runtime already blocks without permission). `toggleAtivo` and `deleteOpen` come from `useCustomerDetailPage` — destructure them if not already.

- [ ] **Step 2: Vehicle fields and delete**

The Task 2 vehicle edit registration already applies every catalog field (`placa`, `marca`, `modelo`, `ano`, `cor`, `km_atual`, `observacoes`, `dono` → `cliente_id`). Add:

```ts
  actions: {
    excluir: () => {
      deleteOpen.value = true
    }
  },
```

and change `ready` to `() => !!veiculo.value`. If the owner select in `VehiclesEditForm` needs a preferred id to show a customer not yet loaded in its options (like `preferredClienteId` on `vehicles-new.vue`), mirror that: check `VehiclesEditForm`/`VehiclesFormFields` props for a preferred-id prop and pass the voice `dono` id through it in `open`.

- [ ] **Step 3: Agenda — full edit prefill, undo no-show, open OS**

1. `scheduling.vue` `openEdit` override type: change `Pick<AppointmentCreatePrefill, 'date' | 'startTime'>` to `Omit<AppointmentCreatePrefill, 'hour'>`.
2. `SchedulingFormSlideover.vue` `resetDraft()` (L71): in the edit branch, after the snapshot, apply every prefill key present, not only date/startTime:

```ts
    if (props.prefill?.date) draft.date = props.prefill.date
    if (props.prefill?.startTime) draft.startTime = props.prefill.startTime
    if (props.prefill?.veiculo_id) draft.veiculo_id = props.prefill.veiculo_id
    if (props.prefill?.problema) draft.problema = appendText(draft.problema, props.prefill.problema)
```

(keep the existing statements for date/startTime; add the two new lines; `appendText` is an auto-imported util.)
3. In the Task 2 `useVoiceForm('appointment', …)` edit branch, extend `override` with the other fields:

```ts
    const override = {
      ...(typeof date === 'string' ? { date } : {}),
      ...(typeof startTime === 'string' ? { startTime } : {}),
      ...(typeof veiculo === 'string' ? { veiculo_id: veiculo } : {}),
      ...(typeof problema === 'string' ? { problema } : {})
    }
```

If `AppointmentCreatePrefill` has no `problema`/`veiculo_id`, add them (optional strings) and make the create branch of `resetDraft` apply them too.

4. Add actions:

```ts
    desfazerFalta: (draft) => {
      if (!canWrite.value || !draft.id || !draft.inicio) return
      selectDay(new Date(draft.inicio))
      return onUndoNoShow(draft.id)
    },
    abrirOS: (draft) => {
      if (!draft.id || !draft.inicio) return
      whenAppointmentLoaded(draft.id, draft.inicio, (appointment) => {
        if (appointment.ordem_servico_id) navigateTo(`/ordens/${appointment.ordem_servico_id}`)
        else navigateTo(ORDER_ROUTES.newFromAppointment(appointment.veiculo_id, appointment.id))
      })
    }
```

`faltou` stays as in Task 2 (opens the existing no-show modal). Import `ORDER_ROUTES` from `#layers/orders/app/utils/order-routes` if not imported.

- [ ] **Step 4: Verify and commit**

Run: `pnpm test && npx nuxt typecheck && pnpm lint` → exit 0.

```bash
git add layers/4.customers layers/10.vehicles layers/11.scheduling
git commit -m ":sparkles: feat(voice): cover customer, vehicle and agenda actions"
```

---

### Task 5: Finance, catalog, suppliers, team and pricing

**Files:**
- Modify: `layers/8.management/app/pages/finance.vue`, `layers/8.management/app/pages/team.vue`
- Modify: `layers/6.configuration/app/pages/catalog.vue`, `catalog-suppliers.vue`, `pricing.vue`

**Interfaces:**
- Consumes: Task 2 `useVoiceForm`, `useVoiceConfirm`, `applyVoiceFields`, `VOICE_CATALOG`; finance workspace `onMarkPaid({ id, forma_pagamento })`, `onCancelAccount(id)`, `onReopenAccount(id)`, `onRemoveAccount(id)`, `onAddCategory({ nome })`, `onSaveCategory({ id, draft: { nome } })`, `onToggleCategory({ id, ativo })`, `categoriesOpen`, `tab`; catalog `onBudgetEdit({ id })`, `onBudgetToggleAtivo({ id, ativo })`, `onBudgetRequestDelete({ id })`, `editingId`, `formOpen`; suppliers `onSupplierEdit({ id })`, `onSupplierToggleAtivo({ id, ativo })`, `onSupplierRequestDelete({ id })`, `editingId`, `formOpen`; team `onUpdatePapel({ id, papel })`, `onResetPassword(row)`, `onDelete(row)`, `collaborators`, `currentUserId`; pricing `draft` (ref), `onSave`.

- [ ] **Step 1: Finance — accounts and categories**

Extend the Task 2 `useVoiceForm('account', …)` with actions (the runtime already resolved the account id and label):

```ts
  // Pix is the table's default payment form; set it before the confirmation so the title reads "(Pix)".
  unavailable: (action, draft) => {
    if (action === 'pagar' && !draft.args?.forma) draft.args = { ...draft.args, forma: 'pix' }
    return undefined
  },
  actions: {
    pagar: (draft) => {
      tab.value = 'contas'
      return onMarkPaid({ id: draft.id!, forma_pagamento: draft.args!.forma as FormaPagamento })
    },
    cancelar: draft => onCancelAccount(draft.id!),
    reabrir: draft => onReopenAccount(draft.id!),
    excluir: draft => onRemoveAccount(draft.id!)
  }
```

Add a category registration:

```ts
const { confirmVoice } = useVoiceConfirm()

useVoiceForm('category', {
  apply: async (draft) => {
    const nome = typeof draft.fields.nome === 'string' ? draft.fields.nome : ''
    if (!nome) return
    categoriesOpen.value = true
    const title = draft.op === 'create' ? `Criar a categoria "${nome}"?` : `Renomear a categoria ${draft.label} para "${nome}"?`
    if (!await confirmVoice({ title })) return
    if (draft.op === 'create') await onAddCategory({ nome })
    else if (draft.id) await onSaveCategory({ id: draft.id, draft: { nome } })
  },
  actions: {
    ativar: draft => onToggleCategory({ id: draft.id!, ativo: true }),
    desativar: draft => onToggleCategory({ id: draft.id!, ativo: false })
  }
})
```

Destructure `categoriesOpen`, `onAddCategory`, `onSaveCategory`, `onToggleCategory`, `onMarkPaid`, `onCancelAccount`, `onReopenAccount`, `onRemoveAccount` from `useFinanceWorkspace()` if the page doesn't already. Import `type { FormaPagamento } from '~~/shared/types/oficina'`.

- [ ] **Step 2: Catalog — edit, kit items, actions**

Replace the Task 2 catalog registration (keep the create logic) with one that handles both ops and actions:

```ts
async function applyCatalogVoice(fields: VoiceRecord) {
  const { tipo, usar_preco_sugerido, valor_padrao, ...rest } = fields
  if (typeof tipo === 'string') budgetDraft.tipo = tipo as CatalogItemDraft['tipo']
  // CatalogForm's tipo watcher resets custo/estoque/horas/preco_manual; let it run before applying spoken values.
  await nextTick()
  applyVoiceFields(budgetDraft as unknown as Record<string, unknown>, rest, VOICE_CATALOG.catalogItem)
  if (typeof valor_padrao === 'number') {
    if (budgetDraft.tipo === 'servico') budgetDraft.preco_manual = true
    budgetDraft.valor_padrao = valor_padrao
  }
  if (typeof usar_preco_sugerido === 'boolean') budgetDraft.preco_manual = !usar_preco_sugerido
}

useVoiceForm('catalogItem', {
  apply: async (draft) => {
    if (draft.op === 'create') openCreate()
    else if (draft.id) onBudgetEdit({ id: draft.id })
    await nextTick()
    await applyCatalogVoice(draft.fields)
  },
  onItems: (items) => {
    if (budgetDraft.tipo !== 'kit') {
      useToast().add({ title: 'Itens só podem ser incluídos em kits.', color: 'warning' })
      return
    }
    for (const item of items) {
      const id = typeof item.item === 'string' ? item.item : undefined
      if (!id || id === editingId.value) continue
      const quantidade = typeof item.quantidade === 'number' ? item.quantidade : 1
      const existing = budgetDraft.kit_itens.find(row => row.item_id === id)
      if (existing) existing.quantidade = quantidade
      else budgetDraft.kit_itens.push({ item_id: id, quantidade })
    }
  },
  actions: {
    desativar: draft => onBudgetToggleAtivo({ id: draft.id!, ativo: false }),
    reativar: draft => onBudgetToggleAtivo({ id: draft.id!, ativo: true }),
    excluir: draft => onBudgetRequestDelete({ id: draft.id! })
  },
  currentId: () => (formOpen.value && formMode.value === 'edit' ? editingId.value ?? undefined : undefined),
  label: () => budgetDraft.nome
})
```

Note: `onBudgetEdit` looks the item up in `budgetItems` (current list/filters). If the voice target isn't in the loaded list, it returns silently — acceptable; the runtime already confirmed the id exists. Import `type { VoiceRecord }` from `#layers/base/app/utils/voice/types`.

- [ ] **Step 3: Suppliers — edit and actions**

Replace the Task 2 supplier registration with:

```ts
useVoiceForm('supplier', {
  state: supplierDraft,
  open: (draft) => {
    if (draft.op === 'create') openCreate()
    else if (draft.id) onSupplierEdit({ id: draft.id })
  },
  actions: {
    desativar: draft => onSupplierToggleAtivo({ id: draft.id!, ativo: false }),
    reativar: draft => onSupplierToggleAtivo({ id: draft.id!, ativo: true }),
    excluir: draft => onSupplierRequestDelete({ id: draft.id! })
  },
  currentId: () => (formOpen.value && formMode.value === 'edit' ? editingId.value ?? undefined : undefined),
  label: () => supplierDraft.nome
})
```

`onSupplierEdit` finds the supplier in `activeSuppliers`; for `reativar` the supplier may be inactive — the toggle only needs the id, so it works regardless.

- [ ] **Step 4: Team — role change, password dialog, delete**

Replace the Task 2 team registration with:

```ts
const { confirmVoice } = useVoiceConfirm()

function collaboratorRow(id?: string) {
  return collaborators.value?.find(row => row.id === id)
}

async function changeRoleByVoice(id: string | undefined, papel: unknown) {
  const row = collaboratorRow(id)
  if (!row || typeof papel !== 'string') return
  await onUpdatePapel({ id: row.id, papel: papel as ColaboradorPapel })
}

useVoiceForm('collaborator', {
  apply: async (draft) => {
    if (draft.op === 'create') {
      voiceCollaborator.value = { ...draft.fields } as typeof voiceCollaborator.value
      createOpen.value = true
      return
    }
    const papel = draft.fields.papel
    if (typeof papel !== 'string') {
      useToast().add({ title: 'Por voz, só dá para mudar o papel de um colaborador.', color: 'warning' })
      return
    }
    if (draft.id === currentUserId.value) {
      useToast().add({ title: 'Você não pode mudar o próprio papel.', color: 'warning' })
      return
    }
    if (await confirmVoice({ title: voiceConfirmText(VOICE_CATALOG.collaborator.actions.trocarPapel!.confirm!, { label: draft.label, papel }) })) {
      await changeRoleByVoice(draft.id, papel)
    }
  },
  unavailable: (action, draft) => {
    if (action !== 'redefinirSenha' && draft.id === currentUserId.value) return 'Você não pode fazer isso com o próprio usuário.'
    if (!collaboratorRow(draft.id)) return 'Colaborador não encontrado na lista.'
    return undefined
  },
  actions: {
    trocarPapel: draft => changeRoleByVoice(draft.id, draft.args?.papel),
    redefinirSenha: (draft) => {
      const row = collaboratorRow(draft.id)
      if (row) onResetPassword(row)
      return { message: 'Digite a nova senha.' }
    },
    excluir: (draft) => {
      const row = collaboratorRow(draft.id)
      if (row) onDelete(row)
    }
  }
})
```

Imports: `VOICE_CATALOG`, `voiceConfirmText` from `#layers/base/app/utils/voice/catalog`. `collaborators` is the list the page already renders (from `useCollaborators`/`list_collaborators`); use its actual name.

- [ ] **Step 5: Pricing — all parameters**

In `pricing.vue`:

```ts
useVoiceForm('pricing', {
  ops: ['edit'],
  apply: (draft) => {
    const next = { ...draft.value } as unknown as Record<string, unknown>
    applyVoiceFields(next, draft.fields, VOICE_CATALOG.pricing)
    draft.value = next as unknown as PricingParamsDraft
  },
  ready: () => !!draftDefaults.value
})
```

Rename the callback parameter to avoid shadowing the page's `draft` ref (e.g. `apply: (voice) => { … applyVoiceFields(next, voice.fields, …) }`). `draftDefaults` is the computed the page already watches to hydrate `draft` (`pricing.vue:30`); `ready` waits for it so the hydration watcher doesn't overwrite the voice values. Pricing has no dirty bar; the runtime's toast "Preenchido por voz — Confira os dados e salve." points the user to "Salvar parâmetros".

- [ ] **Step 6: Verify and commit**

Run: `pnpm test && npx nuxt typecheck && pnpm lint` → exit 0.

```bash
git add layers/6.configuration layers/8.management
git commit -m ":sparkles: feat(voice): cover finance, catalog, suppliers, team and pricing"
```

---

### Task 6: Final verification, live AI check, docs

**Files:**
- Modify: `.superpowers/sdd/live-ai-check.ts` (scratch, not committed) — or use `.superpowers/sdd/proto/live.ts` pointed at the real modules
- Modify: `docs/superpowers/specs/2026-09-30-voice-full-coverage-design.md` only if behavior deviated

- [ ] **Step 1: Full verification**

Run: `pnpm test && npx nuxt typecheck && pnpm lint && npx nuxt build`
Expected: all exit 0.

- [ ] **Step 2: Live AI check (needs valid keys in `.env`, `full_network`)**

Point `.superpowers/sdd/proto/live.ts` imports at `../../../layers/1.base/app/utils/voice/prompt.ts` and `normalize.ts` and run:
`node --env-file=.env .superpowers/sdd/proto/live.ts`
Expected: every case yields the intended `op/entity/action/fields` (the greeting yields `null`; the collaborator case has no password). Record results in `.superpowers/sdd/progress.md`.

- [ ] **Step 3: Graph and commit**

```bash
graphify update .
git add graphify-out
git commit -m ":wrench: chore(graphify): update graph after voice full coverage"
```
