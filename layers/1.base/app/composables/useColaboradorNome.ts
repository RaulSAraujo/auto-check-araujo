export function useColaboradorNome() {
  const { profile } = useProfile()

  const nome = computed(() => profile.value?.nome || profile.value?.username || 'Colaborador')

  return { nome }
}
