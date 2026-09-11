# Screens — Auto Check Araujo

Mapa de telas para geração no Stitch. Todas seguem `.stitch/DESIGN.md`.

**Projeto Stitch:** `projects/11367835346806593695`  
**Design System:** `assets/18253519892564423504` — *Araujo Workshop OS* (v4 — namedColors Stitch ↔ Nuxt)  
**Fonte de verdade:** `.stitch/DESIGN.md` + `STITCH_COLORS` / `main.css`  
**Device padrão:** `DESKTOP` (com variante mental mobile abaixo de 768px)

---

## Prioridade de geração

| # | Tela | Path | Objetivo UX |
|---|------|------|-------------|
| 0 | Shell (header pill) | — | Pill flutuante central; sem sidebar |
| 1 | Login | `/login` | Brand-first; um CTA “Entrar”; zero fluff |
| 2 | Início | `/` | KPIs escaneáveis; um destino óbvio por linha |
| 3 | Ordens | `/ordens` | Lista densa + filtros + “Nova OS” |
| 4 | Clientes | `/clientes` | Tabela + busca; empty state com CTA |
| 5 | Veículos | `/veiculos` | Mesmo padrão de listagem (consistência) |
| 6 | Financeiro | `/gestao/financeiro` | Números mono; status pago/pendente claros |
| 7 | ~~Kanban~~ | — | Removido — fluxo coberto por `/ordens` |
| 8 | Catálogo | `/configuracao/catalogo` | Serviços, kits, peças, custos, estoque |
| 8b | Fornecedores | `/configuracao/fornecedores` | Cadastro de fornecedores |
| 8c | ~~Checklist~~ | — | Removido — diagnóstico em texto na OS |
| 9 | Agendamentos | `/agendamentos` | Dia + semana; horário marcado; sem pátio/vaga |
| 10 | Precificação | `/configuracao/precificacao` | Parâmetros de mão de obra e peças; sugestão de preço |
| 11 | Equipe | `/gestao/equipe` | CRUD de colaboradores e papéis de acesso |

---

## 0. Shell — Header pill flutuante — código Nuxt

**Referência visual:** pill central glass (`rounded-full`, blur, borda whisper) — ativo em mini-pill interna + texto bold.

**Shell (obrigatório):**
- Header fixo centralizado no topo — **sem** sidebar e **sem** TopAppBar sticky full-width
- Pill: links principais + “Mais” + lua/sol + avatar (Nova OS / Sair)
- Mobile: Menu → slideover
- Título da página **inline no body** (H1 + descrição muted)

**Main:** canvas muted; painéis `rounded-lg`; offset no layout `default`: `pt-20 sm:pt-24` sob o header fixo.

**Implementação Nuxt:** único layout `default.vue` em `layers/1.base` com `BaseAppHeader`; título de página em `BasePageHeader`. Sem `UDashboardGroup` / sidebar.

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

## 2. Início (`/`) — gerada no Stitch

**Screen id:** `projects/11367835346806593695/screens/b2aa12536086403799553cbf63697570`  
**Preview:** `.stitch/screenshots/inicio.png`  
**HTML:** `.stitch/html/inicio.html`

**Shell:** sidebar do app + navbar “Início” (não redesignar shell nesta tela).

**Body (max-w-5xl, canvas `#FAFAFA`, space-y-8):**
1. **Ordens de serviço** — label + “Ver todas →”; painel com divide-y: linha label à esquerda, número mono à direita (Abertas = primary, Em andamento = `#b45e00`) + chevron
2. **Cadastro** — painel 2 colunas centralizadas: Clientes | Veículos (números `text-4xl` mono)
3. **Financeiro** — “Detalhes →”; faixa 3 colunas: Faturamento / Recebido (`#16a34a`) / Pendente (`#d97706`)

**Painel:** branco, borda `#E5E5E5`, radius 8px (`rounded-lg`), sombra suave.

**Motion:** stagger das seções (60ms); hover scale leve nos números de OS; `prefers-reduced-motion`.

