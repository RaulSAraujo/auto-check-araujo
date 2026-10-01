import type { serverSupabaseClient } from '#supabase/server'
import type { Database } from '../../../shared/types/database.ts'
import type { ColaboradorPapel } from '../../../shared/types/oficina.ts'
import { can, type PermissionAction } from '../../../layers/2.auth/app/utils/permissions.ts'
import { ilikePattern } from '../../../layers/1.base/app/utils/supabase-search.ts'
import type { ToolSchema } from './loop.ts'
import type { VoiceRefType } from './refs.ts'

type Db = Awaited<ReturnType<typeof serverSupabaseClient<Database>>>
type Args = Record<string, unknown>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>

export interface ToolContext {
  db: Db
  papel: ColaboradorPapel
  /** Shop-local YYYY-MM-DD sent by the client. */
  today: string
  see: (type: VoiceRefType, id: string, row: Row) => void
}

interface Tool {
  description: string
  parameters: Record<string, unknown>
  permission?: { anyOf: PermissionAction[], area: string }
  run: (args: Args, ctx: ToolContext) => Promise<unknown>
}

const MAX_ROWS = 10
const MAX_TEXT = 200
// ponytail: fixed America/Sao_Paulo offset (no DST since 2019); switch to Intl time zone math if DST returns.
const SHOP_OFFSET = '-03:00'
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/
const PLACA_RE = /^[A-Z]{3}\d[A-Z0-9]\d{2}$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ORDER_STATUS = ['aberta', 'em_andamento', 'concluida', 'cancelada'] as const
const APPOINTMENT_STATUS = ['agendado', 'confirmado', 'em_atendimento', 'concluido', 'nao_compareceu'] as const
const ACCOUNT_STATUS = ['a_pagar', 'pagas', 'vencidas'] as const
const CATALOG_TIPO = ['servico', 'peca', 'kit'] as const

const ORDER_SELECT = 'id, numero, status, orcamento_status, aberta_em, concluida_em, valor_total, pago, veiculos(id, placa, marca, modelo, clientes(id, nome))'
const ORDER_DETAIL_SELECT = `${ORDER_SELECT}, km_entrada, reclamacao, diagnostico, valor_cobrado, pago_em, forma_pagamento, parcelas`

class ArgError extends Error {
  readonly campo: string
  constructor(campo: string) {
    super(campo)
    this.campo = campo
  }
}

const present = (value: unknown) => value !== undefined && value !== null && value !== ''

function text(args: Args, key: string, max = 100): string | undefined {
  const value = args[key]
  if (!present(value)) return undefined
  if (typeof value !== 'string' && typeof value !== 'number') throw new ArgError(key)
  return String(value).trim().slice(0, max) || undefined
}

function date(args: Args, key: string): string | undefined {
  const value = args[key]
  if (!present(value)) return undefined
  if (typeof value !== 'string' || !DATE_RE.test(value) || Number.isNaN(Date.parse(value))) throw new ArgError(key)
  return value
}

function month(args: Args, key: string): string | undefined {
  const value = args[key]
  if (!present(value)) return undefined
  if (typeof value !== 'string' || !MONTH_RE.test(value)) throw new ArgError(key)
  return value
}

function oneOf<T extends string>(args: Args, key: string, values: readonly T[]): T | undefined {
  const value = args[key]
  if (!present(value)) return undefined
  if (!values.includes(value as T)) throw new ArgError(key)
  return value as T
}

function bool(args: Args, key: string): boolean | undefined {
  const value = args[key]
  if (!present(value)) return undefined
  if (typeof value !== 'boolean') throw new ArgError(key)
  return value
}

function limit(args: Args): number {
  if (!present(args.limit)) return MAX_ROWS
  const n = Number(args.limit)
  if (!Number.isInteger(n) || n < 1) throw new ArgError('limit')
  return Math.min(n, MAX_ROWS)
}

