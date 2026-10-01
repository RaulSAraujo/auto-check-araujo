import assert from 'node:assert/strict'
import test from 'node:test'
import { runVoiceTool, VOICE_TOOL_SCHEMAS, type ToolContext } from './tools.ts'

type Result = { data?: unknown, count?: number, error?: unknown }

function fakeDb(results: Record<string, Result> = {}) {
  const calls: string[] = []
  const builder = (name: string) => {
    const result = { data: [], count: 0, error: null, ...results[name] }
    const proxy: unknown = new Proxy({}, {
      get(_target, prop) {
        if (prop === 'then') return (resolve: (value: unknown) => void) => resolve(result)
        return (...args: unknown[]) => {
          calls.push(`${name}.${String(prop)}(${args.map(arg => JSON.stringify(arg)).join(',')})`)
          return proxy
        }
      }
    })
    return proxy
  }
  const db = {
    from: (table: string) => builder(table),
    rpc: (fn: string, params?: unknown) => {
      calls.push(`rpc.${fn}(${JSON.stringify(params ?? null)})`)
      return builder(fn)
    }
  }
  return { db: db as never, calls }
}

function ctx(papel: ToolContext['papel'], results?: Record<string, Result>) {
  const { db, calls } = fakeDb(results)
  const seen: string[] = []
  const context: ToolContext = { db, papel, today: '2026-09-30', see: (type, id) => seen.push(`${type}:${id}`) }
  return { context, calls, seen }
}

test('every tool has a schema', () => {
  assert.deepEqual(VOICE_TOOL_SCHEMAS.map(tool => tool.function.name), [
    'search_orders', 'get_order', 'search_customers', 'customer_summary', 'vehicle_history',
    'list_appointments', 'finance_summary', 'list_accounts', 'search_catalog', 'team_stats'
  ])
})

test('permission gating never queries', async () => {
  const mec = ctx('mecanico')
  assert.deepEqual(await runVoiceTool('finance_summary', {}, mec.context), { erro: 'sem_permissao', area: 'financeiro' })
  assert.deepEqual(await runVoiceTool('list_accounts', {}, mec.context), { erro: 'sem_permissao', area: 'financeiro' })
  assert.deepEqual(await runVoiceTool('search_catalog', {}, mec.context), { erro: 'sem_permissao', area: 'catálogo' })
  const rec = ctx('recepcao')
  assert.deepEqual(await runVoiceTool('team_stats', {}, rec.context), { erro: 'sem_permissao', area: 'equipe' })
  assert.deepEqual([...mec.calls, ...rec.calls], [])
  assert.deepEqual(await runVoiceTool('search_catalog', { nome: 'pastilha' }, rec.context), { total: 0, itens: [] })
})

test('invalid arguments never query', async () => {
  const { context, calls } = ctx('gerente')
  assert.deepEqual(await runVoiceTool('search_orders', { status: 'perdida' }, context), { erro: 'argumento_invalido', campo: 'status' })
  assert.deepEqual(await runVoiceTool('search_orders', { from: '2026-13-01' }, context), { erro: 'argumento_invalido', campo: 'from' })
  assert.deepEqual(await runVoiceTool('search_orders', { limit: 0 }, context), { erro: 'argumento_invalido', campo: 'limit' })
  assert.deepEqual(await runVoiceTool('get_order', {}, context), { erro: 'argumento_invalido', campo: 'id' })
  assert.deepEqual(await runVoiceTool('vehicle_history', { placa: 'XX' }, context), { erro: 'argumento_invalido', campo: 'placa' })
  assert.deepEqual(await runVoiceTool('customer_summary', { id: 'drop table' }, context), { erro: 'argumento_invalido', campo: 'id' })
  assert.deepEqual(await runVoiceTool('finance_summary', { mes: '2026-9' }, context), { erro: 'argumento_invalido', campo: 'mes' })
  assert.deepEqual(await runVoiceTool('nope', {}, context), { erro: 'ferramenta_desconhecida' })
  assert.deepEqual(calls, [])
})

