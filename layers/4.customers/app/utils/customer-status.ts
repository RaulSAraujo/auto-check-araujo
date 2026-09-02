export const CUSTOMER_STATUS_FILTER_ALL = 'all' as const
export const CUSTOMER_STATUS_FILTER_ACTIVE = 'ativos' as const
export const CUSTOMER_STATUS_FILTER_INACTIVE = 'inativos' as const

export type CustomerStatusFilter
  = | typeof CUSTOMER_STATUS_FILTER_ALL
    | typeof CUSTOMER_STATUS_FILTER_ACTIVE
    | typeof CUSTOMER_STATUS_FILTER_INACTIVE

export const CUSTOMER_STATUS_FILTER_ITEMS = [
  { label: 'Ativos', value: CUSTOMER_STATUS_FILTER_ACTIVE },
  { label: 'Inativos', value: CUSTOMER_STATUS_FILTER_INACTIVE },
  { label: 'Todos', value: CUSTOMER_STATUS_FILTER_ALL }
] as const
