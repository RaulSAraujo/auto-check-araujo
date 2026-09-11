import type { OrdemServico, Veiculo } from '~~/shared/types/database'

export type OrderListItem = OrdemServico & {
  veiculos: { id: string, placa: string, marca: string | null, modelo: string | null } | null
}

export type OrderLinkedAppointment = {
  id: string
  inicio: string
  fim: string
  patio_vaga: number | null
  status: string
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
  agendamentos?: OrderLinkedAppointment[] | OrderLinkedAppointment | null
}

export type OrderVehicleOption = Pick<Veiculo, 'id' | 'placa' | 'marca' | 'modelo'> & {
  clientes: { nome: string } | null
}
