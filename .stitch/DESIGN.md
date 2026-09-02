# Design System: Auto Check Araujo

Sistema interno da **Araujo Auto Center** (Franca/SP) — ordens de serviço, clientes, veículos e financeiro para colaboradores da oficina. Interface de software operacional: clara, rápida de escanear e com micro-animações que confirmam ações sem distrair o trabalho.

**Stitch project:** `projects/11367835346806593695`  
**Stitch asset:** `assets/18253519892564423504`  
**Código:** Nuxt 4 + Nuxt UI v4 + layers (`1.base`, `2.auth`, `3.home`, …)

---

## Configuration — Style Dials

| Dial | Level | Rationale |
|------|-------|-----------|
| **Creativity** | `5` | Personalidade de marca sem editorial exagerado — dashboard de oficina, não landing |
| **Density** | `6` | App diário: tabelas, filtros e KPIs visíveis; whitespace para respirar |
| **Variance** | `4` | Layouts previsíveis (mesma sidebar, mesmos headers) |
| **Motion Intent** | `7` | Springs, stagger, feedback tátil; nunca cinema que atrasa a tarefa |

> Stitch gera telas estáticas. **Motion** documenta a intenção para CSS / Motion Vue no Nuxt.

---

## 1. Visual Theme & Atmosphere

Oficina moderna sob luz fria de LED — **prático, metálico, confiável**. Cockpit leve: status da OS, placa e valores sem caçar. Atmosfera **workshop-clean**: azul da marca como único accent de ação.

Sensação alvo: ferramenta que “responde” ao toque. Sem marketing fluff, purple neon ou cards decorativos sem função.

**Brand test (login):** viewport inequivocamente Araujo — tipografia branca + ícone carro no painel marca, azul `#1B7ACE`, copy curta. Remover a nav e ainda reconhecer a oficina.

---

## 2. Color Palette & Roles

**Fonte de verdade:** Stitch `namedColors` do asset `assets/18253519892564423504` (Material FIDELITY a partir do seed). O código Nuxt espelha esses tokens em `main.css` + `STITCH_COLORS` (`brand.ts`).

### Stitch → Nuxt

| Stitch token | Hex | Nuxt / CSS |
|--------------|-----|------------|
| `primary` | `#005ea4` | `brand-500` / `--stitch-primary` / `text-primary` |
| `primary_container` | `#1477cb` | `brand-400` (dark primary) |
| `secondary` | `#b6171e` | `accent-500` / secondary |
| `background` / `surface` | `#fcf9f8` | `workshop-50` / `bg-muted` |
| `surface_container_lowest` | `#ffffff` | `bg-default` |
| `surface_variant` | `#e5e2e1` | `workshop-200` / `border-default` |
| `on_surface` | `#1c1b1b` | `workshop-900` / `text-highlighted` |
| `on_surface_variant` | `#414752` | `workshop-500` / `text-muted` |
| `outline` | `#717783` | `workshop-400` / `text-dimmed` |
| `outline_variant` | `#c0c7d3` | `workshop-300` |
| `tertiary_container` | `#b45e00` | `caution-500` / `text-warning` (Em andamento) |
| finance success | `#16a34a` | `ok-500` / `text-success` |
| finance warning | `#d97706` | `caution-400` / Pendente |
| `error` | `#ba1a1a` | erros de sistema |

### Accent de ação
- Primary único: Stitch `primary` `#005ea4` — CTAs, nav ativa, links, KPI “Abertas”
- Secondary Stitch: destrutivo / ênfase vermelha — **nunca** CTA feliz

### Shadows
- Light: `shadow-sm` em painéis
- Dark: `dark:shadow-none`

### Banned
- Purple neon; pure black `#000000`
- Hex de marca legado `#1B7ACE` / `#D32F2F` / `#FAFAFA` fora de `STITCH_COLORS` / CSS vars
- Escala Material do Stitch **divergente** do código (sempre sincronizar `namedColors` → `main.css`)

---

## 3. Dark Mode (obrigatório no dashboard)

Hierarquia (espelha light: canvas atrás, painel na frente):

