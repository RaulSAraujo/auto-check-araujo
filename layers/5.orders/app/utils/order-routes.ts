export const ORDER_ROUTES = {
  list: '/ordens',
  new: '/ordens/novo',
  detail: (id: string) => `/ordens/${id}`,
  print: (id: string) => `/ordens/${id}/impressao`,
  newWithVehicle: (veiculoId: string) => `/ordens/novo?veiculo_id=${veiculoId}`,
  newFromAppointment: (veiculoId: string, agendamentoId: string) =>
    `/ordens/novo?veiculo_id=${veiculoId}&agendamento_id=${agendamentoId}`
} as const