**Proibido:** 3 KPI cards iguais com ícones decorativos.

---

## 3. Ordens (`/ordens`)

**Navbar:** “Ordens de serviço” + ações (Nova OS primary).

**Body:** filtros de status (chips ou select) + tabela (OS, placa, cliente, status badge, data). Empty: “Nenhuma ordem. Criar OS”.

**Trunk test:** título, nav ativa “Ordens”, CTA visível.

---

## 4. Clientes (`/clientes`)

Mesmo padrão de listagem: busca, tabela (nome, telefone, veículos), CTA “Novo cliente”. Empty composto.

### 4b. Novo cliente (`/clientes/novo`)

**Navbar:** Cadastros → Clientes. Título no body.

**Header:** H1 “Novo cliente” + “Nome e um telefone para ligar.” + Voltar.

**Body (max-w-2xl):** um painel `bg-default shadow-sm`. Campos: Nome* → Telefone (recomendado, máscara) → E-mail → Documento (CPF/CNPJ) → “Adicionar observação”. Sem Status.

**Footer sticky:** Cancelar | CTA “Salvar cliente” / “Salvando…”.

**Estados:** erro inline + foco no primeiro; aviso ao sair com rascunho; toast “Cliente cadastrado” → detalhe.

**Trunk test:** título Novo cliente, nav Cadastros, CTA Salvar cliente.

**Proibido:** InputTags com “Enter para adicionar”; campo Ativo; dois primários.

### 4c. Detalhe / editar cliente (`/clientes/:id`)

**Header:** nome do cliente + badge Ativo/Inativo + Voltar.

**View:** ações Editar (soft primary) | Desativar/Reativar | Excluir. Painel `dl` escaneável — não formulário disabled.

**Edit:** descrição “Altere os dados e salve.” Mesmos campos do create. Sticky Cancelar + “Salvar alterações” / “Salvando…”. Confirma saída com rascunho.

**Abaixo:** Veículos e Ordens (sempre visíveis).

**Trunk test:** título = nome, badge de status, CTA Editar ou Salvar alterações.

**Proibido:** campos disabled como leitura; Status no form de edição.

---

## 5. Veículos (`/veiculos`)

Tabela: placa (mono), modelo, cliente, ações. Consistência visual total com Clientes.

### Novo (`/veiculos/novo`)

Paridade com Novo cliente: painel + sticky “Salvar veículo”, máscara de placa, dirty leave.

### Detalhe (`/veiculos/:id`)

Breadcrumb `Clientes › Nome › Placa` (com proprietário). Botão Voltar (smart-back). Summary `dl` ↔ edit form, discard modal, OS ocultas na edição.

---

## 6. Financeiro (`/gestao/financeiro`)

**Navbar:** “Financeiro” + filtro de mês (Resumo / Recebíveis / Histórico).

**Abas:** Resumo | Contas | Recebíveis | Categorias | Histórico

- **Resumo:** painéis de métricas (OS + despesas + fluxo caixa) + lista de vencimentos (14 dias / atrasados)
- **Contas:** form nova conta + filtros A pagar / Pagas / Vencidas / Todas + tabela com status e ações
- **Recebíveis:** tabela de OS do mês (pago/pendente)
- **Categorias:** CRUD de categorias de despesa
- **Histórico:** movimentos do mês (entradas OS / saídas contas) por data de pagamento

Números `tabular-nums`. Sem gráficos decorativos.

---

## 7. ~~Kanban~~ (`/kanban`) — removido

Fluxo coberto por `/ordens` (lista + filtros de status). Não regenerar.

---

## 8. Catálogo (`/configuracao/catalogo`)

**Navbar:** “Cadastro de Serviços e Peças”

**Subtítulo:** “Base completa para acelerar os orçamentos.”

**Abas:** Catálogo | Fornecedores | Precificação

**Aba Catálogo:** filtros Serviços / Kits / Peças + form (nome, tipo, valor, custo, estoque, fornecedor, composição de kit) + tabela com Status.

