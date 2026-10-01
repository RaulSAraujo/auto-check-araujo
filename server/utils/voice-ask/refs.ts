export type VoiceRefType = 'order' | 'customer' | 'vehicle' | 'appointment' | 'account'

export interface VoiceLink {
  label: string
  to: string
}

type Row = Record<string, unknown>

const MAX_LINKS = 5
// ponytail: fixed America/Sao_Paulo offset (no DST since 2019); switch to Intl time zone math if DST returns.
const SHOP_OFFSET_MS = -3 * 60 * 60 * 1000

function shopDay(iso: unknown): string | undefined {
  const time = typeof iso === 'string' ? Date.parse(iso) : Number.NaN
  return Number.isNaN(time) ? undefined : new Date(time + SHOP_OFFSET_MS).toISOString().slice(0, 10)
}

const LINK: Record<VoiceRefType, (id: string, row: Row) => VoiceLink> = {
  order: (id, row) => ({ label: `Abrir OS ${row.numero}`, to: `/ordens/${id}` }),
  customer: (id, row) => ({ label: `Abrir ${row.nome}`, to: `/clientes/${id}` }),
  vehicle: (id, row) => ({ label: `Abrir ${row.placa}`, to: `/veiculos/${id}` }),
  appointment: (_id, row) => {
    const day = shopDay(row.inicio)
    return day
      ? { label: `Abrir agenda de ${day.slice(8, 10)}/${day.slice(5, 7)}`, to: `/agendamentos?dia=${day}` }
      : { label: 'Abrir agenda', to: '/agendamentos' }
  },
  account: () => ({ label: 'Abrir contas a pagar', to: '/gestao/financeiro?aba=contas' })
}

/** Records seen in this request's tool results; only those can become links. */
export function createRefs() {
  const seen = new Map<string, VoiceLink>()
  return {
    add(type: VoiceRefType, id: string, row: Row) {
      seen.set(`${type}:${id}`, LINK[type](id, row))
    },
    links(raw: unknown): VoiceLink[] {
      if (!Array.isArray(raw)) return []
      const out: VoiceLink[] = []
      for (const ref of raw) {
        if (!ref || typeof ref !== 'object') continue
        const { type, id } = ref as Row
        const link = typeof type === 'string' && typeof id === 'string' ? seen.get(`${type}:${id}`) : undefined
        if (link && !out.some(item => item.to === link.to)) out.push(link)
        if (out.length === MAX_LINKS) break
      }
      return out
    }
  }
}
