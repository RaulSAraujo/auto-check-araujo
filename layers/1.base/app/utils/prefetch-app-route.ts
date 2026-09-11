/** Warm route chunk on intent (hover/focus). Fire-and-forget — no await. */
export function prefetchAppRoute(path: string) {
  if (!import.meta.client || !path.startsWith('/')) return
  void preloadRouteComponents(path)
}

/** Event delegation for nav menus: prefetch first matching same-origin link. */
export function prefetchAppRouteFromEvent(event: Event) {
  const target = event.target
  if (!(target instanceof Element)) return
  const anchor = target.closest('a[href]')
  if (!(anchor instanceof HTMLAnchorElement)) return
  const href = anchor.getAttribute('href')
  if (href) prefetchAppRoute(href)
}
