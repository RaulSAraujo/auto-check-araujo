import type { PermissionAction } from '#layers/auth/app/utils/permissions'
import { VOICE_CATALOG, type VoiceRefKind } from '../utils/voice/catalog'
import { legacyToCommand } from '../utils/voice/legacy'
import { normalizeVoiceCommand } from '../utils/voice/normalize'
import { parseVoiceCommand } from '../utils/voice/parser'
import { localDateInput, voicePageFromPath } from '../utils/voice/prompt'
import type { VoiceCommand, VoiceDraft, VoiceEntityKey, VoiceNavTarget, VoicePage, VoiceRecord } from '../utils/voice/types'
import type { VoiceCurrent } from './useVoiceDraft'
import type { VoiceFound } from './useVoiceLookup'

export type VoiceRunResult
  = | { ok: true }
    | { ok: false, reason: 'not_understood' | 'forbidden' | 'context' | 'cancelled' }

/** `opened`: only navigates, no draft is stored. */
type Destination = { path: string, query?: Record<string, string>, opened?: true }

const NAV: Record<VoiceNavTarget, { path: string, permission?: PermissionAction }> = {
  home: { path: APP_ROUTES.home },
  orders: { path: APP_ROUTES.orders },
  scheduling: { path: APP_ROUTES.scheduling },
  customers: { path: APP_ROUTES.customers },
  vehicles: { path: APP_ROUTES.vehicles },
  finance: { path: APP_ROUTES.finance, permission: 'finance.view' },
  team: { path: APP_ROUTES.team, permission: 'collaborators.manage' },
  catalog: { path: APP_ROUTES.catalog, permission: 'catalog.manage' },
  suppliers: { path: APP_ROUTES.catalogSuppliers, permission: 'catalog.manage' },
  pricing: { path: APP_ROUTES.pricing, permission: 'catalog.manage' },
  settings: { path: APP_ROUTES.settings }
}

const RECORD_PATH: Partial<Record<VoiceEntityKey, (id: string) => string>> = {
  order: id => `/ordens/${id}`,
  customer: id => `/clientes/${id}`,
  vehicle: id => `/veiculos/${id}`
}

const CREATE_PATH: Partial<Record<VoiceEntityKey, string>> = {
  order: APP_ROUTES.ordersNew,
  customer: APP_ROUTES.customersNew,
  vehicle: APP_ROUTES.vehiclesNew
}

const SCREEN_PATH: Record<VoiceEntityKey, string> = {
  order: APP_ROUTES.orders,
  customer: APP_ROUTES.customers,
  vehicle: APP_ROUTES.vehicles,
  appointment: APP_ROUTES.scheduling,
  account: APP_ROUTES.finance,
  category: APP_ROUTES.finance,
  catalogItem: APP_ROUTES.catalog,
  supplier: APP_ROUTES.catalogSuppliers,
  collaborator: APP_ROUTES.team,
  pricing: APP_ROUTES.pricing
}

const REF_LABEL: Record<VoiceRefKind, string> = {
  vehicle: 'Placa',
  customer: 'Cliente',
  supplier: 'Fornecedor',
  category: 'Categoria',
  catalogItem: 'Item do catálogo'
}

