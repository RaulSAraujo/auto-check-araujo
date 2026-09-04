# Mapeamento Nuxt + API deste repo

Ler só quando o SKILL.md não chega: exemplos concretos e equivalências da API.

## Equivalência Vercel → Nuxt

| Vercel | Não usar aqui | Usar |
|--------|---------------|------|
| `Promise.all` | — | `Promise.all` / iniciar promises cedo |
| `next/dynamic` | `next/dynamic` | `Lazy*` no template, `defineAsyncComponent`, `lazyFormComponent` |
| SWR / `useSWR` | `swr` | `useFetch` / `useAsyncData` + `key` |
| `useSWRMutation` | — | `$fetch` no handler |
| Preload `import()` no hover | duplicar em cada link | `prefetchAppRoute` / `bindListingRoutePrefetch` |
| RSC `cache()` | — | chave `useAsyncData` + payload Nuxt |
| `optimizePackageImports` (Next) | lucide-react | ícones `i-lucide-*` (Nuxt UI) |

## API Nuxt (resumo)

Confirmar sempre no MCP `user-nuxt`.

- **`useFetch(url)`** — wrapper de `$fetch` + `useAsyncData`. Fetch uma vez no SSR, payload para o client.
- **`useAsyncData(key, handler)`** — quando o cliente HTTP não é `$fetch` (CMS, cliente da layer). **Sempre passar `key`** em composable partilhado.
- **`$fetch`** — só browser/evento. Sem dedupe, sem payload. No `setup` causa fetch duplo (SSR + hidratação).
- **`await` vs `lazy`:** `await` bloqueia navegação client-side até os dados. `lazy: true` (ou não await) pinta já; o caller trata `status`. Não combinar `await` + `lazy` no client à espera de dados.
- Independentes no mesmo `useAsyncData`:

```ts
const { data } = await useAsyncData(`listing-aux:${model}`, async (_app, { signal }) => {
  const [filters, grids] = await Promise.all([
    $fetch('/filters', { signal }),
    $fetch('/grids', { signal })
  ])
  return { filters, grids }
})
```

## Padrões já no core

### Prefs em paralelo + pesquisa adiada

`layers/core/app/composables/listing/session/useListingPage.ts` — `loadFilters` e `loadGrids` em `Promise.all`, cada um hidrata assim que chega (`tryFinishPrefsBootstrap`).

`canStartListingSearch` (`listingWorkspaceStage.ts`): a tabela precisa da grelha; só espera filtros se a URL tem `f=`.

### Prefetch no intent

`prefetchAppRoute` — `preloadRouteComponents` + componentes de listagem + `prefetchListingUserPrefs` (filtros e grelha em paralelo, fire-and-forget).

Hover da **linha** (`UTable` `onHover`): só o chunk JS (`prefetchListingRowRoute`). O GET de detalhe (`prefetchDetail` / `warmNuxtData`, 1 inflight) corre no hover do **⋯**, não ao varrer a tabela.

Slideovers/modais: `provideListingIntentPrefetch` + hover do header/linha. Células Lazy da tabela continuam no setup (pintam com as rows).

Não iniciar o mesmo fetch outra vez no click se o hover já aqueceu (inflight/dedupe das prefs).

### Shell vs dados (UX)

`listingWorkspaceStage`: skeleton de filtros e de tabela **independentes**.

`listingWorkspaceStatusCopy`: copy + `aria-label` por estágio («A carregar colunas…», «A procurar registros…»). Heurística Nielsen 1 — visibilidade de estado.

### Bundle condicional

`layers/core/app/utils/runtime/lazy-form-component.ts` — `defineAsyncComponent` para forms pesados.

Prefixo `Lazy` no template para gráficos, editores, slideovers.

## Anti-padrões

```ts
// Waterfall
await loadFilters(model)
await loadGrids(model)
await search(model)

// Fetch duplo
onMounted(async () => {
  rows.value = await $fetch(url)
})

// Bundle no crítico
import HeavyChart from './HeavyChart.vue'

// Prefetch ad-hoc que ignora o helper
onMouseEnter={() => preloadRouteComponents(to)}
```

## Quando o await na página é correcto

SEO / primeiro paint com HTML completo, ou a página não faz sentido sem o payload (detalhe de um id). Aí `await useFetch` **sem** `lazy`. Listagens autenticadas no SPA privilegiam shell + skeleton.
