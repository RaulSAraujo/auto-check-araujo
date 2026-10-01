# Comandos por Voz — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar qualquer registro por voz: a fala é interpretada e o formulário de criação existente abre pré-preenchido para o usuário conferir e salvar.

**Architecture:** Tudo em `layers/1.base`. Um parser puro (`app/utils/voice/`) transforma o texto em `{ intent, payload }`. `useVoiceCommand` confere a permissão, resolve ids (placa/nome → id), grava um draft em `useState` (`useVoiceDraft`) e navega. Cada formulário de destino registra `onVoiceDraft(intent, handler)` e preenche o próprio estado.

**Tech Stack:** Nuxt 4, Vue 3 `<script setup>`, Nuxt UI v4, Supabase (`useTypedSupabaseClient`), Web Speech API, `node:test` (Node 24 com type stripping).

**Spec:** `docs/superpowers/specs/2026-09-29-voice-commands-design.md`

## Global Constraints

- Sem dependências novas; sem API paga; sem LLM.
- A voz **nunca grava** no banco: só pré-preenche; o usuário clica em Salvar.
- Senha de colaborador **nunca** é preenchida por voz.
- Código em inglês; textos de UI/toasts em português.
- Arquivos em `layers/1.base/app/utils/voice/` **não** são auto-importados. Importar explicitamente com **extensão `.ts`** entre eles (`./text.ts`, `./types.ts`), porque os testes rodam direto no Node.
- Os arquivos `utils/voice/*.ts` só podem usar **TypeScript apagável** (sem `enum`, `namespace`, parameter properties) e **zero imports de Nuxt/Vue** (precisam rodar em `node --test`).
- O componente fica em `layers/1.base/app/components/VoiceCommandButton.vue` → `<BaseVoiceCommandButton />` (prefixo `Base`, `pathPrefix: true`).
- Payloads **omitem chaves ausentes** (nunca `{ campo: undefined }`).
- Datas no formato `YYYY-MM-DD` (hora local); horários `HH:mm`.
- Placa normalizada: 7 caracteres `A-Z0-9` em maiúsculas, padrão `/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/` (igual ao `normalizePlaca` de `useOficina.ts`; placas são gravadas normalizadas em `veiculos.placa`).
- Commits: Conventional Commits com emoji (`:sparkles: feat(voice): ...`), descrição em inglês, imperativo, minúscula, sem ponto final. Commitar **apenas os arquivos da task** (`git add <paths>`); se aparecer `index.lock`, aguardar 2 s e tentar de novo.
- Verificação: `pnpm test`, `npx nuxt typecheck`, `pnpm lint` (sem erros novos nos arquivos tocados).
- Toda exploração de código começa com `graphify query "<pergunta>"` (rodar na raiz do repo); só depois Read/Grep.

---

## File Structure

| Arquivo | Task | Responsabilidade |
|---|---|---|
| `layers/1.base/app/utils/voice/types.ts` | 1 | Tipos de intent/payload/draft + `VOICE_EXAMPLES` |
| `layers/1.base/app/utils/voice/text.ts` | 1 | Tokenização + extratores puros |
| `layers/1.base/app/utils/voice/text.test.ts` | 1 | Testes dos extratores |
| `package.json` | 1 | Script `test` |
| `layers/1.base/app/utils/voice/parser.ts` | 2 | `parseVoiceCommand` |
| `layers/1.base/app/utils/voice/parser.test.ts` | 2 | Testes do parser |
| `layers/1.base/app/utils/app-routes.ts` | 3 | Adiciona `customersNew`, `vehiclesNew` |
| `layers/1.base/app/composables/useSpeechRecognition.ts` | 3 | Web Speech API |
| `layers/1.base/app/composables/useVoiceDraft.ts` | 3 | Handoff via `useState` |
| `layers/1.base/app/composables/useVoiceLookup.ts` | 3 | Resolver ids no Supabase |
| `layers/1.base/app/composables/useVoiceCommand.ts` | 3 | Orquestração |
| `layers/1.base/app/components/VoiceCommandButton.vue` | 3 | Botão + modal |
| `layers/1.base/app/components/BaseAppHeader.vue` | 3 | Renderiza o botão (desktop + mobile) |
| `customers-new.vue`, `vehicles-new.vue`, `orders-new.vue` | 4 | Consumidores A |
| `scheduling.vue`, `SchedulingFormSlideover.vue`, `scheduling.ts`, `useOrderBudgetPage.ts`, `OrdersBudgetSection.vue`, `orders-[id].vue` | 5 | Consumidores B |
| `finance.vue`, `catalog.vue`, `catalog-suppliers.vue`, `team.vue`, `TeamCollaboratorsCreateForm.vue` | 6 | Consumidores C |

Ordem de execução: **Task 1** → (**Task 2** ∥ **Task 3**) → (**Task 4** ∥ **Task 5** ∥ **Task 6**) → **Task 7**.

---

### Task 1: Tipos + extratores de texto

**Files:**
- Create: `layers/1.base/app/utils/voice/types.ts`
- Create: `layers/1.base/app/utils/voice/text.ts`
- Test: `layers/1.base/app/utils/voice/text.test.ts`
- Modify: `package.json` (scripts)

**Interfaces:**
- Produces (`types.ts`): `VoiceIntent`, `VoicePayloadMap`, `VoiceCommand`, `VoiceDraftMap`, `VOICE_EXAMPLES`, e cada `Voice*Payload`, exatamente como abaixo.
- Produces (`text.ts`): `VoiceToken`, `foldText`, `tokenize`, `joinRaw`, `parseNumber`, `parseMoney`, `parsePlaca`, `parseDigits`, `parseEmail`, `parseDate`, `parseTime`.

- [ ] **Step 1: Criar `types.ts` (conteúdo exato)**

```ts
export type VoiceIntent
  = | 'customer.create'
    | 'vehicle.create'
    | 'order.create'
    | 'appointment.create'
    | 'budgetItem.create'
    | 'account.create'
    | 'catalogItem.create'
    | 'supplier.create'
    | 'collaborator.create'

export type VoiceItemTipo = 'servico' | 'peca' | 'kit'
export type VoicePapel = 'recepcao' | 'mecanico' | 'gerente'

export interface VoiceCustomerPayload {
  nome?: string
  telefones?: string[]
  emails?: string[]
  documento?: string
  observacoes?: string
}

export interface VoiceVehiclePayload {
  placa?: string
  marca?: string
  modelo?: string
  ano?: number
  cor?: string
  km_atual?: number
  observacoes?: string
  clienteNome?: string
}

export interface VoiceOrderPayload {
  placa?: string
  km_entrada?: number
  reclamacao?: string
  diagnostico?: string
  observacoes?: string
}

export interface VoiceAppointmentPayload {
  placa?: string
  date?: string
  startTime?: string
  problema?: string
}

export interface VoiceBudgetItemPayload {
  tipo: VoiceItemTipo
  descricao?: string
  quantidade?: number
  valor_unitario?: number
}

export interface VoiceAccountPayload {
  descricao?: string
  valor?: number
  vencimento?: string
  categoriaNome?: string
  fornecedorNome?: string
  observacoes?: string
}

export interface VoiceCatalogItemPayload {
  tipo: VoiceItemTipo
  nome?: string
  valor_padrao?: number
  custo?: number
  estoque?: number
  horas_estimadas?: number
}

export interface VoiceSupplierPayload {
  nome?: string
  telefone?: string
  email?: string
  observacoes?: string
}

export interface VoiceCollaboratorPayload {
  nome?: string
  username?: string
  papel?: VoicePapel
}

export interface VoicePayloadMap {
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

export type VoiceCommand = {
  [K in VoiceIntent]: { intent: K, payload: VoicePayloadMap[K] }
}[VoiceIntent]

/** Payload já com ids resolvidos, entregue ao formulário de destino. */
export interface VoiceDraftMap {
  'customer.create': VoiceCustomerPayload
  'vehicle.create': VoiceVehiclePayload & { cliente_id?: string }
  'order.create': VoiceOrderPayload & { veiculo_id?: string }
  'appointment.create': VoiceAppointmentPayload & { veiculo_id?: string }
  'budgetItem.create': VoiceBudgetItemPayload & { orderId: string, catalogItemId?: string }
  'account.create': VoiceAccountPayload & { categoria_id?: string, fornecedor_id?: string }
  'catalogItem.create': VoiceCatalogItemPayload
  'supplier.create': VoiceSupplierPayload
  'collaborator.create': VoiceCollaboratorPayload
}

export const VOICE_EXAMPLES: readonly string[] = [
  'novo cliente João da Silva telefone 11 98888 7777',
  'novo veículo placa ABC1D23 marca Fiat modelo Uno ano 2015 cor prata cliente João',
  'nova OS placa ABC1D23 km 45000 reclamação barulho no freio',
  'agendar placa ABC1D23 amanhã às 14h problema revisão',
  'adicionar peça pastilha de freio quantidade 2 valor 150 reais',
  'nova conta energia valor 350 reais vencimento dia 10 categoria luz',
  'novo serviço alinhamento valor 80 reais',
  'novo fornecedor Auto Peças Silva telefone 11 3333 4444',
  'novo colaborador Pedro usuário pedro papel mecânico'
]
```

