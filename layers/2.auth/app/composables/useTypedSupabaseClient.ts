import type { Database } from '~~/shared/types/database'

export function useTypedSupabaseClient() {
  return useSupabaseClient<Database>()
}