export function useVoiceCommand() {
  const { currentRoute } = useRouter()
  const toast = useToast()
  const { can } = usePermissions()
  const { setVoiceDraft, clearVoiceDraft, current } = useVoiceDraft()
  const lookup = useVoiceLookup()

  async function interpret(text: string, page: VoicePage): Promise<VoiceCommand | null> {
    const local = () => normalizeVoiceCommand(legacyToCommand(parseVoiceCommand(text)))
    try {
      const { command } = await $fetch<{ command: VoiceCommand | null }>('/api/voice/interpret', {
        method: 'POST',
        body: { text, context: { page, today: localDateInput(new Date()) } },
        // Server worst case: 3 providers × 8 s.
        timeout: 30_000
      })
      return command ?? local()
    } catch {
      return local()
    }
  }

  function warn(title: string, description?: string) {
    toast.add({ title, description, color: 'warning' })
  }

  function findRef(kind: VoiceRefKind, value: string, tipo?: string): Promise<VoiceFound | undefined> {
    return kind === 'vehicle' ? lookup.findVehicle(value) : lookup.findNamed(kind, value, { tipo })
  }

  async function findTarget(entityKey: VoiceEntityKey, command: VoiceCommand): Promise<VoiceFound | undefined> {
    const t = command.target ?? {}
    switch (entityKey) {
      case 'order':
        return lookup.findOrder(t)
      case 'vehicle':
        return t.placa ? lookup.findVehicle(t.placa) : undefined
      case 'appointment': {
        const vehicle = t.placa ? await lookup.findVehicle(t.placa) : undefined
        const found = vehicle && await lookup.findAppointment(vehicle.id, { noShow: command.action === 'desfazerFalta' })
        return found && vehicle ? { id: found.id, inicio: found.inicio, label: vehicle.label } : undefined
      }
      case 'account':
        return t.descricao ? lookup.findAccount(t.descricao, { reopen: command.action === 'reabrir' }) : undefined
      case 'collaborator':
        return t.nome ? lookup.findCollaborator(t.nome) : undefined
      case 'customer':
      case 'supplier':
      case 'category':
      case 'catalogItem':
        return t.nome
          ? lookup.findNamed(entityKey, t.nome, { includeInactive: command.action === 'reativar' || command.action === 'ativar' })
          : undefined
      default:
        return undefined
    }
  }

  async function resolveRefs(entityKey: VoiceEntityKey, fields: VoiceRecord | undefined, warnings: string[]): Promise<VoiceRecord> {
    const out: VoiceRecord = {}
    const spec = VOICE_CATALOG[entityKey].fields
    for (const [key, value] of Object.entries(fields ?? {})) {
      const ref = spec[key]?.ref
      if (!ref || typeof value !== 'string') {
        out[key] = value
        continue
      }
      const found = await findRef(ref, value)
      if (found) out[key] = found.id
      else warnings.push(`${REF_LABEL[ref]} "${ref === 'vehicle' ? formatPlaca(value) : value}" não encontrado ou ambíguo.`)
    }
    return out
  }

  async function resolveItems(entityKey: VoiceEntityKey, items: VoiceRecord[] | undefined, warnings: string[]): Promise<VoiceRecord[] | undefined> {
    if (!items?.length) return undefined
    const spec = VOICE_CATALOG[entityKey].items ?? {}
    const resolved = await Promise.all(items.map(async (item) => {
      const out: VoiceRecord = { ...item }
      for (const [key, value] of Object.entries(item)) {
        const ref = spec[key]?.ref
        if (!ref || typeof value !== 'string') continue
        const found = await findRef(ref, value)
        if (!found) {
          warnings.push(`${REF_LABEL[ref]} "${value}" não encontrado ou ambíguo.`)
          return null
        }
        out[key] = found.id
      }
      if (entityKey === 'order' && typeof item.descricao === 'string') {
        const found = await findRef('catalogItem', item.descricao, typeof item.tipo === 'string' ? item.tipo : undefined)
        if (found) out.catalogItemId = found.id
      }
      return out
    }))
    const kept = resolved.filter((item): item is VoiceRecord => !!item)
    return kept.length ? kept : undefined
  }

  async function buildDraft(entityKey: VoiceEntityKey, command: VoiceCommand, page: VoicePage, warnings: string[]): Promise<VoiceDraft | null> {
    const entity = VOICE_CATALOG[entityKey]
    const op = command.op as VoiceDraft['op']
    const draft: VoiceDraft = { entity: entityKey, op, fields: {} }

    if (op !== 'create' && Object.keys(entity.target).length) {
      const onScreen = entity.pages.includes(page) ? current.value[entityKey] : undefined
      const found: (VoiceCurrent & { inicio?: string }) | undefined = command.target ? await findTarget(entityKey, command) : onScreen
      if (!found) {
        const said = Object.values(command.target ?? {})[0]
        if (said) warn(`Não encontrei ${entity.label} "${said}".`, 'Confira o nome, a placa ou o número.')
        else warn(`Qual ${entity.label}?`, 'Diga o nome, a placa ou o número.')
        return null
      }
      draft.id = found.id
      draft.label = found.label
      if (found.inicio) draft.inicio = found.inicio
    }

    draft.fields = await resolveRefs(entityKey, command.fields, warnings)
    if (entityKey === 'order' && command.items?.length && !can('budget.edit')) {
      warnings.push('Sem permissão para adicionar itens ao orçamento.')
    } else {
      const items = await resolveItems(entityKey, command.items, warnings)
      if (items) draft.items = items
    }
    if (command.action) draft.action = command.action
    if (command.args) draft.args = command.args
    return draft
  }

  function destinationFor(draft: VoiceDraft): Destination {
    const record = draft.id ? RECORD_PATH[draft.entity] : undefined
    if (draft.op === 'create') {
      const path = CREATE_PATH[draft.entity] ?? SCREEN_PATH[draft.entity]
      const day = draft.entity === 'appointment' && typeof draft.fields.date === 'string' ? draft.fields.date : undefined
      return day ? { path, query: { dia: day } } : { path }
    }
    if (record) return { path: record(draft.id!) }
    if (draft.entity === 'appointment' && draft.inicio) {
      return { path: SCREEN_PATH.appointment, query: { dia: localDateInput(new Date(draft.inicio)) } }
    }
    return { path: SCREEN_PATH[draft.entity] }
  }

  async function go(destination: Destination, here: string, isCancelled: () => boolean, filled: boolean, warnings: string[] = []): Promise<VoiceRunResult> {
    if (isCancelled()) {
      clearVoiceDraft()
      return { ok: false, reason: 'cancelled' }
    }
    if (destination.path !== here || destination.query) {
      try {
        await navigateTo({ path: destination.path, query: destination.query })
      } catch (error) {
        clearVoiceDraft()
        throw error
      }
    }
    if (currentRoute.value.path !== destination.path) {
      clearVoiceDraft()
      return { ok: false, reason: 'context' }
    }
    if (destination.opened) toast.add({ title: 'Aberto por voz', color: 'info', icon: 'i-lucide-mic' })
    else if (filled) toast.add({ title: 'Preenchido por voz', description: 'Confira os dados e salve.', color: 'info', icon: 'i-lucide-mic' })
    warnings.forEach(title => warn(title))
    return { ok: true }
  }

  function forbidden(): VoiceRunResult {
    warn('Sem permissão', 'Seu perfil não pode fazer isso.')
    return { ok: false, reason: 'forbidden' }
  }

  /** `isCancelled`: the AI call can take seconds; a closed modal must not navigate or prefill afterwards. */
  async function run(text: string, isCancelled: () => boolean = () => false): Promise<VoiceRunResult> {
    const here = currentRoute.value.path
    const page = voicePageFromPath(here)
    const command = await interpret(text, page)
    if (isCancelled()) return { ok: false, reason: 'cancelled' }
    if (!command) return { ok: false, reason: 'not_understood' }

    if (command.op === 'navigate') {
      const nav = NAV[command.to!]
      if (nav.permission && !can(nav.permission)) return forbidden()
      const query = command.to === 'scheduling' && command.date ? { dia: command.date } : undefined
      return go({ path: nav.path, query }, here, isCancelled, false)
    }

    const entityKey = command.entity!
    const entity = VOICE_CATALOG[entityKey]
    const permission = command.op === 'action'
      ? entity.actions[command.action!]!.permission
      : entity.permission[command.op as 'create' | 'edit']
    if (!permission) return go({ path: SCREEN_PATH[entityKey], opened: true }, here, isCancelled, false)
    if (!can(permission)) return forbidden()

    const warnings: string[] = []
    const draft = await buildDraft(entityKey, command, page, warnings)
    if (isCancelled()) return { ok: false, reason: 'cancelled' }
    if (!draft) return { ok: false, reason: 'context' }

    const destination = destinationFor(draft)
    const opened = draft.op === 'edit' && !!RECORD_PATH[entityKey] && !Object.keys(draft.fields).length && !draft.items?.length
    if (opened) {
      // Nothing left to fill (items without permission, unresolved refs): explain instead of "not understood".
      if (destination.path === here) {
        warnings.forEach(title => warn(title))
        return { ok: false, reason: warnings.length ? 'context' : 'not_understood' }
      }
      destination.opened = true
    } else {
      setVoiceDraft(draft)
    }
    return go(destination, here, isCancelled, !opened && draft.op !== 'action', warnings)
  }

  return { run }
}
