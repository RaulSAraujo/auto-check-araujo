import type { PermissionAction } from '#layers/auth/app/utils/permissions'
import type {
  VoiceBudgetItemDraft,
  VoiceBudgetItemPayload,
  VoiceCommand,
  VoiceDraftMap,
  VoiceIntent,
  VoiceNavTarget,
  VoicePage
} from '../utils/voice/types'
import { parseVoiceCommand } from '../utils/voice/parser'
import { localDateInput, voicePageFromPath } from '../utils/voice/prompt'

export type VoiceRunResult
  = | { ok: true, intent: VoiceIntent }
    | { ok: false, reason: 'not_understood' | 'forbidden' | 'context' }

/** `opened`: an edit command without fields only navigates, no draft is stored. */
type Destination = { path: string, query?: Record<string, string>, opened?: true }

const INTENT_PERMISSION: Record<Exclude<VoiceIntent, 'navigate'>, PermissionAction> = {
  'customer.create': 'customers.write',
  'vehicle.create': 'vehicles.write',
  'order.create': 'orders.create',
  'appointment.create': 'scheduling.write',
  'budgetItem.create': 'budget.edit',
  'account.create': 'finance.view',
  'catalogItem.create': 'catalog.manage',
  'supplier.create': 'catalog.manage',
  'collaborator.create': 'collaborators.manage',
  'order.edit': 'orders.edit',
  'customer.edit': 'customers.write',
  'vehicle.edit': 'vehicles.write',
  'appointment.reschedule': 'scheduling.write',
  'appointment.noShow': 'scheduling.write'
}

const CREATE_PATH: Partial<Record<VoiceIntent, string>> = {
  'customer.create': APP_ROUTES.customersNew,
  'vehicle.create': APP_ROUTES.vehiclesNew,
  'order.create': APP_ROUTES.ordersNew,
  'appointment.create': APP_ROUTES.scheduling,
  'account.create': APP_ROUTES.finance,
  'catalogItem.create': APP_ROUTES.catalog,
  'supplier.create': APP_ROUTES.catalogSuppliers,
  'collaborator.create': APP_ROUTES.team
}

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