- [ ] **Step 2: Escrever o teste que falha: `text.test.ts` (conteúdo exato)**

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  foldText,
  joinRaw,
  parseDate,
  parseDigits,
  parseEmail,
  parseMoney,
  parseNumber,
  parsePlaca,
  parseTime,
  tokenize
} from './text.ts'

// Terça-feira, 29/09/2026 10:00 (hora local)
const NOW = new Date(2026, 8, 29, 10, 0)
const t = (text: string) => tokenize(text)

test('foldText lowercases and strips accents', () => {
  assert.equal(foldText('Veículo ÁGUA Três'), 'veiculo agua tres')
})

test('tokenize keeps raw text and strips edge punctuation', () => {
  assert.deepEqual(tokenize('Novo cliente, João.'), [
    { raw: 'Novo', folded: 'novo' },
    { raw: 'cliente', folded: 'cliente' },
    { raw: 'João', folded: 'joao' }
  ])
  assert.deepEqual(tokenize('R$ 1.500,50 às 14:30!').map(token => token.raw), ['R$', '1.500,50', 'às', '14:30'])
  assert.deepEqual(tokenize('   '), [])
})

test('joinRaw rebuilds the original words', () => {
  assert.equal(joinRaw(t('pastilha  de freio')), 'pastilha de freio')
  assert.equal(joinRaw([]), '')
})

test('parseNumber reads digits and pt-BR number words', () => {
  assert.equal(parseNumber(t('45000')), 45000)
  assert.equal(parseNumber(t('45.000')), 45000)
  assert.equal(parseNumber(t('45 mil')), 45000)
  assert.equal(parseNumber(t('cento e cinquenta')), 150)
  assert.equal(parseNumber(t('dois mil e quinze')), 2015)
  assert.equal(parseNumber(t('duas')), 2)
  assert.equal(parseNumber(t('1,5')), 1.5)
  assert.equal(parseNumber(t('de 10 unidades')), 10)
  assert.equal(parseNumber(t('nada')), undefined)
})

test('parseMoney reads reais and centavos', () => {
  assert.equal(parseMoney(t('150 reais')), 150)
  assert.equal(parseMoney(t('R$ 1.500,50')), 1500.5)
  assert.equal(parseMoney(t('80 reais e 50 centavos')), 80.5)
  assert.equal(parseMoney(t('cento e vinte reais')), 120)
  assert.equal(parseMoney(t('de 99,90')), 99.9)
  assert.equal(parseMoney(t('2 mil')), 2000)
  assert.equal(parseMoney(t('grátis')), undefined)
})

test('parsePlaca joins spoken plate pieces', () => {
  assert.equal(parsePlaca(t('ABC1D23')), 'ABC1D23')
  assert.equal(parsePlaca(t('abc-1234')), 'ABC1234')
  assert.equal(parsePlaca(t('abc 1 d 23 amanhã')), 'ABC1D23')
  assert.equal(parsePlaca(t('a bê cê um dê dois três')), 'ABC1D23')
  assert.equal(parsePlaca(t('xyz')), undefined)
  assert.equal(parsePlaca(t('1234567')), undefined)
})

test('parseDigits collects a phone or document number', () => {
  assert.equal(parseDigits(t('11 98888-7777')), '11988887777')
  assert.equal(parseDigits(t('é 11 3333 4444 obrigado')), '1133334444')
  assert.equal(parseDigits(t('um um nove meia')), '1196')
  assert.equal(parseDigits(t('123.456.789-09')), '12345678909')
  assert.equal(parseDigits(t('sem número')), '')
})

test('parseEmail understands arroba and ponto', () => {
  assert.equal(parseEmail(t('joao arroba gmail ponto com')), 'joao@gmail.com')
  assert.equal(parseEmail(t('Maria.Silva@Empresa.com.br')), 'maria.silva@empresa.com.br')
  assert.equal(parseEmail(t('joao underline silva arroba uol ponto com ponto br')), 'joao_silva@uol.com.br')
  assert.equal(parseEmail(t('joao gmail')), undefined)
})

test('parseDate finds relative and absolute dates', () => {
  assert.equal(parseDate(t('hoje'), NOW), '2026-09-29')
  assert.equal(parseDate(t('amanhã às 14h'), NOW), '2026-09-30')
  assert.equal(parseDate(t('depois de amanhã'), NOW), '2026-10-01')
  assert.equal(parseDate(t('sexta-feira'), NOW), '2026-10-02')
  assert.equal(parseDate(t('na terça'), NOW), '2026-10-06')
  assert.equal(parseDate(t('domingo'), NOW), '2026-10-04')
  assert.equal(parseDate(t('dia 10'), NOW), '2026-10-10')
  assert.equal(parseDate(t('dia 30'), NOW), '2026-09-30')
  assert.equal(parseDate(t('dia dez'), NOW), '2026-10-10')
  assert.equal(parseDate(t('dia 5 de outubro'), NOW), '2026-10-05')
  assert.equal(parseDate(t('5 de outubro'), NOW), '2026-10-05')
  assert.equal(parseDate(t('dia 3 de janeiro'), NOW), '2027-01-03')
  assert.equal(parseDate(t('10/10'), NOW), '2026-10-10')
  assert.equal(parseDate(t('15/01/2027'), NOW), '2027-01-15')
  assert.equal(parseDate(t('sem data'), NOW), undefined)
})

