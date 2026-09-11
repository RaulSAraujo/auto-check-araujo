export type SettingsHubSection = 'configuracao'

export type SettingsHubPermission
  = | 'catalog.manage'
    | 'collaborators.manage'

export type SettingsHubItem = {
  id: string
  label: string
  description: string
  to: string
  icon: string
  section: SettingsHubSection
  permission?: SettingsHubPermission
}

export const SETTINGS_HUB_SECTION_LABEL: Record<SettingsHubSection, string> = {
  configuracao: 'Configuração'
}

export const SETTINGS_HUB_ITEMS: SettingsHubItem[] = [
  {
    id: 'team',
    label: 'Equipe',
    description: 'Colaboradores, papéis e senhas.',
    to: APP_ROUTES.team,
    icon: 'i-lucide-user-cog',
    section: 'configuracao',
    permission: 'collaborators.manage'
  },
  {
    id: 'catalog',
    label: 'Catálogo',
    description: 'Serviços, kits, peças e estoque.',
    to: APP_ROUTES.catalog,
    icon: 'i-lucide-package',
    section: 'configuracao',
    permission: 'catalog.manage'
  },
  {
    id: 'suppliers',
    label: 'Fornecedores',
    description: 'Quem emite contas e peças.',
    to: APP_ROUTES.catalogSuppliers,
    icon: 'i-lucide-truck',
    section: 'configuracao',
    permission: 'catalog.manage'
  },
  {
    id: 'pricing',
    label: 'Precificação',
    description: 'Parâmetros de mão de obra e peças.',
    to: APP_ROUTES.pricing,
    icon: 'i-lucide-calculator',
    section: 'configuracao',
    permission: 'catalog.manage'
  }
]

export const SETTINGS_HUB_SECTIONS: SettingsHubSection[] = [
  'configuracao'
]

/** Paths that belong under the gear hub (for active state). */
export function isSettingsHubPath(path: string): boolean {
  if (path === APP_ROUTES.settings || path.startsWith(`${APP_ROUTES.settings}/`)) {
    return true
  }
  return SETTINGS_HUB_ITEMS.some(item =>
    path === item.to || path.startsWith(`${item.to}/`)
  )
}
