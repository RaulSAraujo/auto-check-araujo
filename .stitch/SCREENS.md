# Screens — Auto Check Araujo

Mapa de telas para geração no Stitch. Todas seguem `.stitch/DESIGN.md`.

**Projeto Stitch:** `projects/11367835346806593695`  
**Design System:** `assets/18253519892564423504` — *Araujo Workshop OS*  
**Device padrão:** `DESKTOP` (com variante mental mobile `< 768px`)

---

## Prioridade de geração

| # | Tela | Path | Objetivo UX |
|---|------|------|-------------|
| 1 | Login | `/login` | Brand-first; um CTA “Entrar”; zero fluff |
| 2 | Início | `/` | KPIs escaneáveis; um destino óbvio por linha |
| 3 | Ordens | `/ordens` | Lista densa + filtros + “Nova OS” |
| 4 | Clientes | `/clientes` | Tabela + busca; empty state com CTA |
| 5 | Veículos | `/veiculos` | Mesmo padrão de listagem (consistência) |
| 6 | Financeiro | `/financeiro` | Números mono; status pago/pendente claros |
| 7 | Kanban | `/kanban` | Board visual da oficina; colunas por etapa; alertas |
| 8 | Catálogo | `/catalogo` | Serviços, kits, peças, custos, fornecedores, estoque |
| 9 | Agendamentos | `/agendamentos` | Agenda diária, calendário, no-show, pátio, PDF, busca |
| 10 | Controle de Vendas | `/vendas` | Ticket médio, faturamento, comissão; filtros período/colaborador |
| 11 | Precificação | `/precificacao` | Parâmetros de mão de obra e peças; sugestão de preço |
| 12 | Gestão da Equipe | `/equipe` | Desempenho e produtividade; abas Colaboradores → Ocorrências |

---

## 1. Login (`/login`) — gerada no Stitch

**Screen id:** `projects/11367835346806593695/screens/ce416a8e3a574b4ebbacf0c39798deab`  
**Preview:** `.stitch/screenshots/login.png`

**Layout:** split-screen assimétrico (~45/55). Esquerda: gradiente marca + logo + Franca/SP + “Sistema interno da oficina.” + status “Sistema online”. Direita: canvas muted + coluna form.

**Conteúdo (form):**
1. Eyebrow: “Acesso colaboradores”
2. H1: “Entrar”
3. Apoio: “Use seu usuário e senha da oficina.”
4. Campos Usuário / Senha + CTA “Entrar”
5. Footer: “Esqueceu a senha? Contate o administrador.”

**Motion (código):** rise fade no brand/form; pulse no status; press scale no botão; `prefers-reduced-motion`.

**Não incluir:** stats, “saiba mais”, 3 feature cards, fluff AI.

---

## 2. Início (`/`)

**Shell:** sidebar (logo, nav, Nova OS, perfil) + navbar “Início”.

**Body (max-w-5xl):**
- Seção **Ordens de serviço** — lista divide-y: Abertas | Em andamento (números mono grandes) + link “Ver todas”
- Seção **Cadastro** — grid 2: Clientes | Veículos
- Seção **Financeiro** (se permissão) — Faturamento | Recebido | Pendente + link “Detalhes”

**Proibido:** 3 KPI cards iguais com ícones decorativos flutuantes.

**Motion:** stagger das seções e linhas (40–60ms).

---

## 3. Ordens (`/ordens`)

**Navbar:** “Ordens de serviço” + ações (Nova OS primary).

**Body:** filtros de status (chips ou select) + tabela (OS, placa, cliente, status badge, data). Empty: “Nenhuma ordem. Criar OS”.

**Trunk test:** título, nav ativa “Ordens”, CTA visível.

---

## 4. Clientes (`/clientes`)

Mesmo padrão de listagem: busca, tabela (nome, telefone, veículos), CTA “Novo cliente”. Empty composto.

---

## 5. Veículos (`/veiculos`)