test('parseTime finds spoken times', () => {
  assert.equal(parseTime(t('às 14h')), '14:00')
  assert.equal(parseTime(t('14h30')), '14:30')
  assert.equal(parseTime(t('14:30')), '14:30')
  assert.equal(parseTime(t('14 horas')), '14:00')
  assert.equal(parseTime(t('às 9 e meia')), '09:30')
  assert.equal(parseTime(t('2 da tarde')), '14:00')
  assert.equal(parseTime(t('8 da noite')), '20:00')
  assert.equal(parseTime(t('9 da manhã')), '09:00')
  assert.equal(parseTime(t('meio-dia')), '12:00')
  assert.equal(parseTime(t('meio dia e meia')), '12:30')
  assert.equal(parseTime(t('às duas e quinze da tarde')), '14:15')
  assert.equal(parseTime(t('dia 5 de outubro às 9 e meia')), '09:30')
  assert.equal(parseTime(t('dia 10')), undefined)
})
```

- [ ] **Step 3: Adicionar o script de teste ao `package.json`**

Em `"scripts"`, adicionar (depois de `"typecheck"`):

```json
"test": "node --test \"shared/**/*.test.ts\" \"layers/**/*.test.ts\""
```

- [ ] **Step 4: Rodar o teste e ver falhar**

Run: `node --test layers/1.base/app/utils/voice/text.test.ts`
Expected: FAIL (`Cannot find module .../text.ts`).

- [ ] **Step 5: Implementar `text.ts`**

Exports e regras (implementação livre, respeitando os Global Constraints):

```ts
export interface VoiceToken { raw: string, folded: string }
export function foldText(value: string): string
export function tokenize(text: string): VoiceToken[]
export function joinRaw(tokens: VoiceToken[]): string
export function parseNumber(tokens: VoiceToken[]): number | undefined
export function parseMoney(tokens: VoiceToken[]): number | undefined
export function parsePlaca(tokens: VoiceToken[]): string | undefined
export function parseDigits(tokens: VoiceToken[]): string
export function parseEmail(tokens: VoiceToken[]): string | undefined
export function parseDate(tokens: VoiceToken[], now: Date): string | undefined
export function parseTime(tokens: VoiceToken[]): string | undefined
```

- `foldText`: `toLowerCase()` + `normalize('NFD')` + remove `\p{Diacritic}` (`/[\u0300-\u036f]/g`).
- `tokenize`: separa por espaços; remove das **bordas** de cada token os caracteres `.,!?;:"'()`; descarta tokens vazios; `folded = foldText(raw)`.
- `joinRaw`: `tokens.map(t => t.raw).join(' ')`.
- Palavras numéricas (folded): `zero 0, um/uma 1, dois/duas 2, tres 3, quatro 4, cinco 5, seis 6, sete 7, oito 8, nove 9, dez 10, onze 11, doze 12, treze 13, quatorze/catorze 14, quinze 15, dezesseis 16, dezessete 17, dezoito 18, dezenove 19, vinte 20, trinta 30, quarenta 40, cinquenta 50, sessenta 60, setenta 70, oitenta 80, noventa 90, cem/cento 100, duzentos/duzentas 200, trezentos 300, quatrocentos 400, quinhentos 500, seiscentos 600, setecentos 700, oitocentos 800, novecentos 900`; `mil` multiplica o acumulado (ou vale 1000 sozinho); `e` entre palavras numéricas é conector.
- Token numérico: `/^\d+([.,]\d+)*$/`. Formato pt-BR: `.` seguido de exatamente 3 dígitos é milhar; `,` é decimal (`1.500,50` → 1500.5; `45.000` → 45000; `1,5` → 1.5).
- `parseNumber`: pula tokens iniciais que não são número; lê a **primeira sequência numérica** (dígitos ou palavras + `e` + `mil`, ex.: `45 mil`, `dois mil e quinze`) e para no primeiro token não numérico.
- `parseMoney`: ignora `r$`/`reais`/`real`; lê o número de reais com `parseNumber`; se vier `e <n> centavos` depois de `reais`, soma `n/100`. Arredondar a 2 casas.
- `parsePlaca`: percorre os tokens do início acumulando caracteres até 7: token alfanumérico → seus caracteres `[A-Z0-9]` em maiúsculas; dígito por extenso (`zero..nove`, `um/uma`, `dois/duas`, `meia`=6) → dígito; nome de letra (folded: `a be ce de e efe ge aga i jota ka ele eme ene o pe que erre esse te u ve dablio xis ipsilon ze`) → letra. Para ao chegar em 7 ou no primeiro token que não contribui. Retorna só se tiver 7 caracteres e casar com `/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/`.
- `parseDigits`: pula tokens iniciais sem dígito; depois coleta enquanto o token for "digitoso" (só `[0-9().\-/+]` e contém dígito) ou dígito por extenso (`zero..nove`, `um/uma`, `dois/duas`, `meia`=6); concatena só os dígitos; para no primeiro token diferente.
- `parseEmail`: junta os `folded` sem espaços, trocando os tokens `arroba`→`@`, `ponto`→`.`, `underline|underscore`→`_`, `hifen|traco`→`-`; valida com `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`; senão `undefined`. (Usar `folded`, que já está em minúsculas.)
- `parseDate(tokens, now)`: procura a **primeira** expressão de data em qualquer posição, nesta ordem de reconhecimento em cada posição:
  1. `depois de amanha` → now+2; `amanha` → now+1; `hoje` → now.
  2. Dia da semana (`segunda terca quarta quinta sexta sabado domingo`, aceitando sufixo `-feira`, comparar com `startsWith`): próxima ocorrência **estritamente futura** (1–7 dias).
  3. `dd/mm` ou `dd/mm/aaaa`: sem ano → ano atual; se a data já passou (antes de hoje) → ano seguinte.
  4. `[dia] <n> de <mes>` (mes: `janeiro..dezembro`, folded; `<n>` em dígitos ou por extenso): ano atual; se já passou → ano seguinte.
  5. `dia <n>` (sem mês): se `n >= dia de hoje` → mês atual, senão mês seguinte.
  Dia inexistente no mês resultante → `undefined`. Formatar `YYYY-MM-DD` com a data local.
- `parseTime(tokens)`: procura a **primeira** hora válida em qualquer posição. Um candidato é reconhecido quando: token `/^(\d{1,2})h(\d{2})?$/`; ou `/^(\d{1,2}):(\d{2})$/`; ou `meio-dia` / `meio dia` (12); ou um número (dígitos ou por extenso ≤ 23) que é **precedido** por `as`/`a` (folded de "às") **ou seguido** por `hora|horas|h|da tarde|da manha|da noite|da madrugada|e meia|e <minutos>`. Minutos: `e meia` → 30; `e <n>` (n ≤ 59, dígitos ou por extenso) → n. Período: `da tarde`/`da noite` soma 12 se hora < 12. Formatar `HH:mm` com zero à esquerda. Número sem esses marcadores (ex.: `dia 10`) **não** é hora.

- [ ] **Step 6: Rodar os testes e ver passar**

Run: `pnpm test`
Expected: PASS (todos, incluindo os 6 testes existentes).

- [ ] **Step 7: Commit**

```bash
git add layers/1.base/app/utils/voice/types.ts layers/1.base/app/utils/voice/text.ts layers/1.base/app/utils/voice/text.test.ts package.json
git commit -m ":sparkles: feat(voice): add voice types and pt-BR text extractors"
```

---

### Task 2: Parser de comandos

**Files:**
- Create: `layers/1.base/app/utils/voice/parser.ts`
- Test: `layers/1.base/app/utils/voice/parser.test.ts`

**Interfaces:**
- Consumes: tudo de `./text.ts` e os tipos de `./types.ts` (Task 1).
- Produces: `export function parseVoiceCommand(text: string, now?: Date): VoiceCommand | null` (`now` padrão `new Date()`).

- [ ] **Step 1: Escrever o teste que falha: `parser.test.ts` (conteúdo exato)**

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { parseVoiceCommand } from './parser.ts'

// Terça-feira, 29/09/2026 10:00 (hora local)
const NOW = new Date(2026, 8, 29, 10, 0)
const parse = (text: string) => parseVoiceCommand(text, NOW)

test('returns null for unrelated or empty speech', () => {
  assert.equal(parse('bom dia tudo bem'), null)
  assert.equal(parse(''), null)
  assert.equal(parse('   '), null)
})

test('customer.create', () => {
  assert.deepEqual(parse('Novo cliente João da Silva telefone 11 98888-7777 email joao arroba gmail ponto com cpf 123.456.789-09.'), {
    intent: 'customer.create',
    payload: { nome: 'João da Silva', telefones: ['11988887777'], emails: ['joao@gmail.com'], documento: '12345678909' }
  })
  assert.deepEqual(parse('novo cliente'), { intent: 'customer.create', payload: {} })
  assert.deepEqual(parse('cadastrar cliente Ana celular 11 91111 2222 whatsapp 11 93333 4444 observação prefere manhã'), {
    intent: 'customer.create',
    payload: { nome: 'Ana', telefones: ['11911112222', '11933334444'], observacoes: 'prefere manhã' }
  })
})

