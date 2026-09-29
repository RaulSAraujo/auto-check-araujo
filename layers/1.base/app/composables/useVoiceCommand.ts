import type { PermissionAction } from '#layers/auth/app/utils/permissions'
import type { VoiceDraftMap, VoiceIntent } from '../utils/voice/types'
import { parseVoiceCommand } from '../utils/voice/parser'

export type VoiceRunResult
  = | { ok: true, intent: VoiceIntent }
    | { ok: false, reason: 'not_understood' | 'forbidden' | 'context' }

const VOICE_INTENT_CONFIG: Record<VoiceIntent, { permission: PermissionAction, path: string | null }> = {
  'customer.create': { permission: 'customers.write', path: APP_ROUTES.customersNew },
  'vehicle.create': { permission: 'vehicles.write', path: APP_ROUTES.vehiclesNew },
  'order.create': { permission: 'orders.create', path: APP_ROUTES.ordersNew },
  'appointment.create': { permission: 'scheduling.write', path: APP_ROUTES.scheduling },
  'budgetItem.create': { permission: 'budget.edit', path: null },
  'account.create': { permission: 'finance.view', path: APP_ROUTES.finance },
  'catalogItem.create': { permission: 'catalog.manage', path: APP_ROUTES.catalog },
  'supplier.create': { permission: 'catalog.manage', path: APP_ROUTES.catalogSuppliers },
  'collaborator.create': { permission: 'collaborators.manage', path: APP_ROUTES.team },
  'order.edit': { permission: 'orders.edit', path: null },
  'customer.edit': { permission: 'customers.write', path: null },
  'vehicle.edit': { permission: 'vehicles.write', path: null },
  'appointment.reschedule': { permission: 'scheduling.write', path: null },
  'appointment.noShow': { permission: 'scheduling.write', path: null },
  'navigate': { permission: 'orders.edit', path: null }
}

const ORDER_DETAIL_PATH = /^\/ordens\/(?!novo$)[^/]+$/

export function useVoiceCommand() {
  const { currentRoute } = useRouter()
  const toast = useToast()
  const { can } = usePermissions()
  const { setVoiceDraft, clearVoiceDraft } = useVoiceDraft()
  const { findVehicleIdByPlaca, findUniqueIdByName } = useVoiceLookup()

  async function run(text: string): Promise<VoiceRunResult> {
    const command = parseVoiceCommand(text)
    if (!command) return { ok: false, reason: 'not_understood' }

    const config = VOICE_INTENT_CONFIG[command.intent]
    if (!can(config.permission)) {
      toast.add({
        title: 'Sem permissão',
        description: 'Seu perfil não pode criar este tipo de registro.',
        color: 'warning'
      })
      return { ok: false, reason: 'forbidden' }
    }

    if (command.intent === 'budgetItem.create' && !ORDER_DETAIL_PATH.test(currentRoute.value.path)) {
      toast.add({
        title: 'Abra uma OS',
        description: 'Para adicionar itens por voz, abra a ordem de serviço primeiro.',
        color: 'warning'
      })
      return { ok: false, reason: 'context' }
    }

    const path = config.path ?? currentRoute.value.path
    const warnings: string[] = []

    switch (command.intent) {
      case 'vehicle.create': {
        const { payload } = command
        const draft: VoiceDraftMap['vehicle.create'] = { ...payload }
        if (payload.clienteNome) {
          const clienteId = await findUniqueIdByName('clientes', payload.clienteNome)
          if (clienteId) draft.cliente_id = clienteId
          else warnings.push(`Cliente "${payload.clienteNome}" não encontrado ou ambíguo.`)
        }
        setVoiceDraft(command.intent, draft)
        break
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
        break
      }
      case 'budgetItem.create': {
        const { payload } = command
        const draft: VoiceDraftMap['budgetItem.create'] = { ...payload, orderId: String(currentRoute.value.params.id) }
        if (payload.descricao) {
          const catalogItemId = await findUniqueIdByName('servicos_catalogo', payload.descricao, { tipo: payload.tipo })
          if (catalogItemId) draft.catalogItemId = catalogItemId
        }
        setVoiceDraft(command.intent, draft)
        break
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
        break
      }
      case 'order.edit':
      case 'customer.edit':
      case 'vehicle.edit':
      case 'appointment.reschedule':
      case 'appointment.noShow':
      case 'navigate':
        return { ok: false, reason: 'not_understood' }
      default:
        setVoiceDraft(command.intent, command.payload)
    }

    if (path !== currentRoute.value.path) await navigateTo(path)
    if (currentRoute.value.path !== path) {
      clearVoiceDraft()
      return { ok: false, reason: 'context' }
    }

    toast.add({
      title: 'Formulário preenchido por voz',
      description: 'Confira os dados e salve.',
      color: 'info',
      icon: 'i-lucide-mic'
    })
    warnings.forEach(title => toast.add({ title, color: 'warning' }))
    return { ok: true, intent: command.intent }
  }

  return { run }
}
