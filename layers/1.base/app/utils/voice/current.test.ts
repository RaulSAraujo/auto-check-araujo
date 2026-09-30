import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'
import { trackVoiceCurrent, type VoiceCurrentMap } from './current.ts'

// vue is only a transitive dependency (through nuxt), so it is resolved from nuxt's location.
const { effectScope, nextTick, ref, watch } = createRequire(import.meta.resolve('nuxt'))('vue') as typeof import('vue')

async function flush() {
  for (let i = 0; i < 5; i++) await nextTick()
}

test('two live screens publishing current records do not re-trigger each other', async () => {
  const current = ref<VoiceCurrentMap>({})
  let runs = 0
  const customerId = ref('c1')
  const vehicleId = ref('v1')
  const customerScope = effectScope()
  const vehicleScope = effectScope()
  const releaseCustomer = customerScope.run(() => trackVoiceCurrent(watch, current, 'customer', () => {
    runs++
    return customerId.value
  }, () => 'Maria'))!
  vehicleScope.run(() => trackVoiceCurrent(watch, current, 'vehicle', () => {
    runs++
    return vehicleId.value
  }))
  await flush()
  customerId.value = 'c2'
  await flush()

  assert.ok(runs <= 4, `tracking ran ${runs} times`)
  assert.deepEqual(current.value, { customer: { id: 'c2', label: 'Maria' }, vehicle: { id: 'v1', label: undefined } })

  customerScope.stop()
  releaseCustomer()
  vehicleScope.stop()
  assert.equal(current.value.customer, undefined)
  assert.deepEqual(current.value.vehicle, { id: 'v1', label: undefined })
})

test('the previous screen of the same entity does not clear the next one', () => {
  const current = ref<VoiceCurrentMap>({})
  const releaseA = trackVoiceCurrent(watch, current, 'customer', () => 'a')
  trackVoiceCurrent(watch, current, 'customer', () => 'b')
  releaseA()
  assert.deepEqual(current.value.customer, { id: 'b', label: undefined })
})