function placa(args: Args, key: string): string | undefined {
  const value = text(args, key, 20)?.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (value === undefined) return undefined
  if (!PLACA_RE.test(value)) throw new ArgError(key)
  return value
}

function digits(args: Args, key: string): string | undefined {
  const value = text(args, key, 40)?.replace(/\D/g, '')
  if (value === undefined) return undefined
  if (!value) throw new ArgError(key)
  return value
}

function uuid(args: Args, key: string): string | undefined {
  const value = text(args, key, 40)
  if (value === undefined) return undefined
  if (!UUID_RE.test(value)) throw new ArgError(key)
  return value
}

function rows<T = Row>(result: { data: unknown, error: unknown }): T[] {
  if (result.error) throw result.error
  return (result.data ?? []) as T[]
}

const cut = (value: unknown) => typeof value === 'string' ? value.slice(0, MAX_TEXT) : value ?? null
const dayStart = (day: string) => `${day}T00:00:00${SHOP_OFFSET}`
const dayEnd = (day: string) => `${day}T23:59:59.999${SHOP_OFFSET}`
/** Matches the digits whatever the stored mask: "11988887777" → "%1%1%9%…%". */
const digitsPattern = (value: string) => `%${value.split('').join('%')}%`
const onlyDigits = (value: unknown) => String(value ?? '').replace(/\D/g, '')
const concludedTotal = (orders: Row[]) => orders.filter(o => o.status === 'concluida').reduce((sum, o) => sum + Number(o.valor_total ?? 0), 0)

async function vehicleIdsByPlaca(db: Db, value: string): Promise<string[]> {
  return rows<{ id: string }>(await db.from('veiculos').select('id').eq('placa', value)).map(v => v.id)
}

function orderSummary(row: Row, see: ToolContext['see']) {
  const vehicle = row.veiculos
  const customer = vehicle?.clientes
  see('order', row.id, row)
  if (customer) see('customer', customer.id, customer)
  if (vehicle) see('vehicle', vehicle.id, vehicle)
  return {
    id: row.id,
    numero: row.numero,
    status: row.status,
    orcamento_status: row.orcamento_status,
    placa: vehicle?.placa ?? null,
    veiculo: [vehicle?.marca, vehicle?.modelo].filter(Boolean).join(' ') || null,
    cliente_id: customer?.id ?? null,
    cliente: customer?.nome ?? null,
    aberta_em: row.aberta_em,
    concluida_em: row.concluida_em,
    valor_total: row.valor_total,
    pago: row.pago
  }
}

const s = (description: string) => ({ type: 'string', description })
const e = (values: readonly string[], description: string) => ({ type: 'string', enum: values, description })
const object = (properties: Record<string, unknown>, required: string[] = []) => ({ type: 'object', properties, required })
const FROM = s('Data inicial YYYY-MM-DD')
const TO = s('Data final YYYY-MM-DD')

