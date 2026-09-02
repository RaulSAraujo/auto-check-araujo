import type { Checklist, ChecklistItem, OrdemServico, Veiculo } from '~~/shared/types/database'

export type OrderListItem = OrdemServico & {
  veiculos: { id: string, placa: string, marca: string | null, modelo: string | null } | null
}

export type OrderDetail = OrdemServico & {
  veiculos: {
    id: string
    placa: string
    marca: string | null
    modelo: string | null
    clientes: { id: string, nome: string, telefones: string[] } | null
  } | null
  profiles: { nome: string } | null
  checklists: Pick<Checklist, 'id' | 'status'> | null
}

export type OrderVehicleOption = Pick<Veiculo, 'id' | 'placa' | 'marca' | 'modelo'> & {
  clientes: { nome: string } | null
}

export type ChecklistWithItems = Checklist & {
  checklist_itens: ChecklistItem[]
  ordens_servico: Pick<OrdemServico, 'id' | 'numero' | 'status'> | null
}