test('vehicle.create', () => {
  assert.deepEqual(parse('novo veículo placa ABC1D23 marca Fiat modelo Uno ano 2015 cor prata km 45 mil cliente Maria Souza'), {
    intent: 'vehicle.create',
    payload: { placa: 'ABC1D23', marca: 'Fiat', modelo: 'Uno', ano: 2015, cor: 'prata', km_atual: 45000, clienteNome: 'Maria Souza' }
  })
  assert.deepEqual(parse('novo carro placa abc 1234 dono José'), {
    intent: 'vehicle.create',
    payload: { placa: 'ABC1234', clienteNome: 'José' }
  })
})

test('order.create', () => {
  assert.deepEqual(parse('nova OS placa abc 1 d 23 km 45000 reclamação barulho no freio'), {
    intent: 'order.create',
    payload: { placa: 'ABC1D23', km_entrada: 45000, reclamacao: 'barulho no freio' }
  })
  assert.deepEqual(parse('abrir ordem de serviço placa ABC1D23 problema motor falhando diagnóstico vela observação cliente aguarda'), {
    intent: 'order.create',
    payload: { placa: 'ABC1D23', reclamacao: 'motor falhando', diagnostico: 'vela', observacoes: 'cliente aguarda' }
  })
})

test('appointment.create', () => {
  assert.deepEqual(parse('agendar placa ABC1D23 amanhã às 14h problema revisão'), {
    intent: 'appointment.create',
    payload: { placa: 'ABC1D23', date: '2026-09-30', startTime: '14:00', problema: 'revisão' }
  })
  assert.deepEqual(parse('novo agendamento placa ABC1D23 sexta às 2 da tarde'), {
    intent: 'appointment.create',
    payload: { placa: 'ABC1D23', date: '2026-10-02', startTime: '14:00' }
  })
  assert.deepEqual(parse('marcar placa ABC1D23 dia 5 de outubro às 9 e meia serviço troca de óleo'), {
    intent: 'appointment.create',
    payload: { placa: 'ABC1D23', date: '2026-10-05', startTime: '09:30', problema: 'troca de óleo' }
  })
})

test('budgetItem.create', () => {
  assert.deepEqual(parse('adicionar peça pastilha de freio quantidade 2 valor 150 reais'), {
    intent: 'budgetItem.create',
    payload: { tipo: 'peca', descricao: 'pastilha de freio', quantidade: 2, valor_unitario: 150 }
  })
  assert.deepEqual(parse('incluir serviço alinhamento valor 80 reais e 50 centavos'), {
    intent: 'budgetItem.create',
    payload: { tipo: 'servico', descricao: 'alinhamento', valor_unitario: 80.5 }
  })
  assert.deepEqual(parse('adicionar kit'), { intent: 'budgetItem.create', payload: { tipo: 'kit' } })
  assert.deepEqual(parse('adicionar item lavagem'), { intent: 'budgetItem.create', payload: { tipo: 'servico', descricao: 'lavagem' } })
})

test('account.create', () => {
  assert.deepEqual(parse('nova conta energia elétrica valor 350 reais vencimento dia 10 categoria luz fornecedor Enel'), {
    intent: 'account.create',
    payload: { descricao: 'energia elétrica', valor: 350, vencimento: '2026-10-10', categoriaNome: 'luz', fornecedorNome: 'Enel' }
  })
  assert.deepEqual(parse('nova conta a pagar aluguel valor 2 mil vence dia 5 de outubro'), {
    intent: 'account.create',
    payload: { descricao: 'aluguel', valor: 2000, vencimento: '2026-10-05' }
  })
})

test('catalogItem.create', () => {
  assert.deepEqual(parse('novo serviço alinhamento valor 80 reais horas 1'), {
    intent: 'catalogItem.create',
    payload: { tipo: 'servico', nome: 'alinhamento', valor_padrao: 80, horas_estimadas: 1 }
  })
  assert.deepEqual(parse('nova peça filtro de óleo custo 20 valor 45 estoque 10'), {
    intent: 'catalogItem.create',
    payload: { tipo: 'peca', nome: 'filtro de óleo', custo: 20, valor_padrao: 45, estoque: 10 }
  })
})

test('supplier.create', () => {
  assert.deepEqual(parse('novo fornecedor Auto Peças Silva telefone 11 3333 4444 email vendas arroba silva ponto com'), {
    intent: 'supplier.create',
    payload: { nome: 'Auto Peças Silva', telefone: '1133334444', email: 'vendas@silva.com' }
  })
})

test('collaborator.create never includes a password', () => {
  assert.deepEqual(parse('novo colaborador Pedro Santos usuário pedro papel mecânico'), {
    intent: 'collaborator.create',
    payload: { nome: 'Pedro Santos', username: 'pedro', papel: 'mecanico' }
  })
  assert.deepEqual(parse('nova funcionária Ana Lima cargo recepcionista'), {
    intent: 'collaborator.create',
    payload: { nome: 'Ana Lima', papel: 'recepcao' }
  })
  assert.deepEqual(parse('novo colaborador Pedro senha 1234'), {
    intent: 'collaborator.create',
    payload: { nome: 'Pedro senha 1234' }
  })
})

test('trigger disambiguation', () => {
  assert.equal(parse('adicionar serviço troca de óleo')?.intent, 'budgetItem.create')
  assert.equal(parse('cadastrar serviço troca de óleo')?.intent, 'catalogItem.create')
  assert.equal(parse('novo veículo placa ABC1D23 cliente Maria')?.intent, 'vehicle.create')
  assert.equal(parse('nova ordem de serviço placa ABC1D23')?.intent, 'order.create')
})

test('leading filler before the trigger is ignored', () => {
  assert.deepEqual(parse('por favor novo cliente Carlos'), { intent: 'customer.create', payload: { nome: 'Carlos' } })
})

