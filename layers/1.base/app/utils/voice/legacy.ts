import type { LegacyVoiceCommand } from './legacy-types.ts'

/**
 * Maps the v1 keyword parser output to the catalog command shape (raw, unvalidated).
 * The result must still go through `normalizeVoiceCommand`.
 */
export function legacyToCommand(command: LegacyVoiceCommand | null): unknown {
  if (!command) return null
  const p = command.payload as Record<string, unknown>
  switch (command.intent) {
    case 'customer.create':
    case 'catalogItem.create':
    case 'supplier.create':
    case 'collaborator.create': {
      const entity = { 'customer.create': 'customer', 'catalogItem.create': 'catalogItem', 'supplier.create': 'supplier', 'collaborator.create': 'collaborator' }[command.intent]
      return { op: 'create', entity, fields: p }
    }
    case 'vehicle.create': {
      const { clienteNome, ...rest } = p
      return { op: 'create', entity: 'vehicle', fields: { ...rest, dono: clienteNome } }
    }
    case 'order.create': {
      const { placa, ...rest } = p
      return { op: 'create', entity: 'order', fields: { ...rest, veiculo: placa } }
    }
    case 'appointment.create': {
      const { placa, ...rest } = p
      return { op: 'create', entity: 'appointment', fields: { ...rest, veiculo: placa } }
    }
    case 'budgetItem.create':
      return { op: 'edit', entity: 'order', items: [p] }
    case 'account.create': {
      const { categoriaNome, fornecedorNome, ...rest } = p
      return { op: 'create', entity: 'account', fields: { ...rest, categoria: categoriaNome, fornecedor: fornecedorNome } }
    }
    default:
      return null
  }
}
