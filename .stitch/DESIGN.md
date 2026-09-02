# Design System: Auto Check Araujo

Sistema interno da **Araujo Auto Center** (Franca/SP) — ordens de serviço, clientes, veículos e financeiro para colaboradores da oficina. Interface de software operacional: clara, rápida de escanear e com micro-animações que confirmam ações sem distrair o trabalho.

---

## Configuration — Style Dials

| Dial | Level | Rationale |
|------|-------|-----------|
| **Creativity** | `5` | Personalidade de marca sem editorial exagerado — é um dashboard de oficina, não landing page |
| **Density** | `6` | App diário: tabelas, filtros e KPIs visíveis; whitespace suficiente para respirar, sem “galeria” |
| **Variance** | `4` | Layouts previsíveis e consistentes (mesma sidebar, mesmos headers) — usuários muddling through |
| **Motion Intent** | `7` | Experiência viva: springs, stagger de listas, feedback tátil; nunca cinema que atrasa a tarefa |

> Stitch gera telas estáticas. A seção **Motion** documenta a intenção para implementação em Nuxt + Motion Vue (`motion-v`).

---

## 1. Visual Theme & Atmosphere

Oficina moderna sob luz fria de LED — **prático, metálico, confiável**. Densidade de cockpit leve (Level 6): o colaborador enxerga status da OS, placa e valores sem caçar. Atmosfera **workshop-clean**: superfícies claras, azul da marca como único accent de ação, tipografia sem serifa legível em tablet e desktop.

Sensação alvo: ferramenta profissional que “responde” ao toque — cada clique tem peso (spring), cada lista entra em cascata, cada salvamento confirma status. Sem marketing fluff. Sem purple neon. Sem cards decorativos sem função.

**Brand test (login):** a primeira viewport deve ser inequivocamente Araujo — logo herói, azul da marca, copy curta de acesso interno. Remover a nav e ainda reconhecer a oficina.

---

## 2. Color Palette & Roles

