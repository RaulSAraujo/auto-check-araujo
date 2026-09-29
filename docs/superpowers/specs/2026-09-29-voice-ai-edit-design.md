# Voz v2 — fala livre com IA, edição de registros e ditado contínuo

Data: 2026-09-29 · Branch: `feat/voice-commands` · Evolui `2026-09-29-voice-commands-design.md`.

## Problema

A v1 (parser por palavras-chave) foi pouco prática no uso real:

1. Só cria registros; não abre nem edita OS, cliente, veículo ou agendamento existentes.
2. Exige frases no formato "campo valor"; fala natural não é entendida.
3. O reconhecimento encerra na primeira pausa (`continuous = false`) e cada nova fala substitui a anterior, impedindo ditar em partes.

## Decisões (confirmadas com o usuário)

| Tema | Decisão |
|---|---|
| Interpretação | IA em camada gratuita: **Groq** (`openai/gpt-oss-120b`) primeiro, **Gemini** (`gemini-3.8-flash`) se Groq falhar/limitar |
| Reserva final | Parser de palavras-chave da v1 quando nenhuma IA responde ou não há chave |
| Escopo de edição | OS, cliente, veículo, agendamento (remarcar, registrar falta), navegação |
| Salvamento | Pré-preenche; barra "Alterações pendentes"; usuário salva. Voz nunca grava no banco |
| Ditado | Escuta contínua até Parar/Enviar; trechos acumulam; IA só no Enviar |
| Campos de texto | Voz **acrescenta** ao conteúdo existente (diagnóstico, reclamação, observações) |
| Itens de orçamento | Um por comando; se vierem vários, preenche o primeiro e avisa |

Fora do escopo: cancelar agendamento (não existe no app), endereço de cliente (campo inexistente), qualquer escrita direta no banco pela voz.

## Arquitetura

```
BaseVoiceCommandButton (modal, ditado contínuo)
  └─ useVoiceCommand.run(text)
       ├─ POST /api/voice/interpret { text, context }  ──► Groq ─(429/5xx/timeout)─► Gemini
       │     └─ normalizeVoiceCommand(json) → VoiceCommand | null
       ├─ 503 / erro de rede → parseVoiceCommand(text)  (v1, local)
       └─ dispatch: permissão → lookup de ids → navegação → setVoiceDraft
                                                               └─ página consome via onVoiceDraft
```

### Servidor — `server/api/voice/interpret.post.ts`

- Exige usuário autenticado (`serverSupabaseUser`), senão 401.
- Corpo: `{ text: string (1–2000 chars), context: { page: VoicePage, today: 'YYYY-MM-DD' } }`; inválido → 400.
- `runtimeConfig`: `groqApiKey`, `geminiApiKey`, `groqModel` (default `openai/gpt-oss-120b`), `geminiModel` (default `gemini-3.8-flash`). Env: `NUXT_GROQ_API_KEY`, `NUXT_GEMINI_API_KEY`, `NUXT_GROQ_MODEL`, `NUXT_GEMINI_MODEL`.
- Ambos via endpoint compatível OpenAI (`/chat/completions`), `response_format: { type: 'json_object' }`, `temperature: 0`, timeout 10 s.
  - Groq: `https://api.groq.com/openai/v1/chat/completions`
  - Gemini: `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`
- Fallback (`server/utils/voice-providers.ts`, função pura com `fetch` injetável): tenta provedores configurados em ordem; passa ao próximo em 429, 5xx, timeout, erro de rede ou JSON inválido. 4xx diferente de 429 (chave errada) também passa ao próximo e é logado.
- Nenhum provedor configurado ou todos falharam → 503 (cliente usa o parser local).
- Resposta 200: `{ command: VoiceCommand | null }` — já normalizado.
- A IA recebe só a frase, a data de hoje e a página atual. Nenhum dado do banco.

### Prompt — `layers/1.base/app/utils/voice/prompt.ts`

`buildVoiceMessages(text, context)` (pura) monta system + user: descreve cada intenção e campo em português, regras (datas em `YYYY-MM-DD` relativas a `today`, hora `HH:MM`, placa sem hífen em maiúsculas, dinheiro em número decimal, telefones só dígitos, nunca incluir senha, `intent: null` se não entender), e o uso de `context.page` (ex.: em `order-detail`, "diagnóstico X" sem alvo = OS aberta).

### Normalização — `layers/1.base/app/utils/voice/normalize.ts`

`normalizeVoiceCommand(raw: unknown): VoiceCommand | null` (pura): aceita só intenções conhecidas; copia apenas campos conhecidos com tipo válido (string não vazia e aparada, número finito ≥ 0, data válida, hora válida, enums `OrdemStatus`/`VoiceItemTipo`/`VoicePapel`/`VoiceNavTarget`, placa `^[A-Z]{3}\d[A-Z0-9]\d{2}$`); descarta qualquer `senha`. É a fronteira de confiança: saída da IA nunca chega ao app sem passar aqui.

### Tipos novos (`types.ts`)

