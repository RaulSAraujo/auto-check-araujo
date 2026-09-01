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
Atendimento de um Veículo na oficina, com ciclo de vida próprio (aberta, em andamento, concluída ou cancelada).
_Avoid_: OS genérica sem vínculo, ticket, job

**Checklist**:
Inspeção vinculada a uma Ordem de Serviço, com itens copiados de um template no momento da criação.
_Avoid_: Formulário, inspeção solta, auto-check (como entidade)

**Item de Checklist**:
Ponto inspecionado dentro de um Checklist, com resultado e observação.
_Avoid_: Campo, pergunta