test('plate spelled letter by letter', () => {
  assert.deepEqual(parse('nova os placa a bê cê um dê dois três'), {
    intent: 'order.create',
    payload: { placa: 'ABC1D23' }
  })
})
```

Observação sobre o último caso de colaborador: `senha` **não** é palavra-chave, então o texto vai inteiro para `nome`. O usuário vê e corrige no formulário, e nenhuma senha é preenchida.

- [ ] **Step 2: Rodar e ver falhar**

Run: `node --test layers/1.base/app/utils/voice/parser.test.ts`
Expected: FAIL (`Cannot find module .../parser.ts`).

- [ ] **Step 3: Implementar `parser.ts`**

Algoritmo:

1. `tokens = tokenize(text)`; vazio → `null`.
2. **Detecção de gatilho**: para cada posição `i` (da esquerda para a direita), testar todos os gatilhos (sequências de palavras *folded*) que começam em `i`; o primeiro `i` com match vence e, dentro dele, o gatilho **mais longo**. Nenhum match → `null`. `rest = tokens.slice(fimDoGatilho)`.
3. **Gatilhos** (folded):
   - `customer.create`: `novo cliente`, `nova cliente`, `cliente novo`, `cadastrar cliente`, `cadastra cliente`, `criar cliente`
   - `vehicle.create`: `novo veiculo`, `novo carro`, `nova moto`, `cadastrar veiculo`, `cadastra veiculo`, `criar veiculo`, `cadastrar carro`, `cadastra carro`
   - `order.create`: `nova ordem de servico`, `nova ordem`, `nova os`, `abrir ordem de servico`, `abre ordem de servico`, `abrir ordem`, `abre ordem`, `abrir os`, `abre os`, `criar os`
   - `appointment.create`: `novo agendamento`, `criar agendamento`, `agendar`, `marcar`
   - `budgetItem.create`: verbo `adicionar|adiciona|incluir|inclui|lancar|lanca` + `peca|servico|kit|item` → `tipo` = `peca|servico|kit`, e `item` → `servico`
   - `account.create`: `nova conta a pagar`, `conta a pagar`, `nova conta`, `nova despesa`, `lancar conta`, `cadastrar conta`
   - `catalogItem.create`: `novo|nova|cadastrar|cadastra|criar` + `servico|peca|kit` → `tipo`
   - `supplier.create`: `novo fornecedor`, `cadastrar fornecedor`, `cadastra fornecedor`, `criar fornecedor`
   - `collaborator.create`: `novo colaborador`, `nova colaboradora`, `novo funcionario`, `nova funcionaria`, `cadastrar colaborador`, `cadastrar funcionario`
4. **Segmentação** de `rest` pelas palavras-chave do intent (folded; multi-palavra primeiro, ex.: `e mail`). Cada palavra-chave abre um segmento até a próxima. Os tokens antes da primeira palavra-chave formam o **segmento padrão**. Uma palavra-chave repetida gera vários segmentos (necessário para vários telefones).
5. **Campos por intent** (`palavras-chave → campo : extrator`); `texto` = `joinRaw(seg)` (trim; vazio = ausente):

| Intent | Segmento padrão | Palavras-chave → campo : extrator |
|---|---|---|
| customer | `nome` : texto | `nome`→nome:texto · `telefone|celular|whatsapp|fone|zap`→telefones (push `parseDigits`, se não vazio) · `email|e-mail|e mail`→emails (push `parseEmail`) · `cpf|cnpj|documento`→documento:`parseDigits` · `observacao|observacoes|obs`→observacoes:texto |
| vehicle | ignorado | `placa`→placa:`parsePlaca` · `marca`→marca:texto · `modelo`→modelo:texto · `ano`→ano:`parseNumber` · `cor`→cor:texto · `km|quilometragem|quilometros`→km_atual:`parseNumber` · `cliente|dono|proprietario|proprietaria`→clienteNome:texto · `observacao|observacoes|obs`→observacoes:texto |
| order | ignorado | `placa`→placa:`parsePlaca` · `km|quilometragem|quilometros`→km_entrada:`parseNumber` · `reclamacao|relato|problema|defeito|queixa`→reclamacao:texto · `diagnostico`→diagnostico:texto · `observacao|observacoes|obs`→observacoes:texto |
| appointment | ignorado | `placa`→placa:`parsePlaca` · `problema|servico|motivo|reclamacao`→problema:texto. Além disso: `date = parseDate(tokensAntesDoSegmentoProblema, now)`, `startTime = parseTime(tokensAntesDoSegmentoProblema)` (todos os tokens de `rest` que não pertencem ao segmento `problema`) |
| budgetItem | `descricao` : texto | `descricao`→descricao:texto · `quantidade|qtd|qtde`→quantidade:`parseNumber` · `valor|preco`→valor_unitario:`parseMoney` |
| account | `descricao` : texto | `descricao`→descricao:texto · `valor`→valor:`parseMoney` · `vencimento|vence|vencendo`→vencimento:`parseDate(seg, now)` · `categoria`→categoriaNome:texto · `fornecedor`→fornecedorNome:texto · `observacao|observacoes|obs`→observacoes:texto |
| catalogItem | `nome` : texto | `nome`→nome:texto · `valor|preco`→valor_padrao:`parseMoney` · `custo`→custo:`parseMoney` · `estoque`→estoque:`parseNumber` · `horas|hora|tempo`→horas_estimadas:`parseNumber` |
| supplier | `nome` : texto | `nome`→nome:texto · `telefone|celular|whatsapp|fone`→telefone:`parseDigits` · `email|e-mail|e mail`→email:`parseEmail` · `observacao|observacoes|obs`→observacoes:texto |
| collaborator | `nome` : texto | `nome`→nome:texto · `usuario|login|username`→username: `foldText(joinRaw(seg))` sem caracteres fora de `[a-z0-9._]` · `papel|cargo|funcao`→papel: folded contém `recep`→`recepcao`, `mecan`→`mecanico`, `gerent`→`gerente`, senão ausente |

6. Omitir campos `undefined`, strings vazias e arrays vazios. `budgetItem` e `catalogItem` sempre têm `tipo`.
7. Retornar `{ intent, payload }` (tipado como `VoiceCommand`).

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm test`
Expected: PASS (todos).

- [ ] **Step 5: Commit**

```bash
git add layers/1.base/app/utils/voice/parser.ts layers/1.base/app/utils/voice/parser.test.ts
git commit -m ":sparkles: feat(voice): parse pt-BR voice commands into intents"
```

---

### Task 3: Runtime de voz (composables, botão, header)

**Files:**
- Modify: `layers/1.base/app/utils/app-routes.ts`
- Create: `layers/1.base/app/composables/useSpeechRecognition.ts`
- Create: `layers/1.base/app/composables/useVoiceDraft.ts`
- Create: `layers/1.base/app/composables/useVoiceLookup.ts`
- Create: `layers/1.base/app/composables/useVoiceCommand.ts`
- Create: `layers/1.base/app/components/VoiceCommandButton.vue`
- Modify: `layers/1.base/app/components/BaseAppHeader.vue`

**Interfaces:**
- Consumes: `VoiceIntent`, `VoiceDraftMap`, `VoiceCommand`, `VOICE_EXAMPLES` de `../utils/voice/types.ts` (Task 1). `parseVoiceCommand` de `../utils/voice/parser.ts` (Task 2, que roda **em paralelo**: importe pelo caminho e assinatura acima. Se o arquivo ainda não existir quando você rodar o typecheck, crie um stub temporário **não commitado** ou rode o typecheck no fim, depois que a Task 2 commitar. Não commite `parser.ts`).
- Produces (usados pelas Tasks 4–6):

```ts
// useVoiceDraft.ts
export function useVoiceDraft(): {
  setVoiceDraft: <K extends VoiceIntent>(intent: K, draft: VoiceDraftMap[K]) => void
  clearVoiceDraft: () => void
  onVoiceDraft: <K extends VoiceIntent>(intent: K, handler: (draft: VoiceDraftMap[K]) => void) => void
}
```

- [ ] **Step 1: `app-routes.ts`**: adicionar `customersNew: '/clientes/novo'` e `vehiclesNew: '/veiculos/novo'` ao objeto `APP_ROUTES` (manter `as const`).

- [ ] **Step 2: `useVoiceDraft.ts`**

```ts
import type { VoiceDraftMap, VoiceIntent } from '../utils/voice/types'

type PendingVoiceDraft = { intent: VoiceIntent, draft: VoiceDraftMap[VoiceIntent] }

export function useVoiceDraft() {
  const pending = useState<PendingVoiceDraft | null>('voice-draft', () => null)

  function setVoiceDraft<K extends VoiceIntent>(intent: K, draft: VoiceDraftMap[K]) {
    pending.value = { intent, draft }
  }

  function clearVoiceDraft() {
    pending.value = null
  }

  function onVoiceDraft<K extends VoiceIntent>(intent: K, handler: (draft: VoiceDraftMap[K]) => void) {
    watch(pending, (value) => {
      if (!value || value.intent !== intent) return
      pending.value = null
      handler(value.draft as VoiceDraftMap[K])
    }, { immediate: true })
  }

  return { setVoiceDraft, clearVoiceDraft, onVoiceDraft }
}
```

- [ ] **Step 3: `useSpeechRecognition.ts`**

Retorna `{ supported: Ref<boolean>, listening: Ref<boolean>, transcript: Ref<string>, error: Ref<string | null>, start(): void, stop(): void, onFinal(cb: (text: string) => void): void }`.
- `supported` é definido em `onMounted` (`'SpeechRecognition' in window || 'webkitSpeechRecognition' in window`), para evitar erro de hidratação.
- Declarar interfaces mínimas locais (`SpeechRecognitionLike`, eventos) em vez de depender de `lib.dom`; usar `(window as unknown as { SpeechRecognition?: ..., webkitSpeechRecognition?: ... })`.
- `start()`: nova instância, `lang = 'pt-BR'`, `interimResults = true`, `continuous = false`, `maxAlternatives = 1`; `onresult` junta todos os `results[i][0].transcript` em `transcript`; `onerror`: `not-allowed|service-not-allowed` → `'Permita o acesso ao microfone para usar comandos de voz.'`, `no-speech` → `'Não ouvi nada. Tente de novo.'`, `aborted` → ignora, outros → `'Não foi possível usar o microfone.'`; `onend` → `listening = false` e, se não houve erro e `transcript.trim()`, chama os callbacks `onFinal`.
- `stop()` chama `recognition.stop()`; `onScopeDispose` chama `abort()`.

