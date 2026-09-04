export const VEHICLE_ROUTES = {
  list: '/veiculos',
  new: '/veiculos/novo',
  detail: (id: string) => `/veiculos/${id}`,
  newWithCustomer: (clienteId: string) => `/veiculos/novo?cliente_id=${clienteId}`,
  newOrder: (veiculoId: string) => `/ordens/novo?veiculo_id=${veiculoId}`,
  customers: '/clientes',
  customerDetail: (id: string) => `/clientes/${id}`
} as const