test('search_orders filters, caps the limit and flattens rows', async () => {
  const row = {
    id: 'o1', numero: '1234', status: 'aberta', orcamento_status: 'rascunho', aberta_em: '2026-09-10T12:00:00+00:00',
    concluida_em: null, valor_total: 300, pago: false,
    veiculos: { id: 'v1', placa: 'ABC1D23', marca: 'Fiat', modelo: 'Uno', clientes: { id: 'c1', nome: 'João' } }
  }
  const { context, calls, seen } = ctx('mecanico', { ordens_servico: { data: [row], count: 1 } })
  const result = await runVoiceTool('search_orders', { status: 'aberta', from: '2026-09-01', to: '2026-09-30', limit: 50, pago: null }, context)
  assert.deepEqual(result, {
    total: 1,
    ordens: [{
      id: 'o1', numero: '1234', status: 'aberta', orcamento_status: 'rascunho', placa: 'ABC1D23', veiculo: 'Fiat Uno',
      cliente_id: 'c1', cliente: 'João', aberta_em: '2026-09-10T12:00:00+00:00', concluida_em: null, valor_total: 300, pago: false
    }]
  })
  assert.ok(calls.includes('ordens_servico.eq("status","aberta")'))
  assert.ok(calls.includes('ordens_servico.gte("aberta_em","2026-09-01T00:00:00-03:00")'))
  assert.ok(calls.includes('ordens_servico.lte("aberta_em","2026-09-30T23:59:59.999-03:00")'))
  assert.ok(calls.includes('ordens_servico.limit(10)'))
  assert.ok(!calls.some(call => call.includes('"pago"')))
  assert.deepEqual(seen, ['order:o1', 'customer:c1', 'vehicle:v1'])
})

test('search_orders with an unknown plate answers empty without listing orders', async () => {
  const { context, calls } = ctx('mecanico')
  assert.deepEqual(await runVoiceTool('search_orders', { placa: 'abc-1d23' }, context), { total: 0, ordens: [] })
  assert.ok(calls.includes('veiculos.eq("placa","ABC1D23")'))
  assert.ok(!calls.some(call => call.startsWith('ordens_servico')))
})

test('database errors become falha_consulta', async () => {
  const { context } = ctx('mecanico', { ordens_servico: { error: { message: 'boom' } } })
  assert.deepEqual(await runVoiceTool('search_orders', {}, context), { erro: 'falha_consulta' })
})

test('list_accounts maps the spoken status to the account filters', async () => {
  const { context, calls } = ctx('gerente', { financeiro_contas: { data: [{ id: 'f1', descricao: 'Energia', valor: 200, vencimento: '2026-09-20', status: 'a_pagar', pago_em: null, financeiro_categorias: { nome: 'Contas' } }], count: 1 } })
  const result = await runVoiceTool('list_accounts', { status: 'vencidas' }, context) as { soma: number, contas: unknown[] }
  assert.ok(calls.includes('financeiro_contas.eq("status","a_pagar")'))
  assert.ok(calls.includes('financeiro_contas.lt("vencimento","2026-09-30")'))
  assert.equal(result.soma, 200)
  assert.deepEqual(result.contas[0], { id: 'f1', descricao: 'Energia', valor: 200, vencimento: '2026-09-20', status: 'a_pagar', pago_em: null, categoria: 'Contas' })
})

test('search_customers by phone matches the digits whatever the stored format', async () => {
  const rows = [
    { id: 'c1', nome: 'João', ativo: true, telefones: ['(11) 98888-7777'], emails: [], documento: null, veiculos: [{ count: 2 }] },
    { id: 'c2', nome: 'Ana', ativo: true, telefones: ['(11) 91988-8877'], emails: [], documento: null, veiculos: [{ count: 0 }] }
  ]
  const { context, calls } = ctx('mecanico', { clientes: { data: rows } })
  const result = await runVoiceTool('search_customers', { telefone: '(11) 98888-7777' }, context) as { total: number, clientes: { id: string, veiculos: number }[] }
  assert.ok(calls.includes('clientes.ilike("contatos_busca","%1%1%9%8%8%8%8%7%7%7%7%")'))
  assert.equal(result.total, 1)
  assert.equal(result.clientes[0]?.id, 'c1')
  assert.equal(result.clientes[0]?.veiculos, 2)
})

test('finance_summary defaults to the current month', async () => {
  const { context, calls } = ctx('gerente', { finance_summary: { data: { entradas: 1000 } } })
  assert.deepEqual(await runVoiceTool('finance_summary', {}, context), { mes: '2026-09', resumo: { entradas: 1000 } })
  assert.deepEqual(calls, ['rpc.finance_summary({"p_mes":"2026-09-01"})'])
})
