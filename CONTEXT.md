# Oficina

Sistema interno da oficina mecânica para gestão operacional. Uso exclusivo de Colaboradores.

## Language

**Cliente**:
Pessoa ou empresa dona dos veículos atendidos pela oficina.
_Avoid_: Client, customer, account

**Veículo**:
Automóvel ou moto vinculado a um Cliente, identificado pela placa.
_Avoid_: Carro, auto, automóvel (como entidade)

**Colaborador**:
Usuário autenticado da equipe da oficina.
_Avoid_: User, usuário (na interface)

**Ordem de Serviço**:
Atendimento de um Veículo na oficina, com ciclo de vida próprio (aberta → em andamento → concluída ou cancelada). Em andamento cobre análise/diagnóstico antes do orçamento. Cliente que volta após entrega gera Ordem de Serviço nova.
_Avoid_: OS genérica sem vínculo, ticket, job, retrabalho (como status)

**Diagnóstico**:
Registro em texto do que a oficina encontrou na análise do Veículo, usado para montar o Orçamento. Distinto da reclamação do Cliente.
_Avoid_: Checklist, inspeção solta, formulário de template

**Foto da OS**:
Evidência visual ligada a uma Ordem de Serviço (detalhes do diagnóstico). Uso interno; não vai no PDF do orçamento.
_Avoid_: Foto de checklist, anexo genérico, mídia no orçamento público

**Orçamento**:
Proposta de itens e valores vinculada a uma Ordem de Serviço, montada após o Diagnóstico. Ciclo: rascunho → aguardando aprovação (PDF enviado ao Cliente) → aprovado ou rejeitado. Compartilhamento é por PDF; o Cliente não acessa o sistema.
_Avoid_: quote solto, proposta comercial genérica, link público de orçamento

**Agendamento**:
Indicação de que o Cliente trará o Veículo em data/horário aproximado. Campos: veículo, horário, problema relatado. Status na prática: agendado ou faltou. Sem duração (fim) e sem vaga de pátio. Ao abrir OS, o problema relatado vira a reclamação da OS.
_Avoid_: kanban board, slot de pátio, calendário mensal, intervalo início/fim, status “confirmado/concluído” na UI

**Financeiro**:
Workspace de caixa da oficina: resumo do mês, contas a pagar, recebíveis de Ordens de Serviço e extrato.
_Avoid_: accounting module, ledger genérico

**Conta a pagar**:
Lançamento de saída no Financeiro (fornecedor, categoria, vencimento, pagamento).
_Avoid_: bill, payable genérico sem vínculo à oficina

**Catálogo**:
Itens (serviço, peça, kit) e Fornecedores usados ao montar Orçamento e Contas a pagar.
_Avoid_: product catalog, SKU genérico

**Fornecedor**:
Empresa ou pessoa que fornece peças/serviços; aparece no Catálogo e nas Contas a pagar.
_Avoid_: vendor, supplier (na UI)

## Architecture notes

- **Financeiro workspace** (`useFinanceWorkspace`): deep module — page is wire-up only.
- **Orçamento** is internal-only: PDF download/print; no public token/route.
- **Veículo options** live in `10.vehicles` (`useVehicleOptions`); callers map labels.
- Do **not** introduce a shared Catalog CRUD factory — domain kit/template logic earns separate modules; toast clones are cheaper than a shallow factory.