| Papel | Light | Dark |
|-------|-------|------|
| Canvas (`bg-muted`) | `#fcf9f8` | `#0c0e12` |
| Surface (`bg-default`) | `#ffffff` | `#161b24` |
| Elevated (painéis) | `#f6f3f2` | `#1e2533` |
| Border | whisper | `rgb(192 199 211 / 0.16–0.24)` |
| Primary | `#005ea4` | `#1477cb` (tint `/15`, sem fill sólido) |
| Texto muted | `#414752` | `#a8b0c0` |

**Regras:**
1. Tokens semânticos Nuxt UI em páginas autenticadas
2. Home: `bg-default dark:bg-elevated` + `dark:border-accented`
3. Nav ativa: `bg-primary/10` (dark `/15`) — sem highlight sólido
4. Login sempre light
5. Escala workshop 700–950 **distinta** (800 ≠ 900)
6. `--ui-bg-muted` no dark deve ser o tom **mais fundo**; `--ui-bg` / elevated mais claros

---

## 4. Typography Rules

- **UI:** `Public Sans` 400–700, tracking tight em títulos
- **Mono / KPI:** `JetBrains Mono` (`--font-mono`) + `tabular-nums` — placas, dinheiro, contadores
- **Section labels:** 600, `text-sm`, `uppercase`, `tracking-widest`, `text-muted`

### Scale
| Token | Size | Use |
|-------|------|-----|
| Login brand title | `text-3xl`–`text-5xl` font-black | “Araujo / Auto Center” no painel esquerdo |
| Page title | `1.25rem` | Navbar |
| Section | `text-sm` uppercase tracking-widest | “Ordens de serviço” |
| KPI row | `text-3xl` mono bold | Abertas / Em andamento |
| KPI cadastro | `text-4xl` mono bold | Clientes / Veículos |
| Money | `text-xl` mono bold | Faixa financeira |
| Body | `0.875rem`–`1rem` | Forms / tabelas |

### Copy (Krug)
- PT claro: “Entrar”, “Nova OS”, “Ver todas”, “Detalhes”
- Erro login: “Não foi possível entrar” + “Usuário ou senha incorretos. Tente de novo.”
- Loading: “Salvando…”, “Carregando…”
- Um termo: “Ordens de serviço” / “OS”

---

## 5. Component Stylings

### Buttons
- Primary: Araujo Blue, radius 8px (`--ui-radius: 0.5rem`) — balanced, not boxy nor pill
- Active: `scale(0.98)`; hover sem glow
- Icon-only: `aria-label` obrigatório (ex.: “Mostrar senha” / “Ocultar senha”)

### Panels
- `rounded-lg border border-default bg-default shadow-sm dark:shadow-none`
- Listas densas: `divide-y divide-default`
- Só quando agrupa dados/interação

### Inputs / Forms
- Label acima; erro abaixo
- Placeholder: Dimmed `#A3A3A3` (não azul-acinzentado fraco; não mesma cor do valor)
- Senha: toggle olho no `#trailing` (`type` text/password); esconder `::-ms-reveal`
- Username: `spellcheck="false"`, placeholder exemplo `j.silva`
- Login placeholders Stitch: `j.silva` / `••••••••` (sem prefixo “ex.:” se o mock não tiver)

### Navigation
- Shell: layout `default` + `BaseAppHeader` com `UNavigationMenu` (`variant="link"`, pill `bg-muted/80 backdrop-blur-sm rounded-full`)
- Categorias via `children`: **Início** | **Operação** | **Cadastros** | **Gestão**
- Trailing: `UColorModeButton` + avatar (`Sair`)
- Sem sidebar; sem `UDashboardGroup` / `UDashboardSidebar` — só header pill flutuante
- Conteúdo do layout `default` com `pt-20 sm:pt-24` sob o header fixo

### Loaders / Empty
- Skeleton shimmer (não spinner como padrão)
- Empty: ícone + uma linha + CTA

---

## 6. Screen Patterns (implementados)

### Login `/login` (Stitch `…/screens/ce416a8e3a574b4ebbacf0c39798deab`)
- Split **45% / 55%** (`md:w-[45%]` / `md:w-[55%]`)
- Esquerda: gradiente `#1B7ACE → #0A0A0A`, noise, streak diagonal, ícone carro + “Araujo / Auto Center” font-black, Franca/SP, “Sistema interno da oficina.”, status “Sistema Operacional” com pulse
- Direita: canvas `#FAFAFA`, **card** branco `max-w-[400px]` borda whisper: eyebrow “Acesso colaboradores”, H1 “Entrar”, form, footer com link “Contate o administrador.”
- Motion: rise no card; pulse no status; press no botão
- Sempre `colorMode: 'light'`

