import type { BreadcrumbItem } from '@nuxt/ui'
import { APP_ROUTES } from '#layers/base/app/utils/app-routes'
import type { PermissionAction } from '#layers/auth/app/utils/permissions'

export interface SettingsHubItem {
  label: string
  description: string
  icon: string
  to: string
  permission: PermissionAction
}

/** Destinos do hub `/configuracao` (avatar → Configuração). */
export const SETTINGS_HUB_ITEMS: SettingsHubItem[] = [
  {
    label: 'Equipe',
    description: 'Logins, papéis e senhas',
    icon: 'i-lucide-users',
    to: APP_ROUTES.team,
    permission: 'collaborators.manage'
  },
  {
    label: 'Catálogo',
    description: 'Serviços, peças e kits',
    icon: 'i-lucide-package',
    to: APP_ROUTES.catalog,
    permission: 'catalog.manage'
  },
  {
    label: 'Fornecedores',
    description: 'Quem vende peças e serviços',
    icon: 'i-lucide-truck',
    to: APP_ROUTES.catalogSuppliers,
    permission: 'catalog.manage'
  },
  {
    label: 'Precificação',
    description: 'Mão de obra, peças e taxas',
    icon: 'i-lucide-percent',
    to: APP_ROUTES.pricing,
    permission: 'catalog.manage'
  }
]

/** Breadcrumb Configuração → página atual (Trunk Test). */
export function settingsHubBreadcrumb(currentLabel: string): BreadcrumbItem[] {
  return [
    { label: 'Configuração', to: APP_ROUTES.settings },
    { label: currentLabel }
  ]
}

export function isSettingsHubPath(path: string): boolean {
  return path === APP_ROUTES.settings
    || path.startsWith(`${APP_ROUTES.settings}/`)
    || path === APP_ROUTES.team
    || path.startsWith(`${APP_ROUTES.team}/`)
}
