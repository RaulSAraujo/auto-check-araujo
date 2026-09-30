import type { Ref } from 'vue'
import { readQueryValue, withQueryValue, type QueryCheck } from '../utils/route-query'

/** A list control mirrored in the URL query, so links, back/forward and voice commands set it too. */
export function useRouteQueryState<T extends string = string>(key: string, fallback: NoInfer<T>, check?: QueryCheck): Ref<T> {
  const route = useRoute()
  const router = useRouter()
  const read = () => readQueryValue<T>(route.query[key], fallback, check)
  const state = ref(read()) as Ref<T>
  let writeTimer: ReturnType<typeof setTimeout> | undefined

  watch(() => route.query[key], () => {
    const next = read()
    if (next === state.value) return
    clearTimeout(writeTimer)
    state.value = next
  })

  // Debounced like the search box so a replace doesn't run per keystroke.
  // ponytail: each instance writes on its own timer from route.query and adopts any route change, safe only while
  // navigation settles within microtasks (sync middleware, no async guards); an async guard would let two close writes
  // drop a key or an in-flight echo undo a keystroke. Upgrade: serialize writes from router.currentRoute, ignore echo while pending.
  watch(state, (value) => {
    clearTimeout(writeTimer)
    writeTimer = setTimeout(() => {
      if (value !== read()) router.replace({ query: withQueryValue(route.query, key, value, fallback) })
    }, SEARCH_DEBOUNCE_MS)
  })

  onBeforeRouteLeave(() => clearTimeout(writeTimer))
  onScopeDispose(() => clearTimeout(writeTimer))
  return state
}
