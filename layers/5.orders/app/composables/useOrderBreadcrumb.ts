import type { BreadcrumbItem } from '@nuxt/ui'
import { ORDER_ROUTES } from '../utils/order-routes'

export type OrderBreadcrumbOrigin
  = 'orders'
    | 'customers'
    | 'vehicles'
    | 'kanban'
    | 'scheduling'

function getHistoryBackPath(): string | null {
  if (!import.meta.client) return null
  const back = window.history.state?.back
  return typeof back === 'string' && back.length > 0 ? back : null
}

export function resolveOrderBreadcrumbOrigin(
  backPath: string | null = getHistoryBackPath()
): OrderBreadcrumbOrigin {
  if (!backPath) return 'orders'

  const path = backPath.split('?')[0] || backPath

  if (path === APP_ROUTES.customers || path.startsWith(`${APP_ROUTES.customers}/`)) {
    return 'customers'
  }
  if (path === APP_ROUTES.vehicles || path.startsWith(`${APP_ROUTES.vehicles}/`)) {
    return 'vehicles'
  }
  if (path === APP_ROUTES.kanban || path.startsWith(`${APP_ROUTES.kanban}/`)) {
    return 'kanban'
  }
  if (path === APP_ROUTES.scheduling || path.startsWith(`${APP_ROUTES.scheduling}/`)) {
    return 'scheduling'
  }

  return 'orders'
}

export function useOrderBreadcrumb(options: {
  origin: OrderBreadcrumbOrigin
  numero: MaybeRefOrGetter<string>
  vehicle: MaybeRefOrGetter<{
    id: string
    placa: string
    clientes: { id: string, nome: string } | null
  } | null | undefined>
}) {
  const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
    const numero = toValue(options.numero)
    const vehicle = toValue(options.vehicle)
    const owner = vehicle?.clientes
    const origin = options.origin

    if (origin === 'customers' && owner && vehicle) {
      return [
        { label: 'Clientes', to: APP_ROUTES.customers },
        { label: owner.nome, to: `${APP_ROUTES.customers}/${owner.id}` },
        { label: formatPlaca(vehicle.placa), to: `${APP_ROUTES.vehicles}/${vehicle.id}` },
        { label: numero }
      ]
    }

    if (origin === 'customers' && owner) {
      return [
        { label: 'Clientes', to: APP_ROUTES.customers },
        { label: owner.nome, to: `${APP_ROUTES.customers}/${owner.id}` },
        { label: numero }
      ]
    }

    if (origin === 'vehicles' && vehicle) {
      return [
        { label: 'Veículos', to: APP_ROUTES.vehicles },
        { label: formatPlaca(vehicle.placa), to: `${APP_ROUTES.vehicles}/${vehicle.id}` },
        { label: numero }
      ]
    }

    if (origin === 'kanban') {
      return [
        { label: 'Kanban', to: APP_ROUTES.kanban },
        { label: numero }
      ]
    }

    if (origin === 'scheduling') {
      return [
        { label: 'Agenda', to: APP_ROUTES.scheduling },
        { label: numero }
      ]
    }

    return [
      { label: 'Ordens', to: ORDER_ROUTES.list },
      { label: numero }
    ]
  })

  return { breadcrumbItems }
}