Tabela: placa (mono), modelo, cliente, ações. Consistência visual total com Clientes.

---

## 6. Financeiro (`/financeiro`)

**Navbar:** “Financeiro” + filtro de mês (Resumo / Recebíveis / Histórico).

**Abas:** Resumo | Contas | Recebíveis | Categorias | Histórico

- **Resumo:** painéis de métricas (OS + despesas + fluxo caixa) + lista de vencimentos (14 dias / atrasados)
- **Contas:** form nova conta + filtros A pagar / Pagas / Vencidas / Todas + tabela com status e ações
- **Recebíveis:** tabela de OS do mês (pago/pendente)
- **Categorias:** CRUD de categorias de despesa
- **Histórico:** movimentos do mês (entradas OS / saídas contas) por data de pagamento

Números `tabular-nums`. Sem gráficos decorativos.

---

## 7. Kanban (`/kanban`)

**Navbar:** “Kanban” + CTA “Nova OS” (se permissão).

**Header da página (denso, sem marketing):**
- Título: “Kanban”
- Subtítulo curto: “Gestão visual da oficina”
- Sem hero, sem tagline longa (“em tempo real” fica implícito no board)

**Body — board horizontal full-bleed do painel:**
Quatro colunas (scroll horizontal em tablet; empilha só em mobile estreito se necessário):

| Coluna | Conteúdo do card |
|--------|------------------|
| Agendados | OS na fila (orçamento aprovado, ainda não iniciada) |
| Pré-orçamento | OS abertas em estimativa / aguardando aprovação |
| Em andamento | OS em execução |
| Finalizados | OS concluídas recentes |

Cada card (painel com borda Whisper, não decorativo):
- Número da OS (mono) + placa (mono)
- Cliente (truncate)
- Tempo na etapa (meta mono) — alerta âmbar/vermelho se atrasado
- Técnico / responsável (nome curto)
- Badge de atraso só quando aplicável (sem chips decorativos)

**Faixa superior opcional:** contagem por coluna (mono) + legenda “atraso”.

**Empty por coluna:** uma linha — “Nenhuma OS”.

**Proibido:** copy de landing (“Acompanhe toda operação…”), 3 feature cards, drag handles ornamentais, purple.

**Motion (código):** page enter; stagger dos cards por coluna (40–60ms); pulse suave só em badge de atraso.

**Trunk test:** título Kanban, nav ativa, CTA Nova OS.

---

## 8. Catálogo (`/catalogo`)

**Navbar:** “Cadastro de Serviços e Peças”

**Subtítulo:** “Base completa para acelerar os orçamentos.”

**Abas:** Catálogo | Fornecedores | Checklist

**Aba Catálogo:** filtros Serviços / Kits / Peças + form (nome, tipo, valor, custo, estoque, fornecedor, composição de kit) + tabela com Status.

**Aba Fornecedores:** form + tabela (nome, telefone, e-mail, status).

**Proibido:** cards decorativos de feature; hero marketing.

---

## 9. Agendamentos (`/agendamentos`)

**Navbar:** “Agendamentos” + busca “Buscar cliente ou placa…” + “Exportar PDF” + CTA “Novo agendamento”.

**Subtítulo:** “Agenda da oficina” (sem copy de marketing “inteligentes”).

**Toolbar:**
- Segmented: Agenda diária | Calendário
- Navegação de data (hoje / anterior / próximo)
- Filtros: Todos | Agendados | Não compareceu + filtro Pátio

**Body — Agenda diária (padrão):**
- Coluna principal: timeline 07:00–18:00 com blocos (horário mono, placa mono, cliente, serviço, badge vaga, status)
- Coluna lateral: painel **Pátio** (vagas 1–8: placa ou Livre) + lista **Não comparecimento** do dia

**Body — Calendário:** grade mensal/semanal com contagem por dia; clique abre o dia na agenda.

**Status:** agendado · confirmado · em atendimento · concluído · não compareceu · cancelado

