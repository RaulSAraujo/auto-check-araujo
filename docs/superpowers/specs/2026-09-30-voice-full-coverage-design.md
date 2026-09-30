# Voz — cobertura total, parte 1: preencher e acionar tudo

Data: 2026-09-30 · Branch: `feat/voice-commands` · Antecessora: `2026-09-29-voice-ai-edit-design.md` (v2)

## Contexto

A v2 cobre ~36 de ~210 ações do app (inventário de 2026-09-30). O objetivo é 100% de cobertura, dividido em três entregas independentes:

1. **Preencher e acionar tudo** (esta spec): todo campo e toda ação de todas as telas autenticadas.
2. Controles de tela: busca, filtros, abas/visões, paginação, dia anterior/próximo, voltar, atualizar, imprimir/PDF/WhatsApp, tema, sair.
3. Perguntas livres: IA consulta dados via ferramentas de leitura no servidor (RLS do usuário), só Groq, CPF/CNPJ/telefone/e-mail mascarados, resposta na tela e falada.

Regras que continuam valendo: a voz nunca salva formulário nem exclui sozinha; o toque final é do usuário. Senha nunca por voz. A IA só recebe a frase, a data e a tela atual.

## Decisões

| Tema | Decisão |
|---|---|
| Arquitetura | Catálogo único declarativo por tipo de registro; filtragem e instrução da IA geradas dele |
| Formulários | Voz preenche → barra "Alterações pendentes" / slideover aberto → usuário clica Salvar |
| Ações que gravam na hora | Confirmação de um toque (`BaseVoiceConfirm`) com texto do catálogo; Confirmar chama a mesma função do botão da tela |
| Excluir | Abre o diálogo de exclusão existente da tela; sem diálogo existente → `BaseVoiceConfirm` |
| Vários itens de orçamento | Uma confirmação listando todos os itens; Confirmar insere todos |
| Foto | Voz leva até a seção de fotos e avisa "Toque para tirar a foto" (câmera exige gesto do usuário) |
| Senhas | Nenhum campo de senha no catálogo; "redefinir senha" só abre o diálogo |
| Login | Fora (botão de voz só existe autenticado) |

## Arquitetura

```
fala → modal → /api/voice/interpret ─ IA (prompt gerado do catálogo, detalhado p/ a tela atual)
                                     └ normalizeVoiceCommand (gerado do catálogo) → VoiceCommand
      ← (falha) parser v1 → legacyToCommand
VoiceCommand → useVoiceCommand: permissão (catálogo) → alvo (useVoiceLookup) → refs → draft → navega
draft → useVoiceForm(entity) na tela: applyVoiceFields | abre slideover | BaseVoiceConfirm | diálogo existente
```

### Catálogo — `layers/1.base/app/utils/voice/catalog.ts`

Arquivo puro (TS apagável, sem Vue/Nuxt, imports relativos com `.ts`), testável com `node:test`.

```ts
type FieldType = 'text' | 'number' | 'money' | 'date' | 'time' | 'bool' | 'enum' | 'placa' | 'digits' | 'email' | 'ref'
type Merge = 'append' | 'replace' | 'add'           // append: texto; add: lista sem duplicar
interface VoiceField { type: FieldType, merge?: Merge, values?: readonly string[], list?: boolean,
                       ref?: VoiceRefKind, stateKey?: string, min?: number, max?: number,
                       ops?: readonly ('create' | 'edit')[] }   // stateKey: chave no estado do form (default = nome do campo)
type VoiceRefKind = 'vehicle' | 'customer' | 'supplier' | 'category' | 'catalogItem'
interface VoiceAction { confirm?: string, permission: PermissionAction, kind: 'confirm' | 'dialog' | 'local' | 'guide',
                        args?: Record<string, VoiceField> }
interface VoiceEntity { label: string, page: VoicePage[], target: Record<string, VoiceField>,
                        permission: { create?: PermissionAction, edit?: PermissionAction },
                        fields: Record<string, VoiceField>, items?: Record<string, VoiceField>,
                        actions: Record<string, VoiceAction> }
export const VOICE_CATALOG: Record<VoiceEntityKey, VoiceEntity>
```

`kind`: `confirm` = `BaseVoiceConfirm` e executa; `dialog` = abre diálogo existente da tela; `local` = altera estado sem gravar (ex.: usar sugestão de cobrança); `guide` = navega e mostra instrução (foto).

`PermissionAction` é importado só como tipo (`import type`), então o arquivo continua puro.

### Entidades

Default de `merge`: `text` → `append`, listas → `add`, demais → `replace`. `ops` omitido = create e edit.

