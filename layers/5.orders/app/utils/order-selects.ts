/** Colunas explícitas — evita `select *` nas telas de edição OS/checklist. */

export const ORDER_DETAIL_SELECT = [
  'id',
  'numero',
  'status',
  'veiculo_id',
  'km_entrada',
  'reclamacao',
  'observacoes',
  'orcamento_status',
  'orcamento_public_token',
  'forma_pagamento',
  'pago',
  'pago_em',
  'valor_total',
  'aberta_em',
  'concluida_em',
  'aberto_por',
  'created_at',
  'updated_at',
  'veiculos(id, placa, marca, modelo, clientes(id, nome, telefones))',
  'profiles!ordens_servico_aberto_por_fkey(nome)',
  'checklists(id, status, checklist_itens(id, resultado))',
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

export const CHECKLIST_ITEM_SELECT = [
  'id',
  'checklist_id',
  'categoria',
  'label',
  'ordem',
  'resultado',
  'observacao'
].join(', ')

export const CHECKLIST_DETAIL_SELECT = [
  'id',
  'ordem_servico_id',
  'status',
  'created_at',
  'updated_at',
  `checklist_itens(${CHECKLIST_ITEM_SELECT})`,
  'ordens_servico(id, numero, status)'
].join(', ')

export const CHECKLIST_PHOTO_SELECT = [
  'id',
  'checklist_item_id',
  'storage_path',
  'nome_arquivo',
  'created_at'
].join(', ')
