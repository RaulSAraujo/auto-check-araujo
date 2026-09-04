---
target: home / layers/3.home
total_score: 22
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-09-03T12-51-18Z
slug: layers-3-home-app-pages-index-vue
---
Method: dual-agent (A: 62a855ca-5775-4688-92fe-0e984bf9f867 · B: b24901a5-f676-4f91-b930-2e17f4b6819b)

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Skeletons OK; falha de RPC sem UI de erro/retry |
| 2 | Match System / Real World | 4 | Vocabulário de oficina (OS, placa, pátio) |
| 3 | User Control and Freedom | 3 | Saídas boas; agenda não aterrissa no horário |
| 4 | Consistency and Standards | 2 | “OS em andamento” ≠ lista ativa; Home ≠ DESIGN §6 |
| 5 | Error Prevention | 2 | Status muito dependente de cor + bolinha aria-hidden |
| 6 | Recognition Rather Than Recall | 3 | Labels OK; charts hide-legend |
| 7 | Flexibility and Efficiency | 2 | Deep links; sem aceleradores |
| 8 | Aesthetic and Minimalist Design | 2 | Parede de charts vs workshop-clean |
| 9 | Error Recovery | 1 | Sem mensagem/ação de recovery na page |
| 10 | Help and Documentation | 1 | Só description do header |
| **Total** | | **22/40** | **Acceptable** |

#### Design Specificity Verdict

**LLM:** Parcialmente Araujo (copy PT operacional, mono KPI, azul marca, empty “Nova OS”), mas layout de analytics SaaS genérico (donuts/área/7 KPIs, max-w-7xl) — distante do brief Stitch §6.

**Detector (CLI):** 0 findings no markup da layer home (exit 0).

**Detector (browser overlay em `/`):** 4 anti-patterns — `undersized-ui-text` (“Gerente” 10px), `repeated-container-text` (“R$ 0,00”×3), `layout-transition`, `marquee` (FP provável Nuxt UI loading), `nested-cards`×2 (FP possível). Overlay no tab [Human] se ainda aberto.

#### Overall Impression
Cockpit operacional com bom domínio de linguagem, mas excesso de charts e métricas atrasa a pergunta “qual OS abro agora?”. Maior oportunidade: destilar para hierarquia Operate (lista + status primeiro; charts secundários).

#### What's Working
1. Linguagem + tipografia KPI alinhadas à oficina.
2. Empty states com CTA “Nova OS”.
3. Deep links de status/lista para detalhe.

#### Priority Issues

**[P1] Parede de charts vs workshop-clean**
- Why: carga cognitiva alta (6/8 falhas); atrasa tarefa primária.
- Fix: lista OS + contagens first; charts colapsáveis/secundários; aproximar DESIGN §6.
- Suggested: `/impeccable distill`

**[P1] Sem estado de erro na Home**
- Why: error/refresh no composable não chegam à UI.
- Fix: banner + retry.
- Suggested: `/impeccable harden`

**[P1] Copy IA: “OS em andamento” ≠ conteúdo**
- Why: título promete subset; lista/total cobrem aberta+andamento+retrabalho.
- Fix: “OS ativas” / “Fila da oficina” ou filtrar de verdade.
- Suggested: `/impeccable clarify`

**[P2] Financeiro: 7 métricas + half-donut**
- Why: ultrapassa working memory; DESIGN pedia 3 colunas.
- Fix: strip Faturamento/Recebido/Pendente (+Saldo); resto em Detalhes.
- Suggested: `/impeccable distill`

**[P2] Agenda triplicada no header**
- Why: compete com Nova OS.
- Fix: um CTA primário; Agenda só no bloco/nav.
- Suggested: `/impeccable layout`

#### Persona Red Flags
**Alex:** sem atalhos; charts roubam scroll; agenda genérica.
**Jordan:** dois heróis + semana dual sem mapa; 7 números financeiros.
**Sam:** bolinhas só-cor aria-hidden; charts lean on legend; touch/focus OK.

#### Minor Observations
- max-w-7xl vs DESIGN max-w-5xl; cadastro text-3xl vs 4xl.
- Stagger first row both 0.
- Weekly empty sem CTA.
- Browser: texto “Gerente” 10px no header.

#### Questions to Consider
1. Se só um bloco above the fold — lista ou donut?
2. Financeiro é cockpit ou teaser de `/financeiro`?
3. Sem charts, a Home ainda “parece Araujo”?
