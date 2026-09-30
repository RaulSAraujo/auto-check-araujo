# Voz — Controles de tela (parte 2 da cobertura total)

Parte 2 de 3 da cobertura total por voz (parte 1: preencher e agir — entregue; parte 3: perguntas livres — depois).

## Objetivo

Tudo que o usuário faz nos controles de uma tela — buscar, filtrar, trocar aba/período, imprimir, baixar PDF, mandar WhatsApp — pode ser feito por voz, na tela atual ou vindo de outra.

```
"mostra as OS abertas do João"            (da home)  → /ordens?q=João&status=aberta
"só as canceladas"                         (em /ordens) → mantém q, troca status
"contas vencidas"                          → /gestao/financeiro?aba=contas&contas=vencidas
"financeiro de agosto"                     → /gestao/financeiro?mes=2026-08
"agenda da semana que vem"                 → /agendamentos?vista=week&dia=2026-10-05
"peças de filtro de óleo no catálogo"      → /configuracao/catalogo?tipo=peca&q=filtro de óleo
"baixa o PDF da OS da placa ABC1D23"       → abre a OS e baixa o PDF
"manda o orçamento no WhatsApp"            (na OS) → aviso com botão "Abrir WhatsApp"
```

Fora de escopo: paginação, "limpar filtros", comandos globais (voltar, atualizar, tema), logout.

## Abordagem

A URL é a fonte única dos controles de cada lista. A voz só navega com parâmetros vindos de um catálogo declarativo de visões — o mesmo caminho de um link compartilhado. Nenhuma tela ganha API de voz própria para filtros.

## 1. Catálogo de visões — `utils/voice/views.ts` (puro)

```ts
export const VOICE_VIEWS: Partial<Record<VoiceNavTarget, Record<string, VoiceField>>> = {
  orders: { q: text, status: enum('all', 'aberta', 'em_andamento', 'concluida', 'cancelada') },
  customers: { q: text, status: enum('ativos', 'inativos', 'all') },
  vehicles: { q: text },
  scheduling: { q: text, filtro: enum('all', 'agendados', 'nao_compareceu'), vista: enum('daily', 'week'), dia: date },
  finance: { aba: enum('resumo', 'contas', 'recebiveis'), mes: month, contas: enum('a_pagar', 'pagas', 'vencidas', 'todas') },
  catalog: { q: text, tipo: enum('all', 'servico', 'peca', 'kit') },
  suppliers: { q: text }
}
```

- Reusa `VoiceField` e o `pick` do normalizador; novo tipo de campo `month` (`YYYY-MM`, mês 01–12).
- Texto de busca cortado em 100 caracteres.
- O prompt ganha uma linha compacta por tela (gerada do catálogo) e o formato de `navigate` passa a ser `{"op":"navigate","to":"orders","query":{"q":"João","status":"aberta"}}`. O prompt continua ≤ 6000 caracteres (teste existente).

## 2. Comando `navigate` com `query`

- `VoiceCommand.date` sai; entra `query?: Record<string, string>`.
- Normalizador: `query` passa por `pick(VOICE_VIEWS[to], raw.query)`; chaves/valores fora do catálogo são descartados em silêncio. Substitui a regra atual "`date` só para a agenda".
- `useVoiceCommand`, ramo `navigate` (permissão da tela checada antes, como hoje):
  - **Outra tela:** `navigateTo({ path, query })` só com os parâmetros ditos — o resto fica no padrão da tela. Toast "Aberto por voz".
  - **Mesma tela, com `query`:** `navigateTo({ path, query: { ...route.query, ...query } }, { replace: true })` — refina o que já está na tela. Toast "Filtro aplicado por voz".
  - Mesma tela sem `query`: nada muda (como hoje).

## 3. Telas lendo e escrevendo os controles na URL

Hoje OS e clientes leem `status` da URL **só na montagem** — uma troca na mesma tela (voz ou botão voltar) não chegaria à lista. A URL passa a ser lida de forma reativa.

