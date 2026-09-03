export function useHomeChartMotion() {
  const reduceMotion = ref(false)

  let media: MediaQueryList | undefined
  let onChange: ((event: MediaQueryListEvent) => void) | undefined

  onMounted(() => {
    media = window.matchMedia('(prefers-reduced-motion: reduce)')
    reduceMotion.value = media.matches

    onChange = (event: MediaQueryListEvent) => {
      reduceMotion.value = event.matches
    }

    media.addEventListener('change', onChange)
  })

  onUnmounted(() => {
    if (media && onChange) {
      media.removeEventListener('change', onChange)
    }
  })

  const duration = computed(() => (reduceMotion.value ? 0 : 420))

  return {
    reduceMotion,
    duration
  }
}
