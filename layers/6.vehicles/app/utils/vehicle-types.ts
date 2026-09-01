import type { Veiculo } from '~~/shared/types/database'

export type VeiculoComCliente = Veiculo & {
  clientes: { id: string, nome: string } | null
}
