# Design System: Agenda da oficina

Tela `/agendamentos` — Araujo Auto Center. Complementa `.stitch/DESIGN.md` (tokens de marca). Não inventa paleta nova.

**Stitch project:** `projects/11367835346806593695`  
**Asset:** `assets/18253519892564423504`

---

## Configuration — Style Dials

| Dial | Level | Rationale |
|------|-------|-----------|
| **Creativity** | `5` | Personalidade de oficina, não editorial de landing |
| **Density** | `6` | App diário: data, blocos e pátio visíveis sem caça |
| **Variance** | `4` | Split assimétrico 1fr / 17rem; masthead à esquerda |
| **Motion Intent** | `6` | Stagger dos blocos, press tátil; sem cinema |

---

## 1. Visual Theme & Atmosphere

**Workshop ledger.** A data do dia é o instrumento — número mono grande, como um KPI da home. A agenda é um caderno de oficina: superfície branca (`#ffffff` / `bg-default`) sobre canvas (`#fcf9f8` / `bg-muted`), uma barra de status na esquerda de cada bloco, pátio como mapa de 8 vagas.

Sensação: recepção às 7h45, placa e horário saltam. Sem lista “crua”, sem grade 07–18 vazia, sem purple neon.

---

## 2. Color Palette & Roles

Herdado de `.stitch/DESIGN.md`. Nesta tela:

- **Canvas White** (`#fcf9f8`) — fundo do painel
- **Pure Surface** (`#ffffff`) — masthead implícito + cartões da agenda, pátio, mês
- **Charcoal Ink** (`#1c1b1b`) — número do dia, nome do cliente
- **Muted Steel** (`#414752`) — weekday, serviço, labels uppercase
- **Whisper Border** (`#e5e2e1`) — 1px nos painéis
- **Araujo Blue** (`#005ea4`) — único accent de ação (Novo, foco, dia de hoje, vaga ocupada)
- **Caution** (`#b45e00`) — em atendimento
- **Ok** (`#16a34a`) — confirmado
- **Error** (`#ba1a1a`) — falta / não compareceu

Sombras: `shadow-sm` light; `dark:shadow-none`.

---

## 3. Typography Rules

- **Display:** Public Sans 600 no weekday; **JetBrains Mono** 700 no dia (`text-5xl` / `clamp(2.25rem, 4vw, 3rem)`), `tabular-nums`, tracking tight
- **Body:** Public Sans 400, 14–16px
- **Mono:** placas, horários, vagas, contagens
- **Eyebrow:** `text-xs font-semibold uppercase tracking-widest text-muted` — “Agendamentos”
- **Banned:** Inter, serif, gradient text, títulos `text-2xl` competindo com o número do dia

---

## 4. Component Stylings

- **Masthead:** split — data à esquerda, busca + um CTA “Novo agendamento” à direita. Sem H1 “Agendamentos” em 24px.
- **Buttons:** primary só no Novo. Ghost nos chevrons. Active `scale(0.98)`. Sem glow.
- **Appointment block:** superfície `bg-default`, `rounded-lg`, `shadow-sm`, `border border-default`, **barra esquerda 3px** na cor do status. Horário mono muted. Placa mono. Nome highlighted. Serviço + vaga numa linha muted. Ações ghost xs (OS, não compareceu) fora do hit de editar.
- **Cards:** só estes blocos e os dois painéis laterais. Listas internas com `divide-y` se densas.
- **Patio map:** grelha 4×2, célula ≥44px. Ocupada: `bg-primary/10` + placa. Livre: borda dashed whisper + número muted. Clique reserva ou edita.
- **Calendar:** mesma superfície. Célula `min-h-16`. Hoje = número `text-primary`. Contagem = mono `text-xs text-primary`. Sem borda em cada dia vazio.
- **Inputs:** label acima no slideover. Placeholder termina em `…`.
- **Loaders:** skeleton no tamanho dos blocos (h-20), não spinner.
- **Empty:** ícone calendário + “Nenhum horário neste dia.” + CTA Novo — composição, não uma linha órfã.

---

## 5. Layout Principles

- Max-width 1400px centrado no body do dashboard
- Grid `1fr / 17rem` acima de 1280px; uma coluna abaixo de 768px
- Masthead left-aligned (não centrado)
- Sem 3 cards iguais de feature
- `min-h-dvh` no shell existente; conteúdo `p-4 sm:p-6`
- Cada zona espacial própria — sem overlay de texto

---

## 6. Motion & Interaction

- Spring stiffness 100, damping 20 (quando Motion Vue)
- Só `transform` / `opacity`; duration `--duration-ui` (200ms)
- Stagger dos blocos: 40ms em cascata; `prefers-reduced-motion: reduce` desliga
- Press: `motion-safe:active:scale-[0.99]` nos blocos
- Ponto “ao vivo” no dia de hoje: pulse opacidade; desliga com reduced motion

---

## 7. Anti-Patterns (Banned)

- Emojis; Inter; serif; `#000000`; purple neon
- Grade 07:00–18:00 com faixas “Livre” vazias
- Lista sem superfície (texto solto no canvas)
- Badge + chip + dois outline buttons empilhados no mesmo cartão
- Hero marketing; “Scroll to explore”
- Três painéis `BasePanel` aninhados com o mesmo peso visual
- Título de página gritando contra o número do dia
- `transition: all`; `h-screen`; icon button sem `aria-label`
- Vermelho como CTA feliz

---

## 8. Tokens → código

Mesma tabela de `.stitch/DESIGN.md` §13. Componentes: prefixo `Scheduling`, tokens `bg-muted` / `bg-default` / `text-highlighted` / `border-default` / `text-primary`.