**Empty:** “Nenhum agendamento neste dia. Novo agendamento”

**Proibido:** hero “Agendamentos Inteligentes”, 3 feature cards, purple.

**Motion (código):** page enter; stagger dos blocos da timeline; press no CTA.

**Trunk test:** título Agendamentos, nav ativa, CTA Novo agendamento.

---

## 10. Controle de Vendas (`/vendas`)

**Navbar:** “Controle de Vendas” (gerente / `finance.view`).

**Subtítulo:** “Gerencie todas as vendas da oficina.” — uma linha, sem marketing.

**Filtros (toolbar densa):**
- **Período** — range de datas (padrão: mês corrente); alternativa rápida Mês / Trimestre / Ano
- **Colaboradores** — select “Todos” ou um colaborador (`aberto_por` da OS)
- Sem CTA primary decorativo; ação útil opcional: “Exportar” (secundário)

**Faixa KPI (grid com `gap-px` + borda Whisper — não 3 cards soltos):**

| KPI | Conteúdo |
|-----|----------|
| Ticket médio | `faturamento ÷ qtd OS` — mono, tabular-nums |
| Faturamento | soma `valor_total` das OS concluídas no período |
| Comissão | soma estimada (ex.: % configurável × faturamento atribuído); meta mono |

**Seções do body (ordem):**

1. **Status** — strip ou lista divide-y: Pago | Pendente (valores + qtd), cores success/warning
2. **Financeiro** — tabela densa de OS: número (mono), placa (mono), colaborador, concluída em, valor, badge pago/pendente, forma de pagamento
3. **Colaboradores** — tabela/resumo: nome, qtd OS, faturamento, ticket médio, comissão — ordenável por faturamento

**Empty:** “Nenhuma venda no período.” + link para Ordens.

**Proibido:** hero de vendas, gráficos pizza decorativos, 3 feature cards, purple, copy “impulsione suas vendas”.

**Motion (código):** page enter; stagger das linhas KPI/tabela (40–60ms).

**Trunk test:** título Controle de Vendas, nav ativa, filtros de período visíveis.

**Dados (app):** base em OS `status = concluida` + `valor_total`; atribuição ao colaborador via `aberto_por`. Comissão lê `oficina_parametros.comissao_percentual`.

---

## 11. Precificação (`/precificacao`)

**Stitch:** `screens/8847180b8a184bb0825c1d82bf46d610` — *Precificação - Araujo Auto Center*  
**Screenshot local:** `.stitch/screenshots/precificacao.png`

**Navbar:** “Precificação” + CTA primary “Salvar parâmetros”.

**Subtítulo:** “Parâmetros de mão de obra e peças para orçamentos.”

**Fórmula hora cobrada:** `(valor/hora + custo fixo ÷ horas produtivas) × (1 + margem%)`.

**Body (max-w-4xl) — painéis empilhados (não 3 cards de feature):**

| Painel | Campos | Resultado vivo |
|--------|--------|----------------|
| Mão de obra | Valor/hora, Custo fixo mensal, Margem alvo (%), Horas produtivas/mês | “Hora cobrada sugerida” (mono grande) |
| Peças | Markup padrão (%), toggle Precificação automática | Exemplo: custo → preço sugerido (mono) |
| Taxas e comissão | Débito (%), Crédito (%), Comissão vendas (%) | Líquido e valor a cobrar (exemplos) |

**Helper:** “Usado ao precificar serviços no orçamento.” / markup sobre custo do catálogo / comissão em Vendas.

**Proibido:** H1 “Calculadoras Inteligentes”, tagline “Nunca mais erre…”, hero marketing, 3 feature cards.

**Motion (código):** page enter; result strip atualiza sem flicker ao editar inputs.

**Trunk test:** título Precificação, nav ativa, CTA Salvar visível.

**Dados (app):** tabela singleton `oficina_parametros`; permissão `catalog.manage` (gerente).

