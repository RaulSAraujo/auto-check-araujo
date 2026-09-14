import type { PricingParamsDraft, PricingParamsRow } from '../utils/pricing'
import { emptyPricingDraft, pricingDraftFromRow } from '../utils/pricing'

export const PRICING_PARAMS_KEY = 'oficina-parametros'

export function usePricingParams() {
  const supabase = useTypedSupabaseClient()

  const { data, pending, refresh, error } = useAsyncData(
    PRICING_PARAMS_KEY,
    async () => {
      const { data: row, error: fetchError } = await supabase
        .from('oficina_parametros')
        .select('*')
        .eq('id', 1)
        .maybeSingle()

      if (fetchError) throw fetchError
      return (row as PricingParamsRow | null) ?? null
    },
    { lazy: false }
  )

  const params = computed(() => data.value)
  const draftDefaults = computed(() =>
    data.value ? pricingDraftFromRow(data.value) : emptyPricingDraft()
  )

  return {
    params,
    draftDefaults,
    pending,
    refresh,
    error
  }
}

export function usePricingMutations() {
  const supabase = useTypedSupabaseClient()
  const toast = useToast()

  async function savePricingParams(draft: PricingParamsDraft) {
    const { error } = await supabase
      .from('oficina_parametros')
      .update({
        valor_hora: draft.valor_hora,
        custo_fixo_mensal: draft.custo_fixo_mensal,
        margem_alvo: draft.margem_alvo,
        horas_produtivas_mes: draft.horas_produtivas_mes,
        markup_pecas: draft.markup_pecas,
        precificacao_automatica: draft.precificacao_automatica,
        taxa_cartao_debito: draft.taxa_cartao_debito,
        taxa_cartao_credito: draft.taxa_cartao_credito,
        valor_minimo_servico: draft.valor_minimo_servico,
        fator_servico_rapido: draft.fator_servico_rapido,
        fator_servico_padrao: draft.fator_servico_padrao,
        fator_servico_tecnico: draft.fator_servico_tecnico,
        fator_servico_especializado: draft.fator_servico_especializado
      })
      .eq('id', 1)

    if (error) {
      toast.add({
        title: 'Erro ao salvar parâmetros',
        description: error.message,
        color: 'error'
      })
      return { error }
    }

    await refreshNuxtData(PRICING_PARAMS_KEY)
    toast.add({
      title: 'Parâmetros salvos',
      color: 'success'
    })
    return { error: null }
  }

  return { savePricingParams }
}
