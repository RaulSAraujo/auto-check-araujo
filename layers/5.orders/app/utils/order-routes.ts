export const ORDER_ROUTES = {
  list: '/ordens',
  new: '/ordens/novo',
  detail: (id: string) => `/ordens/${id}`,
  checklist: (id: string) => `/ordens/${id}/checklist`,
  print: (id: string) => `/ordens/${id}/impressao`,
  checklistPrint: (id: string) => `/ordens/${id}/checklist/impressao`,
  publicBudget: (token: string) => `/orcamento/${token}`,
  newWithVehicle: (veiculoId: string) => `/ordens/novo?veiculo_id=${veiculoId}`
} as const
