import { LIST_PAGE_SIZE } from '~/utils/supabase-search'

export function useListPagination(resetTriggers: Array<Ref<unknown>> = []) {
  const page = ref(1)
  const pageSize = LIST_PAGE_SIZE

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