| Entidade | Tela(s) | Alvo | Campos | Itens | Ações |
|---|---|---|---|---|---|
| `order` | `/ordens/:id`, `/ordens/novo` | `placa`, `numero`, `clienteNome` | `veiculo` (ref vehicle, create), `km_entrada`, `reclamacao`, `diagnostico`, `observacoes`, `status` (enum 4), `pago` (bool, edit), `forma_pagamento` (enum `dinheiro\|pix\|cartao_credito\|cartao_debito`, edit), `parcelas` (1–12, edit), `valor_cobrado` (money, edit) | orçamento: `tipo` (enum), `descricao`, `quantidade`, `valor_unitario`, `catalogo` (ref catalogItem) | `enviarAprovacao`, `aprovar`, `rejeitar` (confirm); `removerItem {descricao}` (confirm); `usarSugestao` (local); `legendarFoto {numero, legenda}` (confirm, grava na hora); `removerFoto {numero}` (confirm); `adicionarFoto` (guide) |
| `customer` | `/clientes/:id`, `/clientes/novo` | `nome` | `nome`, `telefones` (digits, lista), `emails` (email, lista), `documento` (digits), `observacoes` | — | `desativar`, `reativar` (confirm); `excluir` (dialog) |
| `vehicle` | `/veiculos/:id`, `/veiculos/novo` | `placa` | `placa`, `marca`, `modelo`, `ano`, `cor`, `km_atual`, `observacoes`, `dono` (ref customer) | — | `excluir` (dialog) |
| `appointment` | `/agendamentos` | `placa` | `veiculo` (ref vehicle), `date`, `startTime`, `problema` | — | `faltou` (dialog existente); `desfazerFalta` (confirm); `abrirOS` (navega para `/ordens/novo` com `agendamento_id` e veículo) |
| `account` | `/gestao/financeiro` | `descricao` | `descricao`, `valor`, `vencimento`, `categoria` (ref category), `fornecedor` (ref supplier), `observacoes` | — | `pagar {forma}`, `cancelar`, `reabrir`, `excluir` (todas confirm) |
| `category` | `/gestao/financeiro` (slideover) | `nome` | `nome` | — | `ativar`, `desativar` (confirm) |
| `catalogItem` | `/configuracao/catalogo` | `nome` | `tipo`, `nome`, `horas_estimadas`, `nivel_tecnico` (enum `rapido\|padrao\|tecnico\|especializado`), `usar_preco_sugerido` (bool), `valor_padrao`, `custo`, `estoque`, `fornecedor` (ref supplier) | kit: `catalogo` (ref catalogItem), `quantidade` | `desativar`, `reativar` (confirm); `excluir` (dialog se existir, senão confirm) |
| `supplier` | `/configuracao/fornecedores` | `nome` | `nome`, `telefone` (digits), `email`, `observacoes` | — | `desativar`, `reativar` (confirm); `excluir` (dialog) |
| `collaborator` | `/gestao/equipe` | `nome` | `nome`, `username`, `papel` (enum, create) | — | `trocarPapel {papel}` (confirm); `redefinirSenha` (dialog, senha digitada); `excluir` (dialog) |
| `pricing` | `/configuracao/precificacao` | — (singleton) | `valor_hora`, `custo_fixo_mensal`, `margem_alvo`, `horas_produtivas_mes`, `valor_minimo_servico`, `fator_servico_rapido`, `fator_servico_padrao`, `fator_servico_tecnico`, `fator_servico_especializado`, `markup_pecas`, `precificacao_automatica` (bool), `taxa_cartao_debito`, `taxa_cartao_credito`, `acrescimo_cartao_credito_parcela` | — | — |

Permissões por ação seguem as dos botões atuais (ex.: `aprovar` → `budget.approve`, `pagar` → `finance.view`, `trocarPapel` → `collaborators.manage`). Mecânico mantém a regra `canChangeOrderStatus`.

#### Ajustes definidos no protótipo (prevalecem sobre o texto acima)

- `kind` só tem `confirm` (confirmação de um toque e executa) e `direct` (executa na hora: abre diálogo existente, altera estado local ou orienta). `dialog`/`local`/`guide` viram `direct`.
- Merge padrão: listas → `add`; todo o resto → `replace`. `append` só explícito nos textos longos (`reclamacao`, `diagnostico`, `observacoes`, `problema`) — nome, marca etc. são substituídos.
- `category`: `permission { create, edit: 'finance.view' }`, campo `nome`; criar/renomear são confirmados pela tela financeira (`BaseVoiceConfirm`) antes de gravar; ações `ativar`/`desativar`.
- `collaborator`: `permission.edit = 'collaborators.manage'`; edit só troca o `papel` (mesma confirmação de `trocarPapel`); nome/usuário por voz → toast explicando.
- `account`: sem formulário de edição; edit só abre o financeiro. `pagar` sem forma dita usa Pix (padrão da tabela).
- Itens: order `{tipo, descricao, quantidade, valor_unitario}` (o id do catálogo é resolvido pelo runtime a partir da descrição); kit `{item (ref catalogItem), quantidade}`.
- `pricing` não tem alvo (singleton): pula a resolução de alvo.
- `BaseVoiceConfirm` é um `UModal` montado no layout `default` e controlado por `useVoiceConfirm()` (promise), sem `useOverlay`.
- `useVoiceForm` aceita `unavailable(action, draft)` — checado antes da confirmação — e `apply(draft)` para telas com formulário especial. Várias chamadas para a mesma entidade na mesma tela (página da OS + seção de fotos) são roteadas por quais ações/ops cada uma trata.

