# Voz — Perguntas livres (parte 3 da cobertura total)

Parte 3 de 3 da cobertura total por voz (parte 1: preencher e agir; parte 2: controles de tela — entregues).

## Objetivo

Perguntar qualquer coisa sobre a oficina, de qualquer tela, e receber a resposta na tela e falada, com atalhos para os registros citados. A conversa lembra as perguntas anteriores até o painel fechar.

```
"quantas OS estão abertas?"                → "Há 7 OS abertas." + atalhos
"quanto faturei este mês?" → "e em agosto?" → segue o contexto
"qual o telefone do João da Silva?"        → número real na tela/fala (a IA só viu [telefone 1])
"quando o ABC1D23 veio por último?"        → data + "Abrir OS 1234"
"quais contas vencem esta semana?"         → lista + "Abrir financeiro"
```

## Decisões

| Tema | Decisão |
|---|---|
| Alcance | Geral: OS/orçamentos, clientes/veículos, agenda, financeiro, catálogo/estoque, equipe — independente da tela atual |
| Permissão | A mesma das telas (`can(papel, …)`); sem permissão a ferramenta não consulta e a IA explica |
| Conversa | Curta, no mesmo modal; histórico até fechar o painel (máx. 10 mensagens) |
| Resposta | Texto + fala pt-BR (`speechSynthesis`, botão mudo lembrado) + atalhos para registros citados |
| Dados pessoais | CPF/CNPJ, telefone, e-mail viram marcadores para a IA; o servidor troca pelos reais antes de mostrar |
| Abordagem | IA com ferramentas de leitura no servidor (tool calling), só Groq |

Regras que continuam: a voz nunca grava no banco; chaves só no `runtimeConfig` do servidor; rota exige login.

## 1. Fluxo

```
fala → modal → /api/voice/interpret ─ IA: comando (como hoje) ou {"op":"ask"}
  ask → o modal vira conversa → POST /api/voice/ask { messages, today }
        servidor: auth → papel (profiles) → Groq + ferramentas
                  ↺ até 3 rodadas de consulta (Supabase do usuário + can(papel))
                    resultado mascarado → IA
                  → final_answer { answer, refs } → servidor desmascara, valida refs, monta links
  ← { answer, refs: [{ label, to }], history } → bolha na tela + fala + botões de atalho
```

- `interpret`: o prompt ganha `{"op":"ask"}` para perguntas sobre dados ("quantos", "quanto", "qual", "quando", "tem…?"); o normalizador aceita `{ op: 'ask' }` sem outros campos. `useVoiceCommand.run` devolve `{ ok: true, ask: true }` sem navegar.
- Em modo conversa, toda fala vai direto para `/ask` (com histórico) — "e em agosto?" não pode ser reinterpretado como comando. Para comandar: fechar o painel ou tocar num atalho.
- Fechar o painel apaga a conversa e cancela fala e requisição em andamento.

## 2. Servidor — `server/api/voice/ask.post.ts` + `server/utils/voice-ask/`

### Entrada

`{ messages: { role: 'user' | 'assistant', content: string }[], today: 'YYYY-MM-DD' }`

- Exige `serverSupabaseUser`; papel lido de `profiles.papel` com `serverSupabaseClient(event)`.
- Última mensagem é do usuário; até 10 mensagens (excedente descartado do início); cada `content` ≤ 2000 caracteres. Inválido → 400.
- O histórico do assistente que volta do cliente é a versão mascarada (`history` da resposta anterior), nunca o texto com dados reais.

### Laço de ferramentas — `loop.ts`

- Provedores: `groqModel` e `groqFallbackModel` (sem Gemini). Chamada OpenAI-compatível com `tools` e `tool_choice: 'required'`; 8 s por chamada, 25 s no total.
- Toda rodada chama ao menos uma ferramenta. Até 3 rodadas de dados; na 4ª, `tool_choice` força `final_answer`.
- `final_answer({ answer: string, refs?: { type, id }[] })` encerra.
- Falha do provedor em todas as tentativas → 503 "Não consegui responder agora. Tente de novo."
- Função pura com `fetch` e executor de ferramentas injetados (testável sem rede/banco).

### Ferramentas — `tools.ts`

Cada uma: schema JSON para a IA, validação dos argumentos no servidor (datas `YYYY-MM-DD`, enums, limite ≤ 10), checagem de permissão, consulta só de leitura. Retorna ≤ 10 linhas + `total`; textos cortados em 200 caracteres; datas ISO e números crus (a IA formata em pt-BR).