### Surfaces & Neutrals (workshop)
- **Workshop Canvas** (#FAFAFA / workshop-50) — Fundo de página / painel body
- **Workshop Surface** (#FFFFFF) — Cards, tabelas, formulários, sidebar
- **Workshop Elevated** (#F5F5F5 / workshop-100) — Hover de linhas, inputs muted
- **Charcoal Ink** (#171717 / workshop-900) — Texto principal — nunca `#000000`
- **Steel Mute** (#737373 / workshop-500) — Labels secundários, metadados, helper
- **Dimmed** (#A3A3A3 / workshop-400) — Placeholders, disabled
- **Whisper Border** (#E5E5E5 / workshop-200) — Bordas 1px estruturais
- **Deep Workshop** (#0A0A0A / workshop-950) — Fundo dark mode

### Accent (único — primary)
- **Araujo Blue** (#1B7ACE / brand-500) — CTAs primários, nav ativa, focus rings, links de ação
- **Araujo Blue Bright** (#0889E6 / brand-400) — Primary em dark mode / hover claro
- **Araujo Blue Deep** (#035599 / brand-800) — Texto sobre fundos claros de destaque, estados pressed

### Semantic (não são “segundo accent” de marca)
- **Signal Red** (#D32F2F / accent-500) — Destrutivo, erros, badge “AUTO CENTER” da logo — **nunca** como CTA primário de fluxo feliz
- **Success Green** — Recebido / concluído (Nuxt UI `green`)
- **Warning Amber** — Pendente / atenção (Nuxt UI `amber`)

### Shadows
- **Diffused Panel** — `0 1px 2px rgba(10,10,10,0.04), 0 4px 12px -4px rgba(10,10,10,0.06)` — painéis e tabelas
- Sem glow externo, sem sombra colorida azul/roxa

### Banned colors
- Purple / violet / indigo neon gradients (“AI purple”)
- Pure black `#000000` em texto ou fundo
- Accent saturado > 80% fora da escala brand já definida
- Misturar cinzas quentes (cream/terracotta) com este sistema frio

---

## 3. Typography Rules

- **Display / UI headings:** `Public Sans` — weight 600–700, tracking tight (`-0.02em` em títulos), hierarchy por peso e cor, não por tamanho gritante
- **Body:** `Public Sans` 400 — leading `1.5–1.65`, máx. ~65ch em textos longos (raros no app)
- **Mono / Numbers:** `JetBrains Mono` ou `ui-monospace` — placas, valores monetários, contadores KPI, IDs — sempre `tabular-nums`
- **Section labels:** `Public Sans` 600, `0.75rem`, `uppercase`, `tracking-wide`, cor Steel Mute

### Scale (dashboard)
| Token | Size | Use |
|-------|------|-----|
| Page title | `1.25rem` / `1.5rem` | Navbar / H1 da página |
| Section | `0.75rem` uppercase | “Ordens de serviço”, “Financeiro” |
| KPI number | `1.875rem`–`2.25rem` mono | Contadores do Início |
| Body | `0.875rem`–`1rem` | Tabelas, formulários |
| Meta | `0.75rem`–`0.8125rem` | Timestamps, papel do colaborador |

### Banned
- `Inter` como fonte de marca (Public Sans já é a voz do produto)
- Serif em qualquer tela do dashboard
- Títulos com gradient text

### Copy (UX — Krug)
- Labels óbvios em português: “Entrar”, “Nova OS”, “Salvar”, “Excluir”
- Cortar metade das palavras; sem happy-talk (“Bem-vindo ao nosso sistema…”)
- Erros = o quê + como corrigir: “Usuário ou senha incorretos. Tente de novo.”
- Loading: “Salvando…”, “Carregando…” (ellipsis tipográfico `…`)
- Um termo por conceito: sempre “Ordens de serviço” / “OS”, não misturar “Pedidos”

---

## 4. Component Stylings

### Buttons
- Primary: fill Araujo Blue, texto branco, radius `0.375rem` (6px — alinha `--ui-radius`)
- Secondary: ghost / outline neutral
- Destructive: Signal Red outline ou soft
- Active: `scale(0.98)` + spring — feedback tátil
- Hover: escurece 1 step da escala, **sem** glow
- Min touch target `44×44px`; em mobile primary full-width quando for CTA de formulário
- Label específico: “Salvar OS”, não “Continuar”
- Icon-only: obrigatório `aria-label`

### Panels / Tables (cards com propósito)
- Usar painel com borda Whisper + Diffused Panel **somente** quando agrupa interação ou dados
- Preferir `divide-y` em listas densas em vez de grid de 3 cards iguais
- Radius `0.375rem`–`0.5rem` (software, não “pill blob” 2.5rem)
- Padding interno `1rem`–`1.5rem` (mobile `1rem`)

### Inputs / Forms
- Label acima; helper opcional; erro abaixo em Signal Red
- Focus ring: Araujo Blue `2px` com offset — nunca `outline-none` sem substituto
- `autocomplete` / `name` / `type` corretos; username com `spellcheck="false"`
- Placeholder termina com `…` e mostra exemplo real: `ex.: joao.silva`
- Submit permanece habilitado até o request iniciar; depois loading no botão
- Unsaved changes: avisar antes de sair

### Navigation (Trunk Test)
- Logo Araujo sempre visível (sidebar header)
- Item ativo: fundo `primary/10` + texto primary + highlight
- Página atual: título claro na navbar (“Início”, “Clientes”, “Financeiro”)
- CTA contextual “Nova OS” no footer da sidebar (quem tem permissão)
- Footer: nome do colaborador · papel · Sair · color mode
- Sidebar colapsável; ícones com labels quando expandida

### Loaders
- Skeleton shimmer alinhado ao layout (KPI, linhas de tabela) — **não** spinner circular genérico como padrão
- Toasts / validação: `aria-live="polite"`

### Empty states
- Ícone Lucide + uma linha + CTA: “Nenhuma OS aberta. Criar OS”
- Nunca só “No data”

### Status badges (OS)
- Cores de `ORDEM_STATUS_COLOR` / labels em PT — consistentes em tabela, detalhe e print

---

## 5. Layout Principles

### Shell do app
- `UDashboardGroup` + sidebar esquerda + painel
- Conteúdo: `max-w-5xl`–`max-w-6xl` para resumos; tabelas full-bleed do painel
- Body background Workshop Canvas; surfaces brancas
- `min-h-dvh` — nunca `h-screen`

### Page anatomy (toda página autenticada)
1. Navbar com título + sidebar toggle  
2. Uma ação primária óbvia (se aplicável)  
3. Conteúdo escaneável: seção → dados → ações secundárias  

### Home / KPIs
- **Proibido** grid de 3 cards iguais decorativos
- Usar listas com `divide-y` (Ordens) + grid 2 colunas (Cadastro) + faixa financeira em `1fr`×3 com divisores — hierarquia por densidade, não por sombra

### Login (brand-first)
- Fundo muted; card central compacto
- Logo herói → título “Sistema Interno” → tagline curta → formulário → ajuda senha
- Sem stats, sem promo, sem “scroll to explore”

### Grid
- CSS Grid para estruturas; collapse single-column `< 768px`
- Sem `calc(33% - 1rem)` hacks
- Sem sobreposição de texto/imagem (sem z-index de conteúdo)

---

## 6. Responsive Rules

- Mobile-first: colunas empilham; sidebar vira overlay/drawer
- Sem scroll horizontal
- Tipografia: body ≥ `14px` / `0.875rem`
- Touch targets ≥ `44px`
- Safe areas: `env(safe-area-inset-*)` em full-bleed
- Testar: `375`, `768`, `1024`, `1440`

---

## 7. Motion & Interaction (implementação Nuxt)

> Stitch = estático. Código = `motion-v` + CSS. Respeitar **sempre** `prefers-reduced-motion: reduce` (desligar loops e reduzir a fade simples).

### Physics
- Spring padrão: `stiffness: 100`, `damping: 20`
- Sem easing linear em UI interativa
- Animar **somente** `transform` e `opacity` — nunca `top`/`left`/`width`/`height`
- Nunca `transition: all` — listar propriedades

### Core motion set (mínimo 2–3 por superfície)
1. **Page enter** — painel body: fade + `translateY(6px→0)` spring, 200–300ms  
2. **List stagger** — linhas de tabela / KPIs: delay `index * 40–60ms`, waterfall  
3. **Press feedback** — botões e rows clicáveis: `scale(0.98)` no tap  
4. **Nav active** — highlight da sidebar com layout transition suave  
5. **Skeleton shimmer** — loading; para sob reduced-motion  
6. **Toast / status** — slide+fade; interruptível  

### Perpetual (só onde agrega status)
- Pulse suave em badge “em andamento” / “pendente” (opacity 0.7↔1), pausa com reduced-motion
- Shimmer só em skeletons

### Performance
- Motion em componentes folha; não animar layouts pais pesados
- Listas > 50 itens: virtualizar; não stagger milhares de nós

---

## 8. UX Heuristics (obrigatório em toda tela)

**Score alvo: 10/10** — “Don’t Make Me Think”.

| Heurística | Aplicação no produto |
|------------|----------------------|
| Visibilidade de status | Skeleton, botão loading, toast “Salvo”, badges de OS |
| Linguagem do mundo real | Placa, cliente, OS, orçamento — jargão de oficina, não de SaaS |
| Controle do usuário | Cancelar modais, voltar, undo quando possível; confirmar exclusão |
| Consistência | Mesmos labels/rotas PT; mesmos padrões de tabela Nuxt UI |
| Prevenção de erro | Inputs mascarados (placa), defaults sensatos, warn unsaved |
| Reconhecimento | Filtros na URL, breadcrumbs/título, opções visíveis |
| Flexibilidade | Atalhos futuros (Cmd+K); CTA Nova OS sempre à mão |
| Estética minimalista | Um CTA primário por vista; cortar copy |
| Recuperação de erro | Mensagem + próximo passo; preservar input |
| Trunk test | Logo + título da página + nav + opções locais sempre óbvios |

### Severity ao auditar
- 4 = bloqueia tarefa (ex.: sem feedback de save) → corrigir imediatamente  
- 3 = falha frequente de tarefa → em breve  
- 2/1 = atrito cosmético  

---

## 9. Web Interface Guidelines (checklist de implementação)

- Focus visível com `:focus-visible`; sticky não cobre o foco
- `button` = ação; `NuxtLink`/`a` = navegação
- Imagens com `width`/`height` ou aspect; logo acima da dobra com prioridade
- Formatos: `Intl.NumberFormat` / `DateTimeFormat` (pt-BR)
- Destructive: modal de confirmação ou janela de undo — nunca delete imediato
- `touch-action: manipulation`; modais com `overscroll-behavior: contain`
- Dark: `color-scheme` coerente; superfícies workshop-950
- Headings `text-wrap: balance` / `pretty` onde couber
- Conteúdo longo: `truncate` / `min-w-0` em flex

---

## 10. Anti-Patterns (Banned)

- Emojis na UI
- `Inter` / serif genérica / gradient text em headers
- Pure black `#000000`
- Neon glow, purple AI aesthetic, cream+terracotta “AI brochure”
- Cards iguais em 3 colunas para “features”
- Hero centralizado com fluff (login pode ser centrado — é auth, não marketing hero editorial)
- “Scroll to explore”, chevrons quicando, happy-talk
- Nomes genéricos “John Doe”, “Acme”
- Copy AI: “Elevate”, “Seamless”, “Unleash”, “Next-Gen”
- Spinner circular como único loading
- `h-screen`, `transition: all`, `outline-none` sem ring
- Icon button sem `aria-label`
- Gesture-only sem alternativa teclado/click
- Sobreposição de texto em imagem
- Segundo accent competindo com Araujo Blue nos CTAs (vermelho só destrutivo/logo)

---

## 11. Tokens → código (Nuxt UI)

| Token | Onde |
|-------|------|
| primary | `brand` / `#1B7ACE` |
| secondary (destrutivo/logo) | `accent` / `#D32F2F` |
| neutral | `workshop` |
| radius | `--ui-radius: 0.375rem` |
| font | `--font-sans: 'Public Sans'` |
| Layout | `layers/1.base` + `UDashboard*` |

Manter este `DESIGN.md` como fonte de verdade para Stitch e para PRs de UI.
