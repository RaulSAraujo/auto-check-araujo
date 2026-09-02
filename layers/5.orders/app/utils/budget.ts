import type { OrdemItem } from '~~/shared/types/database'

export { formatMoney } from '~~/shared/utils/money'

export function calcItemSubtotal(item: Pick<OrdemItem, 'quantidade' | 'valor_unitario'>): number {
  return Number(item.quantidade) * Number(item.valor_unitario)
}

export function calcItemsTotal(items: Pick<OrdemItem, 'quantidade' | 'valor_unitario'>[]): number {
  return items.reduce((sum, item) => sum + calcItemSubtotal(item), 0)
}

export interface OrderItemDraft {
  tipo: 'servico' | 'peca' | 'kit'
  descricao: string
  quantidade: number
  valor_unitario: number
}

export function emptyOrderItemDraft(): OrderItemDraft {
  return {
    tipo: 'servico',
    descricao: '',
    quantidade: 1,
    valor_unitario: 0
  }
}

export function isOrderItemDraftValid(draft: OrderItemDraft): boolean {
  return Boolean(draft.descricao.trim()) && draft.quantidade > 0 && draft.valor_unitario >= 0
}