- [ ] **Step 4: `useVoiceLookup.ts`**

```ts
export function useVoiceLookup() {
  // usa useTypedSupabaseClient(), normalizePlaca (useOficina) e sanitizeIlikeTerm/ilikePattern (supabase-search)
  async function findVehicleIdByPlaca(placa: string): Promise<string | undefined>
  async function findUniqueIdByName(
    table: 'clientes' | 'fornecedores' | 'financeiro_categorias' | 'servicos_catalogo',
    name: string,
    filters?: { tipo?: string }
  ): Promise<string | undefined>
  return { findVehicleIdByPlaca, findUniqueIdByName }
}
```

- `findVehicleIdByPlaca`: `from('veiculos').select('id').eq('placa', normalizePlaca(placa)).maybeSingle()` → `data?.id`.
- `findUniqueIdByName`: `select('id, nome').eq('ativo', true).ilike('nome', ilikePattern(name)).limit(5)` (+ `.eq('tipo', filters.tipo)` se houver). Se algum resultado tem `foldText(nome) === foldText(name)` (import de `../utils/voice/text.ts`) → esse id; senão, se houver exatamente 1 resultado → o id dele; caso contrário `undefined`. Padrão vazio → `undefined`. Em erro do Supabase → `undefined` (o formulário abre sem o campo).

- [ ] **Step 5: `useVoiceCommand.ts`**

```ts
export type VoiceRunResult
  = | { ok: true, intent: VoiceIntent }
    | { ok: false, reason: 'not_understood' | 'forbidden' | 'context' }

export function useVoiceCommand(): { run: (text: string) => Promise<VoiceRunResult> }
```

Mapa (constante no arquivo):

| intent | permission | path |
|---|---|---|
| `customer.create` | `customers.write` | `APP_ROUTES.customersNew` |
| `vehicle.create` | `vehicles.write` | `APP_ROUTES.vehiclesNew` |
| `order.create` | `orders.create` | `APP_ROUTES.ordersNew` |
| `appointment.create` | `scheduling.write` | `APP_ROUTES.scheduling` |
| `budgetItem.create` | `budget.edit` | rota atual |
| `account.create` | `finance.view` | `APP_ROUTES.finance` |
| `catalogItem.create` | `catalog.manage` | `APP_ROUTES.catalog` |
| `supplier.create` | `catalog.manage` | `APP_ROUTES.catalogSuppliers` |
| `collaborator.create` | `collaborators.manage` | `APP_ROUTES.team` |

`run(text)`:
1. `command = parseVoiceCommand(text)`; `null` → `{ ok: false, reason: 'not_understood' }`.
2. `!can(permission)` (de `usePermissions()`) → toast `{ title: 'Sem permissão', description: 'Seu perfil não pode criar este tipo de registro.', color: 'warning' }` e `{ ok: false, reason: 'forbidden' }`.
3. `budgetItem.create`: exige `route.path` casando com `/^\/ordens\/(?!novo$)[^/]+$/`; senão toast `{ title: 'Abra uma OS', description: 'Para adicionar itens por voz, abra a ordem de serviço primeiro.', color: 'warning' }` e `{ ok: false, reason: 'context' }`. `orderId = String(route.params.id)`.
4. Resolver ids (acumulando avisos `string[]`):
   - vehicle: `clienteNome` → `cliente_id` via `findUniqueIdByName('clientes', ...)`; se falhar, aviso `Cliente "<nome>" não encontrado.`
   - order / appointment: `placa` → `veiculo_id` via `findVehicleIdByPlaca`; se falhar, aviso `Placa <formatPlaca(placa)> não encontrada.`
   - budgetItem: `descricao` → `catalogItemId` via `findUniqueIdByName('servicos_catalogo', descricao, { tipo })` (sem aviso quando falha: vira item livre).
   - account: `categoriaNome` → `categoria_id` (`financeiro_categorias`), `fornecedorNome` → `fornecedor_id` (`fornecedores`); avisos `Categoria "<x>" não encontrada.` / `Fornecedor "<x>" não encontrado.`
5. `setVoiceDraft(intent, draft)` e depois `await navigateTo(path)` (se `path !== route.path`). Depois, se `route.path !== path`, a navegação foi bloqueada: `clearVoiceDraft()` e retornar `{ ok: false, reason: 'context' }`.
6. Toast `{ title: 'Formulário preenchido por voz', description: 'Confira os dados e salve.', color: 'info', icon: 'i-lucide-mic' }`; para cada aviso, toast `{ title: aviso, color: 'warning' }`. Retornar `{ ok: true, intent }`.

- [ ] **Step 6: `VoiceCommandButton.vue`** (`<BaseVoiceCommandButton />`)

- `defineOptions({ name: 'BaseVoiceCommandButton' })`.
- Botão: `UButton` `icon="i-lucide-mic"`, `color="neutral"`, `variant="ghost"`, `class="rounded-full"`, `aria-label="Comando de voz"`; aceita repassar `class`/attrs.
- Clique → `open = true`; limpa texto/erro/alerta; se `supported`, `start()`.
- `UModal` `title="Comando de voz"` `description="Diga o que quer cadastrar. O formulário abre preenchido para você conferir."`:
  - Indicador "Ouvindo…" (ícone `i-lucide-audio-lines` com `animate-pulse`) quando `listening`.
  - `UTextarea` `v-model="text"` (espelha `transcript` enquanto ouve), `autoresize`, placeholder `Ex.: novo cliente João telefone 11 98888 7777`, `class="w-full"`.
  - Quando `!supported`: `UAlert` neutro `Seu navegador não suporta reconhecimento de voz. Digite o comando.`
  - `UAlert` de erro para `error` do microfone e para "não entendi" (`Não entendi o comando. Veja os exemplos abaixo.`).
  - `UCollapsible` / lista "Exemplos" com `VOICE_EXAMPLES`; clicar num exemplo coloca o texto no textarea.
  - Rodapé: botão `Ouvir de novo`/`Parar` (`i-lucide-mic` / `i-lucide-square`, só se `supported`) e botão primário `Preencher` (`:disabled="!text.trim()"`, `:loading="running"`).
- `onFinal(text => submit(text))`. `submit` chama `run`; `ok` → fecha o modal; `not_understood` → mostra o alerta; `forbidden`/`context` → fecha o modal (o toast já explica).
- Fechar o modal chama `stop()`.

- [ ] **Step 7: `BaseAppHeader.vue`**

- Desktop: inserir `<BaseVoiceCommandButton />` dentro da pill, **antes** do `<USeparator orientation="vertical" ... />`.
- Mobile: depois do `<nav ... sm:hidden>`, adicionar:

```vue
<div class="fixed right-4 z-50 sm:hidden bottom-[calc(4.5rem+env(safe-area-inset-bottom))]">
  <BaseVoiceCommandButton
    variant="solid"
    color="primary"
    size="xl"
    class="shadow-lg"
  />
</div>
```

(O botão aceita `variant`/`color`/`size` como props repassadas ao `UButton`, com padrões `ghost`/`neutral`/`md`.)

- [ ] **Step 8: Verificar**

Run: `npx nuxt typecheck` (depois que `parser.ts` da Task 2 estiver commitado) e `pnpm lint`.
Expected: sem erros nos arquivos da task.

- [ ] **Step 9: Commit**

