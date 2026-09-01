import type { Cliente } from '~~/shared/types/database'
import {
  customerFormFromRow,
  emptyCustomerForm,
  type CustomerFormState
} from '../utils/customer-form'

export function useCustomerForm(cliente?: Ref<Cliente | null | undefined>) {
  const state = reactive<CustomerFormState>(emptyCustomerForm())

  if (cliente) {
    watch(cliente, (value) => {
      if (!value) return
      Object.assign(state, customerFormFromRow(value))
    }, { immediate: true })
  }

  function reset() {
    Object.assign(state, emptyCustomerForm())
  }

  return {
    state,
    reset
  }
}
