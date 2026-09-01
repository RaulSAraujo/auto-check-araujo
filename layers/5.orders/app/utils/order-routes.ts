export const ORDER_ROUTES = {
  list: '/ordens',
  new: '/ordens/novo',
  detail: (id: string) => `/ordens/${id}`,
  checklist: (id: string) => `/ordens/${id}/checklist`,
  newWithVehicle: (veiculoId: string) => `/ordens/novo?veiculo_id=${veiculoId}`
} as const
