import type { OrdemItemTipo } from '~~/shared/types/oficina'
import type { CatalogoKitItem, Fornecedor, ServicoCatalogo } from '~~/shared/types/database'
import { roundMoney, type ServiceTechnicalLevel } from './pricing'

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
  horas_estimadas: number | null
  nivel_tecnico: ServiceTechnicalLevel
  preco_manual: boolean
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

export const CATALOG_TIPO_FILTER_ITEMS = [
  { label: 'Todos', value: 'all' },
  { label: 'Serviços', value: 'servico' },
  { label: 'Kits', value: 'kit' },
  { label: 'Peças', value: 'peca' }
] as const

export const CATALOG_TIPO_COLOR: Record<OrdemItemTipo, 'info' | 'warning' | 'primary'> = {
  servico: 'info',
  peca: 'warning',
  kit: 'primary'
}

export function emptyCatalogItemDraft(): CatalogItemDraft {
  return {
    nome: '',
    tipo: 'servico',
    valor_padrao: 0,
    custo: 0,
    estoque: null,
    fornecedor_id: undefined,
    horas_estimadas: null,
    nivel_tecnico: 'padrao',
    preco_manual: false,
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
    horas_estimadas: item.horas_estimadas == null ? null : Number(item.horas_estimadas),
    nivel_tecnico: item.nivel_tecnico as ServiceTechnicalLevel,
    preco_manual: Boolean(item.preco_manual),
    kit_itens: (item.catalogo_kit_itens || []).map(line => ({
      item_id: line.item_id,
      quantidade: Number(line.quantidade)
    }))
  }
}

export function isCatalogItemDraftValid(draft: CatalogItemDraft): boolean {
  if (!draft.nome.trim() || draft.valor_padrao < 0 || draft.custo < 0) return false
  if (draft.estoque != null && draft.estoque < 0) return false
  if (draft.tipo === 'servico' && draft.horas_estimadas != null && draft.horas_estimadas < 0) {
    return false
  }
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

export function applyServiceSuggestedPrice(draft: CatalogItemDraft, suggestedPrice: number): void {
  if (draft.tipo === 'servico' && !draft.preco_manual) {
    draft.valor_padrao = suggestedPrice
  }
}

export function markServicePriceManual(
  draft: CatalogItemDraft,
  nextPrice: number,
  suggestedPrice: number
): void {
  draft.valor_padrao = roundMoney(Math.max(Number(nextPrice) || 0, 0))
  draft.preco_manual = draft.tipo === 'servico' && draft.valor_padrao !== suggestedPrice
}

export function clearServicePriceManual(draft: CatalogItemDraft, suggestedPrice: number): void {
  draft.preco_manual = false
  applyServiceSuggestedPrice(draft, suggestedPrice)
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