Novo composable pequeno em `1.base`: `useRouteQueryState(key, fallback, allowed?)`.

- Retorna um `Ref<string>` local (o `v-model` de busca não perde caracteres nem pula o cursor enquanto o `replace` resolve — mesmo motivo do padrão que a agenda já usa para `q`).
- URL → ref: `watch(() => route.query[key])`; valor ausente ou fora de `allowed` vira `fallback`.
- Ref → URL: `router.replace({ query: { ...route.query, [key]: value } })`, omitindo a chave quando `value === fallback` ou vazio.
- Lógica pura de leitura/escrita da query em `utils/route-query.ts`, com teste.

Aplicação:

| Tela | Controles | Hoje |
|---|---|---|
| OS (`useOrdersList`) | `q`, `status` | só `status`, lido na montagem e escrito apagando o resto da query |
| Clientes (`useCustomersList`) | `q`, `status` (padrão `ativos`) | idem |
| Veículos | `q` | nada |
| Catálogo (`useCatalogList`) | `q`, `tipo` | `tipo` lido na montagem |
| Fornecedores (`catalog-suppliers.vue`) | `q` | nada |
| Financeiro (`useFinanceWorkspace`) | `aba`, `mes` (padrão mês atual), `contas` (padrão `a_pagar`) | nada |
| Agenda | `q`, `filtro`, `vista`, `dia` | já sincroniza — sem mudança |

- Debounce da busca e volta para a página 1 ao filtrar continuam como estão (observam o ref).
- As páginas deixam de ler `route.query` para o valor inicial (o composable faz isso).

## 4. Ações da OS: imprimir, baixar PDF, WhatsApp

Três ações novas `kind: 'direct'` em `VOICE_CATALOG.order`: `imprimir`, `baixarPdf`, `enviarWhatsApp`. Alvo: a OS aberta ou uma identificada por placa/número (fluxo de alvo da parte 1). Tratadas em `orders-[id].vue` via `useVoiceForm` `actions`, reusando `onDownloadBudgetPdf`, `onPrintBudgetPdf` e `budgetWhatsappUrl`.

- **Permissão:** o menu de compartilhar aparece para qualquer um que vê a OS (inclusive mecânico). `VoiceAction.permission` passa a ser opcional; ação sem permissão só exige acesso à tela. `useVoiceCommand` deixa de tratar "ação sem permissão" como "só abrir a tela".
- **Baixar PDF:** executa na hora (`doc.save` não precisa de gesto).
- **Imprimir / WhatsApp:** o navegador bloqueia `window.open` fora de um toque, e a voz chega depois de uma chamada assíncrona. A ação mostra um toast com botão — "Imprimir" (`onClick: onPrintBudgetPdf`) ou "Abrir WhatsApp" (`to: budgetWhatsappUrl`, `target: '_blank'`) — e um toque conclui.
- **Indisponível** (via `unavailable`):
  - orçamento sem itens → "Adicione itens ao orçamento antes."
  - WhatsApp sem telefone do cliente → "Cliente sem telefone cadastrado."

## Erros

| Situação | Resultado |
|---|---|
| Tela sem permissão | "Sem permissão" (como hoje) |
| Parâmetro/valor fora do catálogo | Descartado; navega com o resto |
| Filtro não encontra nada | Lista vazia normal da tela |
| OS não encontrada | "Não encontrei OS …" (fluxo da parte 1) |
| Ação indisponível | Toast de aviso com o motivo |

## Testes

- `views.test.ts` / normalizador: `navigate` com `query` válida, chave desconhecida, enum inválido, data e mês inválidos, texto > 100, `query` para tela sem visões.
- `route-query.test.ts`: leitura com fallback/allowed; escrita omite padrão/vazio e preserva as outras chaves.
- Prompt ≤ 6000 caracteres (teste existente).
- `pnpm test`, `nuxt typecheck`, lint e build limpos.

## Segurança

Sem mudança: a voz não grava no banco; a IA recebe só a frase, a data e a página; tudo passa pelo normalizador.
