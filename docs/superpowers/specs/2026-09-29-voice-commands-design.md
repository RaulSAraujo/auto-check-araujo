# Comandos por voz — Design

**Data:** 2026-09-29 · **Status:** aprovado · **Branch:** `feat/voice-commands`

## Objetivo

Permitir que o usuário **crie qualquer registro por voz**: a fala é interpretada e o **formulário de criação existente abre pré-preenchido**. O usuário confere, completa e clica em **Salvar**. Nada é gravado sem esse clique.

## Decisões

| Tema | Decisão |
|---|---|
| Escopo | Cliente, veículo, OS, agendamento, item de orçamento, conta a pagar, item de catálogo, fornecedor, colaborador |
| Custo | 100% gratuito: sem API paga, sem dependência nova |
| Captura | Web Speech API do navegador (`pt-BR`). Chrome/Edge/Safari. Firefox usa digitação |
| Interpretação | Parser próprio por **palavras-chave**, funções puras testadas com `node:test` |
| Fluxo | Pré-preenche o formulário existente; o usuário salva |
| Acionamento | Botão global de microfone no `BaseAppHeader` (desktop) + botão flutuante no mobile |
| Local | `layers/1.base` (sem layer nova). Parser puro em `app/utils/voice/` (subpasta, fora do auto-import global) |
| Handoff | Estado compartilhado `useState` consumido uma única vez pelo formulário de destino |
| Senha | **Nunca** ditada: colaborador abre com senha vazia |

## Arquitetura

```
BaseVoiceCommandButton (header)
  ├─ useSpeechRecognition()  → transcript (pt-BR, parcial ao vivo, para no silêncio)
  └─ useVoiceCommand().run(text)
       ├─ parseVoiceCommand(text, now)        utils/voice/parser.ts (puro)
       │     └─ tokenize / parseNumber / parseMoney / parsePlaca / parseDigits /
       │        parseEmail / parseDate / parseTime   utils/voice/text.ts (puro)
       ├─ usePermissions().can(permission)     bloqueia se o papel não pode
       ├─ useVoiceLookup()                     nome/placa → id (só match único)
       ├─ useVoiceDraft().setVoiceDraft(intent, draft)
       └─ navigateTo(rota do intent)
Formulário de destino
  └─ useVoiceDraft().onVoiceDraft(intent, draft => preencher estado)
```

### Arquivos (todos em `layers/1.base/app/`)

| Arquivo | Responsabilidade |
|---|---|
| `utils/voice/types.ts` | `VoiceIntent`, payloads por intent, `VoiceCommand`, `VoiceDraftMap`, `VOICE_EXAMPLES` |
| `utils/voice/text.ts` | Tokenização e extratores (número, dinheiro, placa, dígitos, e-mail, data, hora) |
| `utils/voice/parser.ts` | `parseVoiceCommand(text, now)`: detecção de intent + segmentação por palavra-chave |
| `utils/voice/*.test.ts` | Testes `node:test` |
| `composables/useSpeechRecognition.ts` | Wrapper da Web Speech API |
| `composables/useVoiceDraft.ts` | Handoff via `useState` (`setVoiceDraft` / `onVoiceDraft`) |
| `composables/useVoiceLookup.ts` | Consultas Supabase para resolver ids |
| `composables/useVoiceCommand.ts` | Orquestração: parse → permissão → lookup → draft → navegação |
| `components/VoiceCommandButton.vue` | `<BaseVoiceCommandButton />`: botão + modal com transcrição editável |

### Intents, permissões e destino

| Intent | Permissão | Destino | Consumidor |
|---|---|---|---|
| `customer.create` | `customers.write` | `/clientes/novo` | `customers-new.vue` |
| `vehicle.create` | `vehicles.write` | `/veiculos/novo` | `vehicles-new.vue` |
| `order.create` | `orders.create` | `/ordens/novo` | `orders-new.vue` |
| `appointment.create` | `scheduling.write` | `/agendamentos` | `scheduling.vue` (slideover) |
| `budgetItem.create` | `budget.edit` | rota atual `/ordens/:id` (obrigatório estar nela) | `useOrderBudgetPage` (modal) |
| `account.create` | `finance.view` | `/gestao/financeiro` | `finance.vue` (slideover) |
| `catalogItem.create` | `catalog.manage` | `/configuracao/catalogo` | `catalog.vue` (slideover) |
| `supplier.create` | `catalog.manage` | `/configuracao/fornecedores` | `catalog-suppliers.vue` (slideover) |
| `collaborator.create` | `collaborators.manage` | `/gestao/equipe` | `team.vue` (slideover) |

### Gramática (palavras-chave, sem acento/caixa)

Gatilhos (o de posição mais cedo vence; se empatar, vence o mais longo). Palavras antes do gatilho são ignoradas ("por favor novo cliente…"):

- cliente: `novo cliente`, `nova cliente`, `cliente novo`, `cadastrar|cadastra|criar cliente`
- veículo: `novo veiculo|carro`, `nova moto`, `cadastrar|cadastra|criar veiculo|carro`
- OS: `nova ordem de servico`, `nova ordem`, `nova os`, `abrir|abre ordem de servico`, `abrir|abre ordem`, `abrir|abre os`, `criar os`
- agendamento: `novo agendamento`, `criar agendamento`, `agendar`, `marcar`
- item de orçamento: `adicionar|adiciona|incluir|inclui|lancar|lanca` + `peca|servico|kit|item` (item → `servico`)
- conta: `nova conta a pagar`, `conta a pagar`, `nova conta`, `nova despesa`, `lancar conta`, `cadastrar conta`
- catálogo: `novo|nova|cadastrar|cadastra|criar` + `servico|peca|kit`
- fornecedor: `novo fornecedor`, `cadastrar|cadastra|criar fornecedor`
- colaborador: `novo colaborador`, `nova colaboradora`, `novo funcionario`, `nova funcionaria`, `cadastrar colaborador|funcionario`

Depois do gatilho, cada palavra-chave abre um segmento que vai até a próxima palavra-chave. O texto entre o gatilho e a primeira palavra-chave vai para o **campo padrão** (quando existe). A tabela completa está no plano (Task 2).

## Fluxo de dados e erros

1. O botão abre o modal e começa a ouvir (se suportado). O texto parcial aparece num textarea editável. Quando o reconhecimento termina com texto, `run(text)` é executado automaticamente. O usuário também pode editar e clicar em **Preencher**.
2. `parse` devolve `null` → alerta inline "Não entendi" com exemplos; o modal continua aberto.
3. Sem permissão → toast de aviso; nada navega.
4. `budgetItem.create` fora de `/ordens/:id` → toast "Abra uma OS para adicionar itens".
5. Lookup sem resultado único → o campo fica vazio e aparece um toast explicando (ex.: "Placa ABC-1D23 não encontrada").
6. Sucesso → `setVoiceDraft` + `navigateTo`, toast "Formulário preenchido por voz — confira e salve", modal fecha. Se a navegação for bloqueada (guard de alterações não salvas), o draft pendente é descartado.
7. Erros do microfone: `not-allowed` → "Permita o acesso ao microfone"; `no-speech` → "Não ouvi nada, tente de novo".

## Testes e validação

- `pnpm test` (novo script): `node --test` sobre `shared/**` e `layers/**/*.test.ts`. Cobre o extrator de texto e o parser com dezenas de frases reais.
- `pnpm typecheck` e `pnpm lint` sem erros.
- Validação no navegador: **dispensada pelo usuário**.

## Fora de escopo

Editar/excluir por voz, navegação por voz ("abrir clientes"), fala sintetizada, LLM, gravar sem confirmação.