export function useVoiceCommand() {
  const { currentRoute } = useRouter()
  const toast = useToast()
  const { can } = usePermissions()
  const { setVoiceDraft, clearVoiceDraft } = useVoiceDraft()
  const { findVehicleIdByPlaca, findUniqueIdByName, findOrderId, findNextAppointment } = useVoiceLookup()

  async function interpret(text: string, page: VoicePage): Promise<VoiceCommand | null> {
    try {
      const { command } = await $fetch<{ command: VoiceCommand | null }>('/api/voice/interpret', {
        method: 'POST',
        body: { text, context: { page, today: localDateInput(new Date()) } },
        timeout: 30_000
      })
      return command ?? parseVoiceCommand(text)
    } catch {
      return parseVoiceCommand(text)
    }
  }

  function currentId(): string {
    return String(currentRoute.value.params.id)
  }

  async function budgetItemDraft(item: VoiceBudgetItemPayload): Promise<VoiceBudgetItemDraft> {
    const draft: VoiceBudgetItemDraft = { ...item }
    if (item.descricao) {
      const catalogItemId = await findUniqueIdByName('servicos_catalogo', item.descricao, { tipo: item.tipo })
      if (catalogItemId) draft.catalogItemId = catalogItemId
    }
    return draft
  }

  async function resolve(command: VoiceCommand, page: VoicePage, warnings: string[]): Promise<Destination | null> {
    switch (command.intent) {
      case 'navigate': {
        const { to, date } = command.payload
        if (to === 'scheduling' && date) return { path: APP_ROUTES.scheduling, query: { dia: date } }
        return { path: NAV[to].path }
      }
      case 'vehicle.create': {
        const { payload } = command
        const draft: VoiceDraftMap['vehicle.create'] = { ...payload }
        if (payload.clienteNome) {
          const clienteId = await findUniqueIdByName('clientes', payload.clienteNome)
          if (clienteId) draft.cliente_id = clienteId
          else warnings.push(`Cliente "${payload.clienteNome}" não encontrado ou ambíguo.`)
        }
        setVoiceDraft(command.intent, draft)
        return { path: APP_ROUTES.vehiclesNew }
      }
      case 'order.create':
      case 'appointment.create': {
        const { payload } = command
        const draft: VoiceDraftMap['order.create' | 'appointment.create'] = { ...payload }
        if (payload.placa) {
          const veiculoId = await findVehicleIdByPlaca(payload.placa)
          if (veiculoId) draft.veiculo_id = veiculoId
          else warnings.push(`Placa ${formatPlaca(payload.placa)} não encontrada.`)
        }
        setVoiceDraft(command.intent, draft)
        return { path: CREATE_PATH[command.intent]! }
      }
      case 'budgetItem.create': {
        if (page !== 'order-detail') {
          toast.add({ title: 'Abra uma OS', description: 'Para adicionar itens por voz, abra a ordem de serviço primeiro.', color: 'warning' })
          return null
        }
        setVoiceDraft(command.intent, { ...(await budgetItemDraft(command.payload)), orderId: currentId() })
        return { path: currentRoute.value.path }
      }
      case 'account.create': {
        const { payload } = command
        const draft: VoiceDraftMap['account.create'] = { ...payload }
        if (payload.categoriaNome) {
          const categoriaId = await findUniqueIdByName('financeiro_categorias', payload.categoriaNome)
          if (categoriaId) draft.categoria_id = categoriaId
          else warnings.push(`Categoria "${payload.categoriaNome}" não encontrada ou ambígua.`)
        }
        if (payload.fornecedorNome) {
          const fornecedorId = await findUniqueIdByName('fornecedores', payload.fornecedorNome)
          if (fornecedorId) draft.fornecedor_id = fornecedorId
          else warnings.push(`Fornecedor "${payload.fornecedorNome}" não encontrado ou ambíguo.`)
        }
        setVoiceDraft(command.intent, draft)
        return { path: APP_ROUTES.finance }
      }
      case 'order.edit': {
        const { target, itens, ...fields } = command.payload
        const orderId = target ? await findOrderId(target) : page === 'order-detail' ? currentId() : undefined
        if (!orderId) {
          if (target?.numero) {
            toast.add({ title: `OS ${target.numero} não encontrada.`, color: 'warning' })
          } else {
            toast.add({
              title: target ? 'Nenhuma OS em aberto encontrada' : 'Qual OS?',
              description: target ? 'Confira a placa, o número ou o cliente. Para criar, diga "nova OS".' : 'Diga a placa, o número da OS ou o cliente.',
              color: 'warning'
            })
          }
          return null
        }
        const draft: VoiceDraftMap['order.edit'] = { ...fields, orderId }
        const [first] = itens ?? []
        if (first) {
          if (can('budget.edit')) draft.item = await budgetItemDraft(first)
          else warnings.push('Sem permissão para adicionar itens ao orçamento.')
        }
        if ((itens?.length ?? 0) > 1) warnings.push('Só o primeiro item foi preenchido. Dite o próximo em seguida.')
        const path = `/ordens/${orderId}`
        if (Object.keys(draft).length === 1) return { path, opened: true }
        setVoiceDraft(command.intent, draft)
        return { path }
      }
      case 'customer.edit': {
        const { target, ...fields } = command.payload
        const clienteId = target?.nome
          ? await findUniqueIdByName('clientes', target.nome)
          : page === 'customer-detail' ? currentId() : undefined
        if (!clienteId) {
          toast.add({ title: target?.nome ? `Cliente "${target.nome}" não encontrado ou ambíguo.` : 'Qual cliente? Diga o nome.', color: 'warning' })
          return null
        }
        const path = `/clientes/${clienteId}`
        if (!Object.keys(fields).length) return { path, opened: true }
        setVoiceDraft(command.intent, { ...fields, clienteId })
        return { path }
      }
      case 'vehicle.edit': {
        const { target, ...fields } = command.payload
        const veiculoId = target?.placa
          ? await findVehicleIdByPlaca(target.placa)
          : page === 'vehicle-detail' ? currentId() : undefined
        if (!veiculoId) {
          toast.add({ title: target?.placa ? `Placa ${formatPlaca(target.placa)} não encontrada.` : 'Qual veículo? Diga a placa.', color: 'warning' })
          return null
        }
        const path = `/veiculos/${veiculoId}`
        if (!Object.keys(fields).length) return { path, opened: true }
        setVoiceDraft(command.intent, { ...fields, veiculoId })
        return { path }
      }
      case 'appointment.reschedule':
      case 'appointment.noShow': {
        const { placa } = command.payload
        const veiculoId = placa ? await findVehicleIdByPlaca(placa) : undefined
        const appointment = veiculoId ? await findNextAppointment(veiculoId) : undefined
        if (!appointment) {
          toast.add({ title: placa ? `Nenhum agendamento futuro para ${formatPlaca(placa)}.` : 'Diga a placa do agendamento.', color: 'warning' })
          return null
        }
        const base = { appointmentId: appointment.id, inicio: appointment.inicio }
        if (command.intent === 'appointment.reschedule') {
          const { date, startTime } = command.payload
          setVoiceDraft(command.intent, { ...base, ...(date ? { date } : {}), ...(startTime ? { startTime } : {}) })
        } else {
          setVoiceDraft(command.intent, base)
        }
        return { path: APP_ROUTES.scheduling, query: { dia: localDateInput(new Date(appointment.inicio)) } }
      }
      default:
        setVoiceDraft(command.intent, command.payload)
        return { path: CREATE_PATH[command.intent]! }
    }
  }

  async function run(text: string): Promise<VoiceRunResult> {
    const page = voicePageFromPath(currentRoute.value.path)
    const command = await interpret(text, page)
    if (!command) return { ok: false, reason: 'not_understood' }

    const permission = command.intent === 'navigate'
      ? NAV[command.payload.to].permission
      : INTENT_PERMISSION[command.intent]
    if (permission && !can(permission)) {
      toast.add({ title: 'Sem permissão', description: 'Seu perfil não pode fazer isso.', color: 'warning' })
      return { ok: false, reason: 'forbidden' }
    }

    const warnings: string[] = []
    const destination = await resolve(command, page, warnings)
    if (!destination) {
      clearVoiceDraft()
      return { ok: false, reason: 'context' }
    }

    if (destination.path !== currentRoute.value.path || destination.query) {
      await navigateTo({ path: destination.path, query: destination.query })
    }
    if (currentRoute.value.path !== destination.path) {
      clearVoiceDraft()
      return { ok: false, reason: 'context' }
    }

    if (destination.opened) {
      toast.add({ title: 'Aberto por voz', color: 'info', icon: 'i-lucide-mic' })
    } else if (command.intent !== 'navigate') {
      toast.add({ title: 'Preenchido por voz', description: 'Confira os dados e salve.', color: 'info', icon: 'i-lucide-mic' })
    }
    warnings.forEach(title => toast.add({ title, color: 'warning' }))
    return { ok: true, intent: command.intent }
  }

  return { run }
}