```ts
type VoicePage = 'order-detail' | 'customer-detail' | 'vehicle-detail' | 'scheduling' | 'other'
type VoiceNavTarget = 'home' | 'orders' | 'scheduling' | 'customers' | 'vehicles'
  | 'finance' | 'team' | 'catalog' | 'suppliers' | 'pricing' | 'settings'

'order.edit':            { target?: { placa?, numero?, clienteNome? }, km_entrada?, reclamacao?, diagnostico?, observacoes?, status?: OrdemStatus, itens?: VoiceBudgetItemPayload[] }
'customer.edit':         { target?: { nome? }, telefones?: string[], emails?: string[], documento?, observacoes? }
'vehicle.edit':          { target?: { placa? }, km_atual?, cor?, observacoes? }
'appointment.reschedule':{ placa?, date?, startTime? }
'appointment.noShow':    { placa? }
'navigate':              { to: VoiceNavTarget, date? }
```

Drafts entregues às páginas carregam o `id` resolvido (`orderId`, `clienteId`, `veiculoId`, `appointmentId`). As 9 intenções `*.create` da v1 continuam iguais.

### Runtime — `useVoiceCommand` (estendido)

- `page` derivado da rota atual (`/ordens/:id` → `order-detail`, etc.).
- Mapa intenção → permissão: `order.edit` → `orders.edit` (e `budget.edit` para itens); `customer.edit` → `customers.write`; `vehicle.edit` → `vehicles.write`; `appointment.*` → `scheduling.write`; `navigate` → `finance.view` (finance), `collaborators.manage` (team), `catalog.manage` (catalog, suppliers, pricing); demais telas sem restrição.
- Resolução de alvo (em `useVoiceLookup`, match único, senão aviso):
  - OS: sem alvo e em `order-detail` → OS atual; `numero` → exata; `placa` → veículo → OS não concluída/cancelada mais recente; `clienteNome` → cliente → veículos → idem.
  - Cliente: sem alvo e em `customer-detail` → atual; `nome` → match único.
  - Veículo: sem alvo e em `vehicle-detail` → atual; `placa` → match exato.
  - Agendamento: `placa` → próximo agendamento futuro (ou de hoje) do veículo, não marcado como falta.
- Navega para o detalhe e entrega o draft; página ignora draft cujo id difere do seu.
- `navigate`: `scheduling` com `date` vai para `/agendamentos?dia=YYYY-MM-DD` (mesmo formato de `schedulingDayPath`, sem importar a layer de agendamento na base); demais usam `APP_ROUTES`.
- `order.edit` com mais de um item: entrega só o primeiro e mostra aviso "Dite o próximo item em seguida."

### Páginas consumidoras

- `orders-[id].vue`: `onVoiceDraft('order.edit')` → `km_entrada` substitui; textos acrescentam (`appendText`); `status` vai para `selectedStatus` (fluxo de conclusão existente); primeiro item → mesmo caminho do `budgetItem.create` (abre modal preenchido).
- `customers-[id].vue`: telefones/emails novos são adicionados à lista (sem duplicar); documento substitui; observações acrescentam.
- `vehicles-[id].vue`: km e cor substituem; observações acrescentam.
- `scheduling.vue`: `reschedule` → seleciona o dia do agendamento, `openEdit` com data/hora sobrescritas; `noShow` → `requestNoShow(id)` (diálogo existente).
- `appendText(current, addition)` pura em `utils/voice/`: junta com espaço/ponto, ignora vazio e repetição exata.

### Ditado contínuo — `useSpeechRecognition` + modal

- `continuous = true`. Resultados finais são **acrescentados** ao texto do modal; parcial aparece à parte, em cinza, até virar final.
- Se o navegador encerrar sem o usuário pedir (timeout ~60 s, rede), reinicia automaticamente; não reinicia em `not-allowed`.
- Sem envio automático. Botões: **Parar/Continuar**, **Limpar**, **Enviar**. Enviar cancela a escuta e envia o texto editado.
- Exemplos do modal trocados por frases naturais, incluindo edição ("abre a OS do ABC1D23, diagnóstico pastilha gasta").

## Erros

| Situação | Comportamento |
|---|---|
| Sem chave / ambas IAs fora | Parser local; se não entender, "Não entendi" |
| IA devolve lixo | `normalize` → null → "Não entendi" |
| Alvo não encontrado ou ambíguo | Toast de aviso; não navega |
| Sem permissão | Toast "Sem permissão" |
| Página com alterações pendentes ao navegar | Guard existente de "Sair sem salvar?"; se bloqueado, draft é descartado |

## Testes

`node:test` (script `test` passa a incluir `server/**/*.test.ts`):

- `normalize.test.ts`: aceita comandos válidos de cada intenção; descarta campos desconhecidos, tipos errados, senha, datas/horas/placas inválidas; intenção desconhecida → null.
- `prompt.test.ts`: mensagens contêm `today`, `page` e o texto.
- `append.test.ts`: `appendText`.
- `voice-providers.test.ts`: Groq ok; Groq 429 → Gemini; Groq timeout → Gemini; ambos falham → erro; só uma chave configurada.
- Parser v1: testes existentes continuam passando.

Verificação: `pnpm test`, `npx nuxt typecheck`, `pnpm lint`, `graphify update .`. Teste real com as IAs depende das chaves no `.env`.