### Início `/` (Stitch `…/screens/b2aa12536086403799553cbf63697570`)
- Shell = layout `default` (`BaseAppHeader` + slot da página)
- Body `bg-muted`, conteúdo `max-w-5xl space-y-8`
1. **Ordens:** label + “Ver todas”; linhas label← →número+chevron (Abertas=`text-primary`, Em andamento=`text-warning`)
2. **Cadastro:** 2 colunas centralizadas, números `text-4xl` mono
3. **Financeiro** (permissão): faixa 3 colunas — Faturamento / Recebido=`text-success` / Pendente=`text-warning`; “Detalhes” → `/financeiro`
- Motion: stagger seções 60ms; hover scale nos números de OS
- Dark: tokens semânticos (ver §3)

---

## 7. Layout Principles

- Shell: único layout `default` + **header pill flutuante** (`BaseAppHeader`); título da página via `BasePageHeader` no body
- Sem sidebar / `UDashboardGroup` / `UDashboardNavbar` no shell
- `min-h-dvh` — nunca `h-screen`
- Collapse single-column abaixo de 768px
- Sem grid de 3 cards iguais decorativos
- Sem `calc(33% - 1rem)` hacks

---

## 8. Responsive Rules

- Mobile-first; sem scroll horizontal
- Body ≥ 14px; touch ≥ 44px
- Login: brand empilha acima do form
- Testar: 375, 768, 1024, 1440

---

## 9. Motion & Interaction

- Spring: stiffness 100, damping 20 (quando Motion Vue)
- Só `transform` + `opacity`; nunca `transition: all`
- Tokens: `--ease-out`, `--ease-in-out`, `--duration-press` / `--duration-ui` / `--duration-nav` em `main.css`
- `prefers-reduced-motion: reduce` desliga loops e stagger
- Login: rise + pulse + press
- Home: section stagger + row press + KPI hover scale
- Header pill: indicador ativo desliza entre links; press em links/ícones

---

## 10. UX Heuristics

Score alvo 10/10 — Don’t Make Me Think. Trunk test em toda página autenticada. Status visível (skeleton/toast). Um CTA primário. Erros com próximo passo.

---

## 11. Web Interface Guidelines

- `:focus-visible`; `button` vs `NuxtLink`
- `Intl.*` pt-BR; destructive com confirmação
- Dark: `color-scheme: dark`; login isolado em light
- Headings `text-balance` / `text-pretty` onde couber

---

## 12. Anti-Patterns (Banned)

- Emojis; Inter; serif; gradient text; pure black
- Purple neon; cream+terracotta brochure
- 3 feature cards iguais; fluff “Scroll to explore”
- Spinner circular como único loading
- `h-screen`; `transition: all`; `outline-none` sem ring
- Icon button sem `aria-label`
- Hex de superfície em dashboard (quebra dark mode)
- Forçar `-webkit-text-fill-color` no input sem exceção para `::placeholder`
- Vermelho como CTA de fluxo feliz

---

## 13. Tokens → código (Nuxt UI)

| Token | Código |
|-------|--------|
| primary | `brand` / Stitch `#005ea4` (dark: brand-400 `#1477cb`) |
| secondary (destrutivo) | `accent` / Stitch `#b6171e` |
| neutral | `workshop` ← surface `#fcf9f8` / on_surface `#1c1b1b` |
| success | `ok` / `#16a34a` |
| warning | `caution` / `#b45e00` (400 = `#d97706` Pendente) |
| radius | `--ui-radius: 0.5rem` (8px / ROUND_EIGHT) |
| sans / mono | Public Sans / JetBrains Mono |
| tokens JS | `STITCH_COLORS` em `layers/1.base/app/utils/brand.ts` |
| tokens CSS | `--stitch-*` + escalas em `main.css` |

Fonte de verdade: este arquivo + `.stitch/SCREENS.md`. Atualizar ambos ao fechar uma tela no Stitch/código.
