# Design System: Agenda da oficina

Tela `/agendamentos` — Araujo Auto Center. Complementa `.stitch/DESIGN.md` (tokens de marca). Não inventa paleta nova.

**Stitch project:** `projects/11367835346806593695`  
**Asset:** `assets/18253519892564423504`

---

## Configuration — Style Dials

| Dial | Level | Rationale |
|------|-------|-----------|
| **Creativity** | `5` | Personalidade de oficina, não editorial de landing |
| **Density** | `6` | App diário: data e blocos visíveis sem caça |
| **Variance** | `4` | Masthead à esquerda; dia lista / semana grade |
| **Motion Intent** | `6` | Stagger dos blocos, press tátil; sem cinema |

---

## 1. Visual Theme & Atmosphere

**Workshop ledger.** A data do dia (ou intervalo da semana) é o instrumento — número mono grande, como um KPI da home. A agenda é um caderno de oficina: superfície branca (`#ffffff` / `bg-default`) sobre canvas (`#fcf9f8` / `bg-muted`), uma barra de status na esquerda de cada bloco.

Sensação: recepção às 7h45, placa e horário saltam. Sem lista “crua”, sem mapa de pátio, sem purple neon.

---

## 2. Color Palette & Roles

Herdado de `.stitch/DESIGN.md`. Nesta tela:

- **Canvas White** (`#fcf9f8`) — fundo do painel
- **Pure Surface** (`#ffffff`) — cartões da agenda e semana
- **Charcoal Ink** (`#1c1b1b`) — número do dia, nome do cliente
- **Muted Steel** (`#414752`) — weekday, serviço, labels uppercase
- **Whisper Border** (`#e5e2e1`) — 1px nos painéis
- **Araujo Blue** (`#005ea4`) — único accent de ação (Novo, foco, dia de hoje)
- **Caution** (`#b45e00`) — em atendimento
- **Ok** (`#16a34a`) — confirmado
- **Error** (`#ba1a1a`) — falta / não compareceu

Sombras: `shadow-sm` light; `dark:shadow-none`.

---

## 3. Typography Rules

- **Display:** Public Sans 600 no weekday; **JetBrains Mono** 700 no dia (`text-5xl` / `clamp(2.25rem, 4vw, 3rem)`), `tabular-nums`, tracking tight
- **Body:** Public Sans 400, 14–16px
- **Mono:** placas, horários, contagens
- **Eyebrow:** `text-xs font-semibold uppercase tracking-widest text-muted` — “Agendamentos”
- **Banned:** Inter, serif, gradient text, títulos `text-2xl` competindo com o número do dia

---

## 4. Component Stylings

- **Masthead:** split — data à esquerda, busca + um CTA “Novo agendamento” à direita. Tabs Dia | Semana.
- **Buttons:** primary só no Novo. Ghost nos chevrons. Active `scale(0.98)`. Sem glow.
- **Appointment block:** superfície `bg-default`, `rounded-lg`, `shadow-sm`, `border border-default`, **barra esquerda 3px** na cor do status. Horário mono muted. Placa mono. Nome highlighted. Serviço numa linha muted. Ações ghost (OS) fora do hit de editar.
- **Week grid:** mesma superfície. Sete células. Hoje = número `text-primary`. Contagem = mono `text-xs text-primary`. Clique abre o dia.
- **Inputs:** label acima no slideover. Placeholder termina em `…`.
- **Loaders:** skeleton no tamanho dos blocos, não spinner.
- **Empty:** “Nenhum horário neste dia.” + CTA Novo.

**Fora de escopo:** mapa de pátio/vaga, calendário mensal, PDF do dia, painel de faltas.

---

## 5. Layout Principles

- Max-width 1400px centrado no body do dashboard
- Uma coluna (lista do dia ou grade da semana)
- Masthead left-aligned (não centrado)
- Sem 3 cards iguais de feature
- `min-h-dvh` no shell existente; conteúdo `p-4 sm:p-6`

---

## 6. Motion & Interaction

- Só `transform` / `opacity`; duration `--duration-ui` (200ms)
- Stagger dos blocos: 40ms; `prefers-reduced-motion: reduce` desliga
- Press: `motion-safe:active:scale-[0.98]`
- Ponto “ao vivo” no dia de hoje: pulse opacidade; desliga com reduced motion

---

## 7. Anti-Patterns (Banned)

- Emojis; Inter; serif; `#000000`; purple neon
- Grade 07:00–18:00 com faixas “Livre” vazias
- Mapa de vagas / pátio
- Lista sem superfície (texto solto no canvas)
- Hero marketing; “Scroll to explore”
- Título de página gritando contra o número do dia
- `transition: all`; icon button sem `aria-label`

---

## 8. Tokens → código

Mesma tabela de `.stitch/DESIGN.md` §13. Componentes: prefixo `Scheduling`, tokens `bg-muted` / `bg-default` / `text-highlighted` / `border-default` / `text-primary`.