### Comando — `types.ts`

```ts
type VoiceOp = 'create' | 'edit' | 'action' | 'navigate'
interface VoiceCommand {
  op: VoiceOp
  entity?: VoiceEntityKey                       // ausente só em navigate
  target?: Record<string, string>
  fields?: Record<string, VoiceValue>
  items?: Record<string, VoiceValue>[]
  action?: string
  args?: Record<string, VoiceValue>
  to?: VoiceNavTarget, date?: string            // navigate
}
```

Substitui `VoiceIntent`/`VoicePayloadMap`. `VoiceNavTarget` mantém a lista atual.

### Normalização — `normalize.ts` (reescrita, gerada do catálogo)

`normalizeVoiceCommand(raw: unknown): VoiceCommand | null`: `op` e `entity` por whitelist (`Object.hasOwn`); `action` precisa existir na entidade; `fields`/`items`/`args`/`target` só com chaves do catálogo e valor validado pelo tipo (validadores atuais: `str`, `num`, `placa`, `date`, `time`, `email`, `digits`, `oneOf`, `list`), `min`/`max` aplicados; campo com `ops` que não inclui o `op` é descartado; itens sem campo útil descartados; qualquer chave `senha`/`password` ignorada (nunca está no catálogo). Limites: strings ≤ 1000, listas ≤ 10, itens ≤ 20. `edit` sem `fields`, `items` nem alvo → válido (só abre). Nada válido → `null`.

### Instrução da IA — `prompt.ts`

`buildVoiceMessages(text, context)` gera o system prompt do catálogo:
- Regras gerais atuais (datas relativas a `today`, hora `HH:MM`, placa, dinheiro, "nova OS" = create, "abre a…" = edit, nunca senha, `null` se não entender).
- Entidade(s) da tela atual (`VoicePage` → `entity.page`): campos com tipo/valores, itens e ações com args.
- Demais entidades: uma linha cada — `entity: campos (nomes) | ações (nomes)`.
- Teste garante system prompt ≤ 6000 caracteres em toda `VoicePage`.

`VoicePage` passa a ter uma entrada por tela: `order-detail`, `order-new`, `customer-detail`, `customer-new`, `vehicle-detail`, `vehicle-new`, `scheduling`, `finance`, `catalog`, `suppliers`, `team`, `pricing`, `other`. `voicePageFromPath` atualizado; o servidor valida contra a lista.

### Runtime — `useVoiceCommand` (reescrito)

1. `interpret` inalterado (IA → fallback `parseVoiceCommand` + `legacyToCommand`).
2. Permissão: `navigate` → tabela `NAV` atual; `create`/`edit` → `entity.permission[op]`; `action` → `action.permission`. Negado → toast "Sem permissão".
3. Alvo: sem alvo e na tela da entidade → registro aberto (id da rota ou slideover de edição aberto, informado pela tela via `useVoiceForm`); com alvo → `useVoiceLookup`. Não achou → toast com o motivo, não navega.
4. Refs: cada campo/item/arg `ref` é resolvido para id (`vehicle` por placa; demais por nome, match único). Não resolvido → aviso "X não encontrado ou ambíguo", campo omitido.
5. Draft genérico `{ entity, op, id?, fields, items?, action?, args?, label? }` via `useVoiceDraft` (TTL 15 s, `ready`/`accept` inalterados; chave = `entity`).
6. Navega para a tela da entidade (`/ordens/:id`, `/clientes/novo`, lista com slideover etc.). Mantém: cancelamento ao fechar modal, limpar draft se a navegação falhar, "Não entendi" para edit vazio na própria tela.

`useVoiceLookup` ganha: `findByName(kind, nome)` genérico para `customer | supplier | category | catalogItem | collaborator | account` (account por `descricao`, entre as não canceladas), `findAppointment(veiculoId, { status })` (próximo agendado/confirmado; para `desfazerFalta`, o mais recente `nao_compareceu`).

### Telas — `useVoiceForm` (novo, `layers/1.base/app/composables/`)

