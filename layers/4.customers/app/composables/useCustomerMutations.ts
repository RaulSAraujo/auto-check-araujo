import type { CustomerFormState } from '../utils/customer-form'
import type { Cliente } from '~~/shared/types/database'
import {
  customerFormToInsert,
  customerFormToUpdate,
  isCustomerFormValid
} from '../utils/customer-form'

export function useCustomerMutations() {
  const supabase = useTypedSupabaseClient()
  const toast = useToast()

  function validateForm(state: CustomerFormState): boolean {
    if (!isCustomerFormValid(state)) {
      toast.add({ title: 'Informe o nome do Cliente', color: 'warning' })
      return false
    }
    return true
  }

  async function createCustomer(state: CustomerFormState) {
    if (!validateForm(state)) return { data: null, error: null }

    const { data, error } = await supabase
      .from('clientes')
      .insert(customerFormToInsert(state))
      .select('id')
      .single()

    if (error) {
      toast.add({ title: 'Erro ao salvar', description: error.message, color: 'error' })
      return { data: null, error }
    }

    toast.add({ title: 'Cliente cadastrado', color: 'success' })
    return { data, error: null }
  }

  async function updateCustomer(id: string, state: CustomerFormState) {
    if (!validateForm(state)) return { error: null }

    const { error } = await supabase
      .from('clientes')
      .update(customerFormToUpdate(state))
      .eq('id', id)

    if (error) {
      toast.add({ title: 'Erro ao salvar', description: error.message, color: 'error' })
      return { error }
    }

    toast.add({ title: 'Cliente atualizado', color: 'success' })
    return { error: null }
  }

  async function setCustomerAtivo(id: string, ativo: boolean) {
    const { error } = await supabase
      .from('clientes')
      .update({ ativo } satisfies Partial<Cliente>)
      .eq('id', id)

    if (error) {
      toast.add({
        title: ativo ? 'Erro ao reativar cliente' : 'Erro ao desativar cliente',
        description: error.message,
        color: 'error'
      })
      return { error }
    }

    toast.add({
      title: ativo ? 'Cliente reativado' : 'Cliente desativado',
      color: 'success'
    })
    return { error: null }
  }

  async function deleteCustomer(id: string, vehicleCount: number) {
    if (vehicleCount > 0) {
      toast.add({
        title: 'Não é possível excluir',
        description: 'Remova os Veículos deste Cliente antes de excluí-lo.',
        color: 'warning'
      })
      return { error: null, blocked: true }
    }

    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id)

    if (error) {
      toast.add({ title: 'Erro ao excluir', description: error.message, color: 'error' })
      return { error, blocked: false }
    }

    toast.add({ title: 'Cliente excluído', color: 'success' })
    return { error: null, blocked: false }
  }

  return {
    createCustomer,
    updateCustomer,
    setCustomerAtivo,
    deleteCustomer
  }
}
