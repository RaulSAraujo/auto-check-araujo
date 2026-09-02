import type { OrdemItemTipo } from '~~/shared/types/oficina'
import type { CatalogoKitItem, Fornecedor, ServicoCatalogo } from '~~/shared/types/database'

export interface CatalogKitDraftLine {
  item_id: string
  quantidade: number
}

export interface CatalogItemDraft {
  nome: string
  tipo: OrdemItemTipo
  valor_padrao: number
  custo: number
  estoque: number | null
  fornecedor_id: string | undefined
  kit_itens: CatalogKitDraftLine[]
}

export type CatalogKitItemWithRef = CatalogoKitItem & {
  item: Pick<ServicoCatalogo, 'id' | 'nome' | 'tipo'> | null
}

export type CatalogItemRow = ServicoCatalogo & {
  fornecedores: Pick<Fornecedor, 'id' | 'nome'> | null
  catalogo_kit_itens: CatalogKitItemWithRef[] | null
}

export type CatalogTipoFilter = 'all' | OrdemItemTipo

export function emptyCatalogItemDraft(): CatalogItemDraft {
  return {
    nome: '',
    tipo: 'servico',
    valor_padrao: 0,
    custo: 0,
    estoque: null,
    fornecedor_id: undefined,
    kit_itens: []
  }
}

export function catalogDraftFromRow(item: CatalogItemRow): CatalogItemDraft {
  return {
    nome: item.nome,
    tipo: item.tipo as OrdemItemTipo,
    valor_padrao: Number(item.valor_padrao),
    custo: Number(item.custo),
    estoque: item.estoque == null ? null : Number(item.estoque),
    fornecedor_id: item.fornecedor_id || undefined,
    kit_itens: (item.catalogo_kit_itens || []).map(line => ({
      item_id: line.item_id,
      quantidade: Number(line.quantidade)
    }))
  }
}

export function isCatalogItemDraftValid(draft: CatalogItemDraft): boolean {
  if (!draft.nome.trim() || draft.valor_padrao < 0 || draft.custo < 0) return false
  if (draft.estoque != null && draft.estoque < 0) return false
  if (draft.tipo === 'kit') {
    return draft.kit_itens.length > 0
      && draft.kit_itens.every(line => line.item_id && line.quantidade > 0)
  }
  return true
}

export function stockForTipo(tipo: OrdemItemTipo, estoque: number | null | undefined): number | null {
  if (tipo === 'servico') return null
  if (estoque == null || Number.isNaN(Number(estoque))) return 0
  return Number(estoque)
}

export function emptySupplierDraft() {
  return {
    nome: '',
    telefone: '',
    email: '',
    observacoes: ''
  }
}

export type SupplierDraft = ReturnType<typeof emptySupplierDraft>

export function isSupplierDraftValid(draft: SupplierDraft): boolean {
  return Boolean(draft.nome.trim())
}