| Ferramenta | Argumentos | Retorno | Permissão |
|---|---|---|---|
| `search_orders` | status, placa, numero, cliente, from, to, pago, limit | id, numero, status, orcamento_status, placa, veículo, cliente, aberta_em, concluida_em, valor_total, pago + total | — |
| `get_order` | id \| numero \| placa (OS mais recente) | OS + itens do orçamento (descrição, qtd, valor) + pagamento | — |
| `search_customers` | nome, documento, telefone | id, nome, ativo, telefone, email, documento (mascarados), nº veículos | — |
| `customer_summary` | id | veículos, nº de OS, total gasto, último atendimento | — |
| `vehicle_history` | placa | veículo, dono, últimas OS, total gasto, próximo agendamento | — |
| `list_appointments` | from, to, placa, status | id, início, fim, placa, cliente, serviço, status | — |
| `finance_summary` | mes (YYYY-MM) | RPC `finance_summary` | `finance.view` |
| `list_accounts` | status (a_pagar\|pagas\|vencidas), from, to | id, descrição, valor, vencimento, status, categoria | `finance.view` |
| `search_catalog` | nome, tipo | id, nome, tipo, valor_padrao, estoque, ativo | `budget.edit` ou `catalog.manage` |
| `team_stats` | from, to | por colaborador: OS abertas (`aberto_por`) e concluídas | `collaborators.manage` |

- Sem permissão → `{ erro: 'sem_permissao', area }`, sem consulta. Erro de banco → `{ erro: 'falha_consulta' }`. Argumento inválido → `{ erro: 'argumento_invalido', campo }`.
- "OS do Pedro" = abertas por ele (não há mecânico responsável na OS).

### Mascaramento — `mask.ts` (puro)

- Um mapa por requisição: valor real ↔ marcador `[telefone 1]`, `[email 1]`, `[documento 1]`.
- Mascara: campos `telefone(s)`/`email`/`documento` dos resultados e padrões de CPF, CNPJ, telefone e e-mail no texto do usuário e no histórico.
- Argumentos de ferramenta com marcador são trocados pelo valor real antes da consulta.
- `answer` final: marcadores do mapa trocados pelos reais (resposta ao cliente); `history` = `answer` ainda mascarado.
- Limite conhecido: marcadores valem só dentro de uma requisição; um marcador antigo repetido pela IA aparece como texto.

### Registros citados — `refs.ts` (puro)

- Só vira link um `{ type, id }` que apareceu em resultado de ferramenta nesta requisição (o rótulo vem desse resultado).
- Links: order → `/ordens/:id` ("Abrir OS 1234"), customer → `/clientes/:id`, vehicle → `/veiculos/:id`, appointment → `/agendamentos?dia=YYYY-MM-DD`, account → `/gestao/financeiro?aba=contas`. Máx. 5.

### Prompt — `prompt.ts`

Português; hoje e dia da semana; papel do usuário; "responda só com dados das ferramentas, nunca invente; se não encontrar, diga; respostas curtas para serem faladas (até 3 frases), valores em reais e datas por extenso; marcadores entre colchetes devem ser repetidos exatamente". Nunca inclui senha.

### Privacidade

A IA recebe só pergunta/histórico mascarados, a data e o papel. Sem logs de pergunta, resposta ou resultado de ferramenta — só o motivo de falha do provedor. Nenhuma escrita no banco.

## 3. Cliente

- `useVoiceAsk()` (`layers/1.base/app/composables/`): `messages` (exibição: pergunta + resposta real + refs), `history` (mascarado, enviado ao servidor), `pending`, `ask(text)`, `reset()`; cancela requisição em andamento no `reset`.
- Fala: `speechSynthesis` pt-BR da `answer`; botão mudo persistido em `localStorage`; para a fala ao fechar, ao nova pergunta e ao tocar no mudo.
- `VoiceCommandButton`: com conversa ativa, o corpo mostra as bolhas (pergunta/resposta + botões de atalho `UButton :to`) e "Consultando…"; campo e microfone continuam embaixo; Enviar chama `ask`. Tocar num atalho navega e fecha o painel.
- Erro → bolha de erro "Não consegui responder agora. Tente de novo." (a pergunta fica para reenviar).

## Erros

| Situação | Resultado |
|---|---|
| Groq indisponível / chave inválida | "Não consegui responder agora. Tente de novo." |
| Ferramenta sem permissão | IA: "Seu perfil não tem acesso a …" |
| Falha no banco | IA avisa que não conseguiu consultar |
| Sem dados / fora do alcance | IA diz que não encontrou / não sabe |
| Argumento inválido da IA | Erro de ferramenta; nunca consulta crua |
| Demora | "Consultando…" com cancelar; 25 s no total |

## Testes

- `mask.test.ts`: resultados e texto do usuário mascarados; desmascarar resposta e argumentos; mesmo valor → mesmo marcador.
- `refs.test.ts`: só refs vistos viram links; URL por tipo; limite 5.
- `tools.test.ts`: validação de argumentos de cada ferramenta e gating por papel (executor de banco falso).
- `loop.test.ts`: fetch falso — rodada de ferramenta → final_answer; final forçado após 3 rodadas; falha dos dois modelos → null.
- `normalize`/`prompt` do interpret: `{ op: 'ask' }`.
- `pnpm test`, typecheck, lint, build. Validação ao vivo depende de chaves Groq válidas (hoje 401).
