export const CUSTOMER_ROUTES = {
  list: '/clientes',
  new: '/clientes/novo',
  detail: (id: string) => `/clientes/${id}`,
  newVehicle: (clienteId: string) => `/veiculos/novo?cliente_id=${clienteId}`
} as const
