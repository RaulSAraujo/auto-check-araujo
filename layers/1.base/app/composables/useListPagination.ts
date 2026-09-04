export function useListPagination(
  resetTriggers: Array<Ref<unknown>> = [],
  pageSize: number = LIST_PAGE_SIZE
) {
  const page = ref(1)

  for (const trigger of resetTriggers) {
    watch(trigger, () => {
      page.value = 1
    })
  }

  function rangeBounds() {
    const from = (page.value - 1) * pageSize
    return { from, to: from + pageSize - 1 }
  }

  return {
    page,
    pageSize,
    rangeBounds
  }
}