**Aba Fornecedores:** form + tabela (nome, telefone, e-mail, status).

**Proibido:** cards decorativos de feature; hero marketing.

---

## 9. Agendamentos (`/agendamentos`)

**Spec visual:** `layers/11.scheduling/DESIGN.md` (workshop ledger).

**Masthead:** eyebrow “Agendamentos”; número do dia mono grande + weekday (ou intervalo da semana); busca + CTA “Novo agendamento”. Chevrons, Hoje, Dia | Semana, filtro.

**Body — Dia:** lista do dia com blocos (barra esquerda de status, ~horário). Clique edita; Ver OS / Abrir OS; **Faltou**.

**Body — Semana:** grade de 7 dias com contagem; clique abre o dia.

**Form:** veículo, data, horário aproximado, problema relatado. Sem fim, sem status select, sem vaga.

**Empty:** “Nenhum horário neste dia.” + Novo agendamento.

**Fora de escopo:** pátio/vaga, mês, PDF, painel de faltas, máquina de status completa.

**Proibido:** hero marketing; purple.

**Trunk test:** eyebrow, data óbvia, CTA Novo agendamento.

---

## 10. Controle de Vendas (`/vendas`) — removido

Tela descontinuada: conteúdo coberto por `/gestao/financeiro`. Redirect: `/vendas` → `/gestao/financeiro`.

---

## 11. Precificação (`/configuracao/precificacao`)

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
| Taxas | Débito (%), Crédito (%) | Líquido e valor a cobrar (exemplos) |

**Helper:** “Usado ao precificar serviços no orçamento.” / markup sobre custo do catálogo.

**Proibido:** H1 “Calculadoras Inteligentes”, tagline “Nunca mais erre…”, hero marketing, 3 feature cards.

**Motion (código):** page enter; result strip atualiza sem flicker ao editar inputs.

**Trunk test:** título Precificação, nav ativa, CTA Salvar visível.

**Dados (app):** tabela singleton `oficina_parametros`; permissão `catalog.manage` (gerente).

---

## 12. Equipe (`/gestao/equipe`)

**Stitch:** `screens/391ac751b4d045fe88c64b4d0bf4c8fa` — *Gestão da Equipe - Araujo Auto Center*  
**Screenshot local:** `.stitch/screenshots/equipe.png`

**App:** `layers/8.management/app/pages/team.vue` — menu Gestão → Equipe; `/colaboradores` e `/equipe` redirecionam para `/gestao/equipe`.

**Navbar:** Gestão → Equipe (gerente / `collaborators.manage`).

**Subtítulo:** “Quem entra no sistema e com qual papel.” — uma linha.

**Body:**
- Lista (UTable) em painel: avatar/iniciais, usuário mono, papel editável
- Ação por linha: redefinir senha (modal)
- CTA “Novo colaborador” no header abre slideover com o form
- Empty: “Nenhum colaborador ainda.” + CTA criar
- Não permite alterar o próprio papel (badge “Você”)

**Proibido:** abas de RH; form permanente competindo com a lista; hero de marketing.

**Trunk test:** título Equipe, nav Gestão ativa, contagem, tabela, CTA novo.

**Dados (app):** `profiles` / RPCs `list_collaborators`, `update_collaborator_role` (e create via auth layer).

> Relação com `/colaboradores`: redireciona para `/gestao/equipe`. Preferir **uma** entrada no menu: Gestão → Equipe.

---

## Prompt base para Stitch (copiar)

```
Desktop dashboard for Araujo Auto Center workshop OS system (Portuguese UI).
Follow the project Design System exactly: Public Sans, Araujo Blue #1B7ACE primary,
workshop neutrals #FAFAFA/#171717, 8px radius (rounded-lg), no purple, no Inter, no 3 equal feature cards,
no emojis, no AI marketing copy. Dense practical software UI. Sidebar + main panel.
```

Ajuste o prompt com o nome da tela e o conteúdo da seção correspondente acima.