```bash
git add layers/1.base/app/utils/app-routes.ts layers/1.base/app/composables/useSpeechRecognition.ts layers/1.base/app/composables/useVoiceDraft.ts layers/1.base/app/composables/useVoiceLookup.ts layers/1.base/app/composables/useVoiceCommand.ts layers/1.base/app/components/VoiceCommandButton.vue layers/1.base/app/components/BaseAppHeader.vue
git commit -m ":sparkles: feat(voice): add global voice command button and runtime"
```

---

### Task 4: Consumidores A: cliente, veículo, OS

**Files:**
- Modify: `layers/4.customers/app/pages/customers-new.vue`
- Modify: `layers/10.vehicles/app/pages/vehicles-new.vue`
- Modify: `layers/5.orders/app/pages/orders-new.vue`

**Interfaces:**
- Consumes: `useVoiceDraft().onVoiceDraft(intent, handler)` (auto-import da `1.base`), `VoiceDraftMap` (inferido). Helpers: `formatPhoneBr`, `formatDocumento` (`layers/4.customers/app/utils/customer-form.ts`), `formatPlacaInput` (`layers/10.vehicles/app/utils/vehicle-form.ts`), `normalizeContactList` (`shared/utils/contact.ts`).
- Produces: nada.

Regra comum: só sobrescrever campos **presentes** no draft. A baseline de "dirty" (`initialState`) continua vazia, então o modal de descarte avisa se o usuário sair sem salvar.

- [ ] **Step 1: `customers-new.vue`**: depois de obter `state` (via `useCustomerForm()`):

```ts
const { onVoiceDraft } = useVoiceDraft()
onVoiceDraft('customer.create', (draft) => {
  if (draft.nome) state.nome = draft.nome
  if (draft.telefones?.length) state.telefones = normalizeContactList(draft.telefones.map(formatPhoneBr))
  if (draft.emails?.length) state.emails = normalizeContactList(draft.emails)
  if (draft.documento) state.documento = formatDocumento(draft.documento)
  if (draft.observacoes) state.observacoes = draft.observacoes
})
```

(Adapte os imports ao que o arquivo já usa; se `state.telefones` for gerenciado de outro jeito em `CustomersFormFields.vue`, siga esse padrão.)

- [ ] **Step 2: `vehicles-new.vue`**: tornar reativo o `preferredId` passado a `useCustomerOptions` (hoje `() => clienteId || undefined`): criar `const preferredClienteId = ref(clienteId)` e passar `() => preferredClienteId.value || undefined`. Depois:

```ts
onVoiceDraft('vehicle.create', (draft) => {
  if (draft.cliente_id) {
    preferredClienteId.value = draft.cliente_id
    state.cliente_id = draft.cliente_id
  }
  if (draft.placa) state.placa = formatPlacaInput(draft.placa)
  if (draft.marca) state.marca = draft.marca
  if (draft.modelo) state.modelo = draft.modelo
  if (draft.ano != null) state.ano = draft.ano
  if (draft.cor) state.cor = draft.cor
  if (draft.km_atual != null) state.km_atual = draft.km_atual
  if (draft.observacoes) state.observacoes = draft.observacoes
})
```

- [ ] **Step 3: `orders-new.vue`**: tornar reativo o `preferredVeiculoId` passado a `useOrderVehicleOptions` (ele aceita `MaybeRefOrGetter`), mantendo a lógica atual de agendamento/query como valor inicial (ex.: `const voiceVeiculoId = ref('')` e `preferredId: () => voiceVeiculoId.value || <valor atual>`). Depois:

```ts
onVoiceDraft('order.create', (draft) => {
  if (draft.veiculo_id) {
    voiceVeiculoId.value = draft.veiculo_id
    state.veiculo_id = draft.veiculo_id
  }
  if (draft.km_entrada != null) state.km_entrada = draft.km_entrada
  if (draft.reclamacao) state.reclamacao = draft.reclamacao
  if (draft.diagnostico) state.diagnostico = draft.diagnostico
  if (draft.observacoes) state.observacoes = draft.observacoes
})
```

Registre o `onVoiceDraft` **depois** do redirect de agendamento já vinculado (para não consumir o draft numa página que vai redirecionar).

- [ ] **Step 4: Verificar**

