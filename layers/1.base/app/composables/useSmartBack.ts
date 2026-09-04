/**
 * Navigate back in app history when possible; otherwise go to fallback.
 * Uses Vue Router history state (`history.state.back`) so a cold open
 * never leaves the site via `router.back()`.
 */
export function useSmartBack(fallback: MaybeRefOrGetter<string>) {
  const router = useRouter()

  function back() {
    if (import.meta.client && window.history.state?.back != null) {
      router.back()
      return
    }

    void navigateTo(toValue(fallback))
  }

  return { back }
}