```ts
useVoiceForm(entity, {
  state?,                    // reactive do formulário (applyVoiceFields escreve nele)
  open?: (id?: string) => void | Promise<void>,   // abre slideover de criar/editar (listas)
  currentId?: () => string | undefined,           // registro aberto na tela
  ready?, accept?,           // repassados ao onVoiceDraft
  onItems?: (items) => Promise<void>,            // orçamento / kit
  actions?: Record<string, (args) => unknown>    // mesma função do botão
})
```

- `applyVoiceFields(state, fields, entity)` — pura em `utils/voice/apply.ts`: `append` via `appendText`; `replace` atribui; `add` concatena sem duplicar (comparação normalizada); `ref` grava o id em `stateKey` (`veiculo` → `veiculo_id`, `dono` → `cliente_id`, `categoria` → `categoria_id`, `fornecedor` → `fornecedor_id`).
- Ações `confirm`: `BaseVoiceConfirm` (via `useOverlay`) com o texto do catálogo interpolado (`{numero}`, `{nome}`…); Confirmar → `actions[name](args)`; cancelar não faz nada. `dialog`: chama `actions[name]` que abre o diálogo existente. `local`: executa direto. `guide`: navega/rola até a seção e mostra toast com a instrução.
- Ação indisponível no estado atual (ex.: aprovar orçamento que não está aguardando aprovação; pagar conta já paga): a tela informa via `actions[name]` retornando `{ unavailable: 'motivo' }` → toast com o motivo.
- Handlers atuais de `onVoiceDraft` nas páginas são substituídos por `useVoiceForm`.
- Vários itens de orçamento: `onItems` abre `BaseVoiceConfirm` listando os itens (quantidade × descrição, valor formatado); Confirmar insere todos com a mutation existente de `ordem_itens`. Um item só → abre o modal de item preenchido (comportamento atual).

Correção incluída: `/ordens/novo` mostra o campo Diagnóstico quando preenchido por voz (hoje o estado existe sem campo na UI).

### Fallback v1 — `legacyToCommand`

Função pura em `utils/voice/legacy.ts`: converte a saída de `parseVoiceCommand` (intents v1) no `VoiceCommand` novo. Testes do parser v1 continuam; novo teste cobre a conversão de cada intent.

## Erros

| Situação | Comportamento |
|---|---|
| IA fora / sem chave | Parser v1 → `legacyToCommand`; se nada, "Não entendi" |
| Comando inválido | `normalize` → `null` → "Não entendi" |
| Sem permissão | Toast "Sem permissão" |
| Alvo ou ref não encontrado | Toast com o motivo; alvo ausente não navega; ref ausente omite o campo |
| Ação indisponível no estado | Toast com o motivo, nada abre |
| Modal fechado durante a interpretação | Cancela, nada navega |
| Alterações pendentes ao navegar | Guard existente; se bloqueado, draft descartado |

## Testes

`node:test`:
- `catalog.test.ts`: toda entidade tem `page`, permissões válidas, ações com `permission`; nenhum campo chamado `senha`/`password`.
- `normalize.test.ts`: cada entidade/op aceita campos válidos; descarta chaves desconhecidas, tipos errados, ações inexistentes, `ops` incompatível; limites de tamanho.
- `prompt.test.ts`: contém `today`, página e texto; entidade da tela detalhada; ≤ 6000 caracteres em toda `VoicePage`.
- `apply.test.ts`: append, replace, add sem duplicar, ref → stateKey.
- `legacy.test.ts`: cada intent v1 convertido.
- `voice-providers.test.ts`, parser v1, `text.test.ts`: continuam.

Verificação: `pnpm test`, `npx nuxt typecheck`, `pnpm lint`, `npx nuxt build`; script ao vivo (`.superpowers/sdd/live-ai-check.ts`) com frases novas: "paga no pix em 3x", "aprova o orçamento", "remove a pastilha do orçamento", "desativa o cliente João", "a conta de energia foi paga no pix", "muda o papel do Pedro para gerente", "o custo da hora é 120 reais", "adiciona duas pastilhas a 150 e mão de obra de 80".

## Entrega

1. Catálogo + tipos + normalização + prompt + `legacyToCommand` + `applyVoiceFields` (puro, com testes).
2. `useVoiceCommand` + `useVoiceLookup` + `useVoiceForm` + `BaseVoiceConfirm`; migrar as telas já cobertas pela v2 sem regressão.
3. Telas e ações novas: OS (pagamento, orçamento, fotos), cliente, veículo, agenda, financeiro (contas, categorias), catálogo, fornecedores, equipe, precificação, diagnóstico em `/ordens/novo`.
4. Revisão final da branch, build, teste ao vivo.

## Fora de escopo (partes 2 e 3)

Busca, filtros, abas, paginação, navegação de datas, voltar, atualizar, imprimir/PDF/WhatsApp, tema, sair; perguntas com resposta.
