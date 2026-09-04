---
name: fetch-bundle-waterfalls
description: Aplica as regras críticas da Vercel (waterfalls, bundle, fetch) à API Nuxt deste monorepo para melhorar a UX de carregamento. Use ao escrever, rever ou refatorar useFetch, useAsyncData, $fetch, bootstrap de listagem, prefetch de rotas, lazy components, ou quando o utilizador pedir waterfalls, bundle, performance de API ou carregamento mais rápido.
---

# Fetch, bundle e waterfalls

Subset da skill oficial [vercel-react-best-practices](https://skills.sh/vercel-labs/agent-skills/react-best-practices): **só** as 3 categorias de impacto crítico/alto. Adaptado à API Nuxt 4 e aos composables de listagem deste repo — não copiar `next/dynamic`, SWR nem RSC.

Antes de mudar código: confirmar a API no MCP `user-nuxt` (`get-documentation-page` em `/docs/4.x/getting-started/data-fetching`). Detalhe e exemplos do repo: [references/nuxt-api.md](references/nuxt-api.md).

## Quando aplicar

- Novo `useFetch` / `useAsyncData` / `$fetch`
- Bootstrap de listagem (`useListingPage`, prefs, pesquisa)
- Prefetch de rota ou de API no hover
- Componente pesado no caminho crítico (tabela, gráficos, formulário)
- UX de loading: skeleton, navegação bloqueada, spinner silencioso

Não usar para re-renders, micro-opts JS, nem guidelines visuais (`refactoring-ui` / `web-design-guidelines`).

## 1. Waterfalls (CRITICAL)

Operações independentes **começam juntas**. `await` só no ramo que precisa do resultado. Condição síncrona barata **antes** de qualquer fetch.

| Vercel | Neste repo |
|--------|------------|
| `Promise.all` | Prefs: `loadFilters` + `loadGrids` em paralelo (`useListingPage.loadPrefs`) |
| Start early, await late | `prefetchListingUserPrefs` no hover; pesquisa só quando `canStartListingSearch` |
| Cheap condition first | `decideListingReentry` / `isPrefsBootstrapped` **antes** de bater na API |
| Defer await | Não esperar filtros se a URL não tem `f=` (`canStartListingSearch`) |
| Suspense / shell primeiro | Shell + skeleton (`listingWorkspaceStage`); não bloquear o layout à espera da tabela |

```ts
// Incorrect — 2 round-trips em série
const filters = await prefs.loadFilters(model)
const grids = await prefs.loadGrids(model)

// Correct — já é o padrão em useListingPage
await Promise.all([
  prefs.loadFilters(model).then(applyFiltersPayload),
  prefs.loadGrids(model).then(applyGridsPayload)
])
```

**Proibido:** `await a(); await b()` quando `a` e `b` não dependem um do outro.

## 2. Bundle (CRITICAL)

Não meter no chunk inicial o que o utilizador ainda não pediu. Prefetch no **intent** (hover/focus), não no boot.

| Vercel | Neste repo |
|--------|------------|
| `next/dynamic` | Prefixo `Lazy` no template, ou `lazyFormComponent` / `defineAsyncComponent` |
| Preload on hover | `prefetchAppRoute` + `bindListingRoutePrefetch` (chunk + prefs) |
| Evitar barrels | Importar `@core/utils/...` no ficheiro concreto; ícones via `i-lucide-*`, nunca `lucide-react` |
| Condicional | Carregar módulo só quando a feature abre (modal, gráfico, form) |

```vue
<!-- Incorrect — gráfico no chunk da listagem -->
<StockChart :rows="rows" />

<!-- Correct — só quando o painel abre -->
<LazyStockChart v-if="chartOpen" :rows="rows" />
```

Rotas: `preloadRouteComponents(path)` já está em `prefetchAppRoute`. Não duplicar prefetch; estender esse helper.

## 3. Fetch / API (MEDIUM-HIGH) — UX

A API Nuxt **é** o dedupe: `useFetch` / `useAsyncData` com chave estável. `$fetch` só em evento (POST, retry, acção).

| Situação | API |
|----------|-----|
| Dados iniciais da página (SSR + hidratação) | `useFetch` / `useAsyncData` com `key` explícita |
| Mutação / clique | `$fetch` no handler |
| Navegação deve pintar já, dados a seguir | `lazy: true` **ou** não `await`; tratar `status` + skeleton |
| Navegação só com dados prontos | `await useFetch` **sem** `lazy` |
| Partilhar payload entre componentes | mesma `key` + `useNuxtData` |
| Evitar refetch na hidratação | `getCachedData` (ver `useWeather`) |

```ts
// Incorrect — $fetch no setup: fetch duplicado SSR+client
const rows = await $fetch('/api/listing')

// Correct — chave estável, payload partilhado
const { data, status, error } = await useFetch('/api/listing', {
  key: `listing:${model}:${queryKey}`,
  query: listingQuery
})
```

**Listagem:** a tabela **não** deve bloquear o shell. `listingWorkspaceStage` mostra skeleton de filtros/tabela em separado; `listingWorkspaceStatusCopy` diz o que está a acontecer (Nielsen: visibilidade de estado).

Não `await useFetch(..., { lazy: true })` à espera dos dados no client — o `await` resolve já e `data` ainda está vazio. Ver docs Nuxt em data-fetching.

## Checklist antes de merge

- [ ] Prefs/filtros/grelha independentes em `Promise.all` (ou promises iniciadas cedo)
- [ ] Guard síncrono (`isPrefsBootstrapped`, cache, `f=` na URL) **antes** do fetch
- [ ] Shell da página visível com skeleton; pesquisa da tabela não segura o layout
- [ ] Hover do menu usa `prefetchAppRoute` (chunk + prefs), sem novo waterfall no click
- [ ] Hover da linha só aquece o chunk JS; GET de detalhe só no ⋯ (`warmNuxtData`, 1 inflight) + `getCachedData` / `useDetailRecordLoad.cacheKey`
- [ ] Slideovers/modais no intent (`provideListingIntentPrefetch`); células Lazy da tabela no setup
- [ ] Componente pesado fora do chunk inicial (`Lazy` / `lazyFormComponent`)
- [ ] Dados de página via `useFetch`/`useAsyncData`; `$fetch` só em evento
- [ ] Loading/erro visíveis (`status`, `listingWorkspaceStatusCopy`) — nunca ecrã mudo
- [ ] Sem import barrel de ícones (`lucide-react`) nem `await` em série sem dependência

## Fontes

- Vercel (subset): waterfalls `async-*`, bundle `bundle-*`, fetch `client-swr-dedup`
- Nuxt: MCP `user-nuxt` → `/docs/4.x/getting-started/data-fetching` e `/docs/4.x/guide/best-practices/performance`
- Repo: `useListingPage.loadPrefs`, `prefetchAppRoute`, `listingWorkspaceStage`