---

## 12. Gestão da Equipe (`/equipe`)

**Stitch:** `screens/391ac751b4d045fe88c64b4d0bf4c8fa` — *Gestão da Equipe - Araujo Auto Center*  
**Screenshot local:** `.stitch/screenshots/equipe.png`  
**Stitch (Indicadores):** `screens/7daad238a9184b9c8f230cac4a7a54e3` — *Gestão da Equipe - Indicadores*  
**Screenshot Indicadores:** `.stitch/screenshots/equipe-indicadores.png`

**App:** `layers/2.auth/app/pages/team.vue` — menu “Equipe”; `/colaboradores` redireciona para `/equipe?tab=colaboradores`.

**Navbar:** “Gestão da Equipe” (gerente / `collaborators.manage` ou permissão dedicada futura).

**Subtítulo:** “Controle de desempenho e produtividade.” — uma linha, sem marketing.

**Abas (toolbar densa, padrão Catálogo):**

| Aba | Conteúdo |
|-----|----------|
| Colaboradores | Lista da equipe (nome, papel, status); criar/editar papel — reutiliza fluxo de `/colaboradores` |
| Presença | Grade diária/semanal: presente / atrasado / ausente; filtro período + colaborador |
| Faltas | Tabela: colaborador, data, tipo (justificada / injustificada), observação; CTA “Registrar falta” |
| Avaliações | Lista de avaliações por período; nota/resumo mono; CTA “Nova avaliação” |
| Indicadores | Faixa KPI densa (`gap-px` + borda Whisper): OS concluídas, taxa de presença, faltas no mês — números mono |
| Tempo médio | Por colaborador / etapa: tempo médio em OS (mono); filtro período; ordenável |
| Ocorrências | Log: data, colaborador, tipo, descrição curta; CTA “Registrar ocorrência” |

**Filtros comuns (quando a aba exigir):** período (mês corrente padrão) + colaborador “Todos”.

**Body — aba Colaboradores (padrão v1 implementável):**
- Form criar à esquerda (desktop) + tabela Equipe à direita — espelha a página atual `/colaboradores`
- Empty: “Nenhum colaborador.” + CTA criar

**Body — abas de RH/desempenho (v1 design; schema futuro):**
- Tabelas densas + empty composto por aba (“Nenhuma falta no período.” / “Nenhuma ocorrência.”)
- Sem gráficos pizza; se houver tendência, strip mono simples

**Proibido:** hero “impulsione sua equipe”, 3 feature cards, purple, chips decorativos, ranking gamificado com medalhas.

**Motion (código):** page enter; troca de aba sem teatro; stagger das linhas (40–60ms).

**Trunk test:** título Gestão da Equipe, nav ativa, abas visíveis, CTA da aba ativa.

**Dados (app):**
- **Colaboradores** — já existe (`profiles` / RPCs de papel)
- **Presença / Faltas / Ocorrências** — migration `20260902190000_equipe_presenca_faltas_ocorrencias.sql` + UI em `/equipe`
- **Indicadores** — RPC `equipe_indicadores` (OS concluídas via `aberto_por`, taxa de presença, faltas)
- **Avaliações / Tempo médio** — schema futuro

> Relação com `/colaboradores`: a aba Colaboradores pode absorver a página atual, ou `/colaboradores` redireciona para `/equipe?tab=colaboradores`. Preferir **uma** entrada no menu: “Equipe”.

---

## Prompt base para Stitch (copiar)

```
Desktop dashboard for Araujo Auto Center workshop OS system (Portuguese UI).
Follow the project Design System exactly: Public Sans, Araujo Blue #1B7ACE primary,
workshop neutrals #FAFAFA/#171717, 6px radius, no purple, no Inter, no 3 equal feature cards,
no emojis, no AI marketing copy. Dense practical software UI. Sidebar + main panel.
```

Ajuste o prompt com o nome da tela e o conteúdo da seção correspondente acima.