const TOOLS: Record<string, Tool> = {
  search_orders: {
    description: 'Lista ordens de serviço (OS) com filtros. Retorna até 10 e o total.',
    parameters: object({
      status: e(ORDER_STATUS, 'Situação da OS'),
      placa: s('Placa do veículo'),
      numero: s('Número da OS'),
      cliente: s('Nome do cliente'),
      from: s('Aberta a partir de YYYY-MM-DD'),
      to: s('Aberta até YYYY-MM-DD'),
      pago: { type: 'boolean', description: 'Pagamento recebido' },
      limit: { type: 'integer', description: 'Máximo 10' }
    }),
    async run(args, { db, see }) {
      const status = oneOf(args, 'status', ORDER_STATUS)
      const p = placa(args, 'placa')
      const numero = text(args, 'numero', 20)
      const cliente = text(args, 'cliente')
      const from = date(args, 'from')
      const to = date(args, 'to')
      const pago = bool(args, 'pago')
      const n = limit(args)

      let vehicleIds = p ? await vehicleIdsByPlaca(db, p) : undefined
      if (cliente) {
        const customerIds = rows<{ id: string }>(await db.from('clientes').select('id').ilike('nome', ilikePattern(cliente)).limit(50)).map(c => c.id)
        const ids = customerIds.length
          ? rows<{ id: string }>(await db.from('veiculos').select('id').in('cliente_id', customerIds)).map(v => v.id)
          : []
        vehicleIds = vehicleIds ? vehicleIds.filter(id => ids.includes(id)) : ids
      }
      if (vehicleIds && !vehicleIds.length) return { total: 0, ordens: [] }

      let query = db.from('ordens_servico').select(ORDER_SELECT, { count: 'exact' }).order('aberta_em', { ascending: false }).limit(n)
      if (status) query = query.eq('status', status)
      if (numero) query = query.eq('numero', numero)
      if (pago !== undefined) query = query.eq('pago', pago)
      if (from) query = query.gte('aberta_em', dayStart(from))
      if (to) query = query.lte('aberta_em', dayEnd(to))
      if (vehicleIds) query = query.in('veiculo_id', vehicleIds)
      const result = await query
      return { total: result.count ?? 0, ordens: rows(result).map(row => orderSummary(row, see)) }
    }
  },

  get_order: {
    description: 'Detalhe de uma OS: itens do orçamento, pagamento, reclamação e diagnóstico. Informe id, número ou placa (OS mais recente da placa).',
    parameters: object({ id: s('id da OS'), numero: s('Número da OS'), placa: s('Placa do veículo') }),
    async run(args, { db, see }) {
      const id = uuid(args, 'id')
      const numero = text(args, 'numero', 20)
      const p = placa(args, 'placa')
      if (!id && !numero && !p) throw new ArgError('id')

      let query = db.from('ordens_servico').select(ORDER_DETAIL_SELECT).order('aberta_em', { ascending: false }).limit(1)
      if (id) query = query.eq('id', id)
      else if (numero) query = query.eq('numero', numero)
      else {
        const vehicleIds = await vehicleIdsByPlaca(db, p!)
        if (!vehicleIds.length) return { encontrada: false }
        query = query.in('veiculo_id', vehicleIds)
      }
      const row = rows(await query)[0]
      if (!row) return { encontrada: false }

      const items = rows(await db.from('ordem_itens').select('tipo, descricao, quantidade, valor_unitario').eq('ordem_servico_id', row.id).order('ordem').limit(20))
      return {
        ...orderSummary(row, see),
        km_entrada: row.km_entrada,
        reclamacao: cut(row.reclamacao),
        diagnostico: cut(row.diagnostico),
        valor_cobrado: row.valor_cobrado,
        pago_em: row.pago_em,
        forma_pagamento: row.forma_pagamento,
        parcelas: row.parcelas,
        itens: items.map(item => ({ ...item, descricao: cut(item.descricao) }))
      }
    }
  },

  search_customers: {
    description: 'Busca clientes por nome, documento (CPF/CNPJ) ou telefone. Retorna contatos e quantidade de veículos.',
    parameters: object({ nome: s('Nome do cliente'), documento: s('CPF ou CNPJ'), telefone: s('Telefone') }),
    async run(args, { db, see }) {
      const nome = text(args, 'nome')
      const documento = digits(args, 'documento')
      const telefone = digits(args, 'telefone')
      if (!nome && !documento && !telefone) throw new ArgError('nome')

      let query = db.from('clientes').select('id, nome, ativo, telefones, emails, documento, veiculos(count)').order('nome').limit(50)
      if (nome) query = query.ilike('nome', ilikePattern(nome))
      if (documento) query = query.ilike('documento', digitsPattern(documento))
      if (telefone) query = query.ilike('contatos_busca', digitsPattern(telefone))
      // ponytail: digit filters run on the first 50 matches; a broader digit pattern can push the real match past them.
      const found = rows(await query).filter(row =>
        (!documento || onlyDigits(row.documento) === documento)
        && (!telefone || (row.telefones ?? []).some((phone: string) => onlyDigits(phone).endsWith(telefone)))
      )
      return {
        total: found.length,
        clientes: found.slice(0, MAX_ROWS).map((row) => {
          see('customer', row.id, row)
          return {
            id: row.id,
            nome: row.nome,
            ativo: row.ativo,
            telefones: (row.telefones ?? []).slice(0, 3),
            emails: (row.emails ?? []).slice(0, 3),
            documento: row.documento,
            veiculos: row.veiculos?.[0]?.count ?? 0
          }
        })
      }
    }
  },

  customer_summary: {
    description: 'Resumo de um cliente (id vindo de search_customers): veículos, número de OS, total gasto em OS concluídas e último atendimento.',
    parameters: object({ id: s('id do cliente') }, ['id']),
    async run(args, { db, see }) {
      const id = uuid(args, 'id')
      if (!id) throw new ArgError('id')
      const customer = rows(await db.from('clientes').select('id, nome, ativo').eq('id', id).limit(1))[0]
      if (!customer) return { encontrado: false }
      see('customer', customer.id, customer)

      const vehicles = rows(await db.from('veiculos').select('id, placa, marca, modelo, ano').eq('cliente_id', id).limit(MAX_ROWS))
      vehicles.forEach(vehicle => see('vehicle', vehicle.id, vehicle))
      // ponytail: totals over the latest 500 orders; move to an RPC if a customer ever passes that.
      const orders = vehicles.length
        ? rows(await db.from('ordens_servico').select('status, valor_total, aberta_em').in('veiculo_id', vehicles.map(v => v.id)).order('aberta_em', { ascending: false }).limit(500))
        : []
      return {
        id: customer.id,
        nome: customer.nome,
        ativo: customer.ativo,
        veiculos: vehicles,
        total_os: orders.length,
        total_gasto: concludedTotal(orders),
        ultimo_atendimento: orders[0]?.aberta_em ?? null
      }
    }
  },

  vehicle_history: {
    description: 'Histórico de um veículo pela placa: dono, últimas OS, total gasto e próximo agendamento.',
    parameters: object({ placa: s('Placa do veículo') }, ['placa']),
    async run(args, { db, see }) {
      const p = placa(args, 'placa')
      if (!p) throw new ArgError('placa')
      const vehicle = rows(await db.from('veiculos').select('id, placa, marca, modelo, ano, cor, km_atual, clientes(id, nome)').eq('placa', p).limit(1))[0]
      if (!vehicle) return { encontrado: false }
      see('vehicle', vehicle.id, vehicle)
      if (vehicle.clientes) see('customer', vehicle.clientes.id, vehicle.clientes)

      const [ordersResult, nextResult] = await Promise.all([
        db.from('ordens_servico').select('id, numero, status, aberta_em, concluida_em, valor_total, reclamacao').eq('veiculo_id', vehicle.id).order('aberta_em', { ascending: false }).limit(500),
        db.from('agendamentos').select('id, inicio, servico, status').eq('veiculo_id', vehicle.id).in('status', ['agendado', 'confirmado']).gte('inicio', new Date().toISOString()).order('inicio').limit(1)
      ])
      const orders = rows(ordersResult)
      const next = rows(nextResult)[0]
      if (next) see('appointment', next.id, next)
      return {
        placa: vehicle.placa,
        veiculo: [vehicle.marca, vehicle.modelo, vehicle.ano].filter(Boolean).join(' '),
        cor: vehicle.cor,
        km_atual: vehicle.km_atual,
        dono_id: vehicle.clientes?.id ?? null,
        dono: vehicle.clientes?.nome ?? null,
        total_os: orders.length,
        total_gasto: concludedTotal(orders),
        ultimas_os: orders.slice(0, 5).map((order) => {
          see('order', order.id, order)
          return { ...order, reclamacao: cut(order.reclamacao) }
        }),
        proximo_agendamento: next ? { ...next, servico: cut(next.servico) } : null
      }
    }
  },

  list_appointments: {
    description: 'Agendamentos num período (padrão: hoje). Filtros: placa, status.',
    parameters: object({ from: FROM, to: TO, placa: s('Placa do veículo'), status: e(APPOINTMENT_STATUS, 'Situação') }),
    async run(args, { db, today, see }) {
      const from = date(args, 'from') ?? today
      const to = date(args, 'to') ?? from
      const status = oneOf(args, 'status', APPOINTMENT_STATUS)
      const p = placa(args, 'placa')

      let query = db.from('agendamentos')
        .select('id, inicio, fim, servico, status, veiculos(id, placa, marca, modelo), clientes(id, nome)', { count: 'exact' })
        .gte('inicio', dayStart(from))
        .lte('inicio', dayEnd(to))
        .order('inicio')
        .limit(MAX_ROWS)
      if (status) query = query.eq('status', status)
      if (p) {
        const vehicleIds = await vehicleIdsByPlaca(db, p)
        if (!vehicleIds.length) return { total: 0, agendamentos: [] }
        query = query.in('veiculo_id', vehicleIds)
      }
      const result = await query
      return {
        total: result.count ?? 0,
        agendamentos: rows(result).map((row) => {
          see('appointment', row.id, row)
          if (row.veiculos) see('vehicle', row.veiculos.id, row.veiculos)
          if (row.clientes) see('customer', row.clientes.id, row.clientes)
          return {
            id: row.id,
            inicio: row.inicio,
            fim: row.fim,
            placa: row.veiculos?.placa ?? null,
            veiculo: [row.veiculos?.marca, row.veiculos?.modelo].filter(Boolean).join(' ') || null,
            cliente: row.clientes?.nome ?? null,
            servico: cut(row.servico),
            status: row.status
          }
        })
      }
    }
  },

  finance_summary: {
    description: 'Resumo financeiro do mês (faturamento, recebido, despesas, saldo). Padrão: mês atual.',
    parameters: object({ mes: s('Mês YYYY-MM') }),
    permission: { anyOf: ['finance.view'], area: 'financeiro' },
    async run(args, { db, today }) {
      const mes = month(args, 'mes') ?? today.slice(0, 7)
      const { data, error } = await db.rpc('finance_summary', { p_mes: `${mes}-01` })
      if (error) throw error
      return { mes, resumo: data }
    }
  },

  list_accounts: {
    description: 'Contas a pagar. status: a_pagar (todas em aberto, inclusive vencidas), vencidas (em aberto com vencimento passado), pagas. Período pelo vencimento. Retorna até 10, o total e a soma.',
    parameters: object({ status: e(ACCOUNT_STATUS, 'Situação'), from: s('Vencimento a partir de YYYY-MM-DD'), to: s('Vencimento até YYYY-MM-DD') }),
    permission: { anyOf: ['finance.view'], area: 'financeiro' },
    async run(args, { db, today, see }) {
      const status = oneOf(args, 'status', ACCOUNT_STATUS)
      const from = date(args, 'from')
      const to = date(args, 'to')

      // ponytail: sum over the first 200 accounts of the filter; enough for a workshop month, move to an RPC if it grows.
      let query = db.from('financeiro_contas')
        .select('id, descricao, valor, vencimento, status, pago_em, financeiro_categorias(nome)', { count: 'exact' })
        .order('vencimento')
        .limit(200)
      if (status === 'pagas') query = query.eq('status', 'pago')
      else if (status) query = query.eq('status', 'a_pagar')
      else query = query.neq('status', 'cancelado')
      if (status === 'vencidas') query = query.lt('vencimento', today)
      if (from) query = query.gte('vencimento', from)
      if (to) query = query.lte('vencimento', to)
      const result = await query
      const accounts = rows(result)
      return {
        total: result.count ?? accounts.length,
        soma: accounts.reduce((sum, row) => sum + Number(row.valor ?? 0), 0),
        contas: accounts.slice(0, MAX_ROWS).map((row) => {
          see('account', row.id, row)
          return {
            id: row.id,
            descricao: cut(row.descricao),
            valor: row.valor,
            vencimento: row.vencimento,
            status: row.status,
            pago_em: row.pago_em,
            categoria: row.financeiro_categorias?.nome ?? null
          }
        })
      }
    }
  },

  search_catalog: {
    description: 'Busca serviços, peças e kits do catálogo: preço padrão, estoque e se está ativo.',
    parameters: object({ nome: s('Nome do item'), tipo: e(CATALOG_TIPO, 'Tipo') }),
    permission: { anyOf: ['budget.edit', 'catalog.manage'], area: 'catálogo' },
    async run(args, { db }) {
      const nome = text(args, 'nome')
      const tipo = oneOf(args, 'tipo', CATALOG_TIPO)
      let query = db.from('servicos_catalogo').select('id, nome, tipo, valor_padrao, estoque, ativo', { count: 'exact' }).order('nome').limit(MAX_ROWS)
      if (nome) query = query.ilike('nome', ilikePattern(nome))
      if (tipo) query = query.eq('tipo', tipo)
      const result = await query
      return { total: result.count ?? 0, itens: rows(result).map(row => ({ ...row, nome: cut(row.nome) })) }
    }
  },

  team_stats: {
    description: 'Por colaborador: OS abertas por ele no período e quantas delas já foram concluídas. Padrão: mês atual até hoje.',
    parameters: object({ from: FROM, to: TO }),
    permission: { anyOf: ['collaborators.manage'], area: 'equipe' },
    async run(args, { db, today }) {
      const from = date(args, 'from') ?? `${today.slice(0, 7)}-01`
      const to = date(args, 'to') ?? today
      // ponytail: counts over the first 2000 orders of the period, in memory; move to an RPC if the shop outgrows it.
      const [collaborators, orders] = await Promise.all([
        db.rpc('list_collaborators'),
        db.from('ordens_servico').select('aberto_por, status').gte('aberta_em', dayStart(from)).lte('aberta_em', dayEnd(to)).limit(2000)
      ])
      const opened = rows(orders)
      return {
        from,
        to,
        colaboradores: rows(collaborators).slice(0, 20).map((person) => {
          const mine = opened.filter(order => order.aberto_por === person.id)
          return { nome: person.nome, papel: person.papel, os_abertas: mine.length, os_concluidas: mine.filter(order => order.status === 'concluida').length }
        })
      }
    }
  }
}

export const VOICE_TOOL_SCHEMAS: ToolSchema[] = Object.entries(TOOLS).map(([name, tool]) => ({
  type: 'function',
  function: { name, description: tool.description, parameters: tool.parameters }
}))

/** Never throws: errors become `{ erro }` results the AI can explain. */
export async function runVoiceTool(name: string, args: unknown, ctx: ToolContext): Promise<unknown> {
  const tool = Object.hasOwn(TOOLS, name) ? TOOLS[name] : undefined
  if (!tool) return { erro: 'ferramenta_desconhecida' }
  if (tool.permission && !tool.permission.anyOf.some(action => can(ctx.papel, action))) {
    return { erro: 'sem_permissao', area: tool.permission.area }
  }
  try {
    const safeArgs = args && typeof args === 'object' && !Array.isArray(args) ? args as Args : {}
    return await tool.run(safeArgs, ctx)
  } catch (error) {
    return error instanceof ArgError ? { erro: 'argumento_invalido', campo: error.campo } : { erro: 'falha_consulta' }
  }
}