Run: `npx nuxt typecheck` e `pnpm exec eslint layers/4.customers/app/pages/customers-new.vue layers/10.vehicles/app/pages/vehicles-new.vue layers/5.orders/app/pages/orders-new.vue`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add layers/4.customers/app/pages/customers-new.vue layers/10.vehicles/app/pages/vehicles-new.vue layers/5.orders/app/pages/orders-new.vue
git commit -m ":sparkles: feat(voice): prefill customer, vehicle and order forms by voice"
```

---

### Task 5: Consumidores B: agendamento e item de orçamento

**Files:**
- Modify: `layers/11.scheduling/app/utils/scheduling.ts`
- Modify: `layers/11.scheduling/app/components/SchedulingFormSlideover.vue`
- Modify: `layers/11.scheduling/app/pages/scheduling.vue`
- Modify: `layers/5.orders/app/components/OrdersBudgetSection.vue`
- Modify: `layers/5.orders/app/composables/useOrderBudgetPage.ts`
- Modify: `layers/5.orders/app/pages/orders-[id].vue`

**Interfaces:**
- Consumes: `useVoiceDraft().onVoiceDraft` (Task 3).
- Produces: `AppointmentCreatePrefill` estendido; `OrdersBudgetSection` com `v-model:add-open`; `useOrderBudgetPage` passa a retornar `addModalOpen: Ref<boolean>`.

- [ ] **Step 1: `scheduling.ts`**: estender o tipo e a factory:

```ts
export type AppointmentCreatePrefill = {
  hour?: number
  veiculo_id?: string
  date?: string
  startTime?: string
  problema?: string
}
```

Em `emptyAppointmentDraft(day, prefill)`: `veiculo_id: prefill?.veiculo_id ?? ''`, `date: prefill?.date ?? <atual>`, `startTime: prefill?.startTime ?? <atual baseado em hour>`, `problema: prefill?.problema ?? ''`.

- [ ] **Step 2: `SchedulingFormSlideover.vue`**: `useVehicleOptions({ preferredId: ... })` passa a usar um getter `() => props.appointment?.veiculo_id ?? props.prefill?.veiculo_id` (reativo), para que o veículo pré-preenchido apareça no select.

- [ ] **Step 3: `scheduling.vue`**: registrar

```ts
const { onVoiceDraft } = useVoiceDraft()
onVoiceDraft('appointment.create', (draft) => {
  if (!canWrite.value) return
  openCreate({ veiculo_id: draft.veiculo_id, date: draft.date, startTime: draft.startTime, problema: draft.problema })
})
```

Ajuste `openCreate`: a regra "se hoje e sem hour, usa a hora atual" não pode sobrescrever `startTime` quando ele vier no prefill. Se `draft.date` vier, mude também o dia selecionado do board para essa data (use o setter já existente no `useSchedulingBoard`, ex.: `selectedDay`/`dia`), para o slideover e a timeline mostrarem o mesmo dia. Leia `canWrite` do jeito que o arquivo já faz (é um computed na página).

- [ ] **Step 4: `OrdersBudgetSection.vue`**: trocar `const showAddModal = ref(false)` por `const showAddModal = defineModel<boolean>('addOpen', { default: false })`; o resto do componente continua usando `showAddModal`.

- [ ] **Step 5: `useOrderBudgetPage.ts`**: adicionar `const addModalOpen = ref(false)` (retornado) e:

```ts
const { onVoiceDraft } = useVoiceDraft()
onVoiceDraft('budgetItem.create', async (voice) => {
  if (voice.orderId !== toValue(id)) return
  if (!canEditItems.value) {
    toast.add({ title: 'Orçamento bloqueado', description: 'Este orçamento não pode receber itens agora.', color: 'warning' })
    return
  }
  if (voice.catalogItemId) {
    selectedCatalogId.value = voice.catalogItemId
    await nextTick()
  } else {
    draft.tipo = voice.tipo
    if (voice.descricao) draft.descricao = voice.descricao
  }
  if (voice.quantidade != null) draft.quantidade = voice.quantidade
  if (voice.valor_unitario != null) draft.valor_unitario = voice.valor_unitario
  addModalOpen.value = true
})
```

Adapte os nomes reais (`draft`, `selectedCatalogId`, `id`, `toast`) ao que o composable já tem; se não houver `toast`, use `useToast()`. Garanta que o watch de `selectedCatalogId` (que preenche tipo/descrição/valor) roda **antes** de aplicar quantidade/valor falados (daí o `await nextTick()`; se o watch for `flush: 'post'` ou assíncrono, aguarde o que for necessário). Ao fechar/adicionar, o reset existente continua funcionando.

- [ ] **Step 6: `orders-[id].vue`**: desestruturar `addModalOpen` de `useOrderBudgetPage(...)` e passar `v-model:add-open="addModalOpen"` para `<OrdersBudgetSection>`.

- [ ] **Step 7: Verificar**

Run: `npx nuxt typecheck` e `pnpm exec eslint <arquivos da task>`
Expected: sem erros.

- [ ] **Step 8: Commit**

```bash
git add layers/11.scheduling/app/utils/scheduling.ts layers/11.scheduling/app/components/SchedulingFormSlideover.vue layers/11.scheduling/app/pages/scheduling.vue layers/5.orders/app/components/OrdersBudgetSection.vue layers/5.orders/app/composables/useOrderBudgetPage.ts "layers/5.orders/app/pages/orders-[id].vue"
git commit -m ":sparkles: feat(voice): prefill appointments and budget items by voice"
```

---

### Task 6: Consumidores C: conta a pagar, catálogo, fornecedor, colaborador

**Files:**
- Modify: `layers/8.management/app/pages/finance.vue`
- Modify: `layers/6.configuration/app/pages/catalog.vue`
- Modify: `layers/6.configuration/app/pages/catalog-suppliers.vue`
- Modify: `layers/8.management/app/pages/team.vue`
- Modify: `layers/8.management/app/components/team/TeamCollaboratorsCreateForm.vue`

**Interfaces:**
- Consumes: `useVoiceDraft().onVoiceDraft` (Task 3). `formatPhoneBr` se o form de fornecedor formatar telefone (conferir `CatalogSuppliersForm.vue`).
- Produces: `TeamCollaboratorsCreateForm` aceita a prop opcional `initial?: { nome?: string, username?: string, papel?: ColaboradorPapel }`.

- [ ] **Step 1: `finance.vue`**:

```ts
const { onVoiceDraft } = useVoiceDraft()
onVoiceDraft('account.create', (draft) => {
  tab.value = 'contas'
  Object.assign(accountDraft, emptyFinanceAccountDraft())
  if (draft.descricao) accountDraft.descricao = draft.descricao
  if (draft.valor != null) accountDraft.valor = draft.valor
  if (draft.vencimento) accountDraft.vencimento = draft.vencimento
  if (draft.categoria_id) accountDraft.categoria_id = draft.categoria_id
  if (draft.fornecedor_id) accountDraft.fornecedor_id = draft.fornecedor_id
  if (draft.observacoes) accountDraft.observacoes = draft.observacoes
  accountCreateOpen.value = true
})
```

`tab` vem de `useFinanceWorkspace()` (confira se é um ref gravável; se estiver só desestruturado, use-o direto). Confirme que o watcher que reseta `accountDraft` ao **fechar** o slideover não roda ao **abrir**. A `vencimento` já está no formato `YYYY-MM-DD` (igual a `todayDateValue()`).

- [ ] **Step 2: `catalog.vue`**:

```ts
const { onVoiceDraft } = useVoiceDraft()
onVoiceDraft('catalogItem.create', async (draft) => {
  openCreate()
  await nextTick()
  budgetDraft.tipo = draft.tipo
  await nextTick()
  if (draft.nome) budgetDraft.nome = draft.nome
  if (draft.custo != null) budgetDraft.custo = draft.custo
  if (draft.estoque != null) budgetDraft.estoque = draft.estoque
  if (draft.horas_estimadas != null) budgetDraft.horas_estimadas = draft.horas_estimadas
  if (draft.valor_padrao != null) {
    if (draft.tipo === 'servico') budgetDraft.preco_manual = true
    budgetDraft.valor_padrao = draft.valor_padrao
  }
})
```

Leia os watchers de `CatalogForm.vue` (tipo L98–113, preço sugerido L94–96) e garanta que os valores falados **sobrevivem** a eles (por isso o `tipo` é aplicado primeiro, com `nextTick`, e `preco_manual = true` evita que o preço sugerido sobrescreva o valor falado de um serviço). Se o watcher de `tipo` zerar `preco_manual`, aplique `preco_manual`/`valor_padrao` depois dele.

- [ ] **Step 3: `catalog-suppliers.vue`**:

```ts
const { onVoiceDraft } = useVoiceDraft()
onVoiceDraft('supplier.create', async (draft) => {
  openCreate()
  await nextTick()
  if (draft.nome) supplierDraft.nome = draft.nome
  if (draft.telefone) supplierDraft.telefone = formatPhoneBr(draft.telefone)
  if (draft.email) supplierDraft.email = draft.email
  if (draft.observacoes) supplierDraft.observacoes = draft.observacoes
})
```

(Se o form de fornecedor não usa máscara de telefone, atribua os dígitos crus; se usa, importe `formatPhoneBr` explicitamente de `#layers/customers/app/utils/customer-form`.) O `await nextTick()` é necessário porque o watcher de `formOpen` reseta o draft ao abrir.

- [ ] **Step 4: `TeamCollaboratorsCreateForm.vue`**: adicionar a prop opcional `initial?: { nome?: string, username?: string, papel?: ColaboradorPapel }` e um `watch(() => props.initial, value => { if (!value) return; if (value.nome) nome.value = value.nome; if (value.username) username.value = value.username; if (value.papel) papel.value = value.papel }, { immediate: true })`. **Nunca** tocar em `password`.

- [ ] **Step 5: `team.vue`**:

```ts
const voiceCollaborator = ref<{ nome?: string, username?: string, papel?: ColaboradorPapel }>()
const { onVoiceDraft } = useVoiceDraft()
onVoiceDraft('collaborator.create', (draft) => {
  voiceCollaborator.value = { ...draft }
  createOpen.value = true
})
```

Passar `:initial="voiceCollaborator"` para `<TeamCollaboratorsCreateForm>` e limpar `voiceCollaborator.value = undefined` quando o slideover fechar (`watch(createOpen, open => { if (!open) voiceCollaborator.value = undefined })`). Se o form já é recriado a cada abertura (`v-if`), confirme que o valor inicial é aplicado.

- [ ] **Step 6: Verificar**

Run: `npx nuxt typecheck` e `pnpm exec eslint <arquivos da task>`
Expected: sem erros.

- [ ] **Step 7: Commit**

```bash
git add layers/8.management/app/pages/finance.vue layers/6.configuration/app/pages/catalog.vue layers/6.configuration/app/pages/catalog-suppliers.vue layers/8.management/app/pages/team.vue layers/8.management/app/components/team/TeamCollaboratorsCreateForm.vue
git commit -m ":sparkles: feat(voice): prefill finance, catalog, supplier and team forms by voice"
```

---

### Task 7: Verificação final

**Files:** nenhum arquivo novo (só correções, se necessário).

- [ ] **Step 1:** `pnpm test`. Expected: todos passam.
- [ ] **Step 2:** `npx nuxt typecheck`. Expected: sem erros.
- [ ] **Step 3:** `pnpm lint`. Expected: sem erros.
- [ ] **Step 4:** `graphify update .`
- [ ] **Step 5:** Revisão final da branch inteira (subagente de code review) e correção dos achados.
- [ ] **Step 6:** Commit das correções e do graph (`:wrench: chore(graphify): update graph after voice commands`).
