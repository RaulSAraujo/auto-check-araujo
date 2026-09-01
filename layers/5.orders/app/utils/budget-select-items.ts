import { ORDEM_ITEM_TIPO_LABEL } from '~~/shared/types/oficina'

export const ORDEM_ITEM_TIPO_SELECT_ITEMS = [
  { label: ORDEM_ITEM_TIPO_LABEL.servico, value: 'servico' },
  { label: ORDEM_ITEM_TIPO_LABEL.peca, value: 'peca' }
] as const
