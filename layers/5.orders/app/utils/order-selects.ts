/** Colunas explícitas — evita `select *` nas telas de edição OS. */

export const ORDER_DETAIL_SELECT = [
  'id',
  'numero',
  'status',
  'veiculo_id',
  'km_entrada',
  'reclamacao',
  'diagnostico',
  'observacoes',
  'orcamento_status',
  'forma_pagamento',
  'pago',
  'pago_em',
  'valor_total',
  'valor_cobrado',
  'aberta_em',
  'concluida_em',
  'aberto_por',
  'created_at',
  'updated_at',
  'veiculos(id, placa, marca, modelo, clientes(id, nome, telefones))',
  'profiles!ordens_servico_aberto_por_fkey(nome)',
  'agendamentos(id, inicio, fim, patio_vaga, status)'
].join(', ')

export const ORDER_ITEM_SELECT = [
  'id',
  'ordem_servico_id',
  'tipo',
  'descricao',
  'quantidade',
  'valor_unitario',
  'ordem',
  'created_at'
].join(', ')
