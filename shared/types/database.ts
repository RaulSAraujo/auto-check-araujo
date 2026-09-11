export type Json
  = | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      agendamentos: {
        Row: {
          cliente_id: string
          created_at: string
          criado_por: string | null
          fim: string
          id: string
          inicio: string
          observacoes: string | null
          ordem_servico_id: string | null
          patio_vaga: number | null
          servico: string | null
          status: string
          updated_at: string
          veiculo_id: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          criado_por?: string | null
          fim: string
          id?: string
          inicio: string
          observacoes?: string | null
          ordem_servico_id?: string | null
          patio_vaga?: number | null
          servico?: string | null
          status?: string
          updated_at?: string
          veiculo_id: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          criado_por?: string | null
          fim?: string
          id?: string
          inicio?: string
          observacoes?: string | null
          ordem_servico_id?: string | null
          patio_vaga?: number | null
          servico?: string | null
          status?: string
          updated_at?: string
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'agendamentos_cliente_id_fkey'
            columns: ['cliente_id']
            isOneToOne: false
            referencedRelation: 'clientes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'agendamentos_criado_por_fkey'
            columns: ['criado_por']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'agendamentos_ordem_servico_id_fkey'
            columns: ['ordem_servico_id']
            isOneToOne: false
            referencedRelation: 'ordens_servico'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'agendamentos_veiculo_id_fkey'
            columns: ['veiculo_id']
            isOneToOne: false
            referencedRelation: 'veiculos'
            referencedColumns: ['id']
          }
        ]
      }





      clientes: {
        Row: {
          ativo: boolean
          contatos_busca: string
          created_at: string
          documento: string | null
          emails: string[]
          id: string
          nome: string
          observacoes: string | null
          telefones: string[]
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          contatos_busca?: string
          created_at?: string
          documento?: string | null
          emails?: string[]
          id?: string
          nome: string
          observacoes?: string | null
          telefones?: string[]
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          contatos_busca?: string
          created_at?: string
          documento?: string | null
          emails?: string[]
          id?: string
          nome?: string
          observacoes?: string | null
          telefones?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      colaborador_faltas: {
        Row: {
          colaborador_id: string
          created_at: string
          data: string
          id: string
          observacao: string | null
          registrado_por: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          colaborador_id: string
          created_at?: string
          data: string
          id?: string
          observacao?: string | null
          registrado_por?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          colaborador_id?: string
          created_at?: string
          data?: string
          id?: string
          observacao?: string | null
          registrado_por?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'colaborador_faltas_colaborador_id_fkey'
            columns: ['colaborador_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'colaborador_faltas_registrado_por_fkey'
            columns: ['registrado_por']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      colaborador_ocorrencias: {
        Row: {
          colaborador_id: string
          created_at: string
          descricao: string
          id: string
          ocorrido_em: string
          registrado_por: string | null
          tipo: string
        }
        Insert: {
          colaborador_id: string
          created_at?: string
          descricao: string
          id?: string
          ocorrido_em?: string
          registrado_por?: string | null
          tipo: string
        }
        Update: {
          colaborador_id?: string
          created_at?: string
          descricao?: string
          id?: string
          ocorrido_em?: string
          registrado_por?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: 'colaborador_ocorrencias_colaborador_id_fkey'
            columns: ['colaborador_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'colaborador_ocorrencias_registrado_por_fkey'
            columns: ['registrado_por']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      colaborador_presencas: {
        Row: {
          colaborador_id: string
          created_at: string
          data: string
          id: string
          observacao: string | null
          registrado_por: string | null
          status: string
          updated_at: string
        }
        Insert: {
          colaborador_id: string
          created_at?: string
          data: string
          id?: string
          observacao?: string | null
          registrado_por?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          colaborador_id?: string
          created_at?: string
          data?: string
          id?: string
          observacao?: string | null
          registrado_por?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'colaborador_presencas_colaborador_id_fkey'
            columns: ['colaborador_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'colaborador_presencas_registrado_por_fkey'
            columns: ['registrado_por']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      catalogo_kit_itens: {
        Row: {
          created_at: string
          id: string
          item_id: string
          kit_id: string
          quantidade: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          kit_id: string
          quantidade?: number
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          kit_id?: string
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: 'catalogo_kit_itens_item_id_fkey'
            columns: ['item_id']
            isOneToOne: false
            referencedRelation: 'servicos_catalogo'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'catalogo_kit_itens_kit_id_fkey'
            columns: ['kit_id']
            isOneToOne: false
            referencedRelation: 'servicos_catalogo'
            referencedColumns: ['id']
          }
        ]
      }
      fornecedores: {
        Row: {
          ativo: boolean
          created_at: string
          email: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      financeiro_categorias: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      financeiro_contas: {
        Row: {
          categoria_id: string
          created_at: string
          descricao: string
          forma_pagamento: string | null
          fornecedor_id: string | null
          id: string
          observacoes: string | null
          pago_em: string | null
          status: string
          updated_at: string
          valor: number
          vencimento: string
        }
        Insert: {
          categoria_id: string
          created_at?: string
          descricao: string
          forma_pagamento?: string | null
          fornecedor_id?: string | null
          id?: string
          observacoes?: string | null
          pago_em?: string | null
          status?: string
          updated_at?: string
          valor: number
          vencimento: string
        }
        Update: {
          categoria_id?: string
          created_at?: string
          descricao?: string
          forma_pagamento?: string | null
          fornecedor_id?: string | null
          id?: string
          observacoes?: string | null
          pago_em?: string | null
          status?: string
          updated_at?: string
          valor?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: 'financeiro_contas_categoria_id_fkey'
            columns: ['categoria_id']
            isOneToOne: false
            referencedRelation: 'financeiro_categorias'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'financeiro_contas_fornecedor_id_fkey'
            columns: ['fornecedor_id']
            isOneToOne: false
            referencedRelation: 'fornecedores'
            referencedColumns: ['id']
          }
        ]
      }
      oficina_parametros: {
        Row: {
          custo_fixo_mensal: number
          horas_produtivas_mes: number
          id: number
          margem_alvo: number
          markup_pecas: number
          precificacao_automatica: boolean
          taxa_cartao_credito: number
          taxa_cartao_debito: number
          updated_at: string
          valor_hora: number
        }
        Insert: {
          custo_fixo_mensal?: number
          horas_produtivas_mes?: number
          id?: number
          margem_alvo?: number
          markup_pecas?: number
          precificacao_automatica?: boolean
          taxa_cartao_credito?: number
          taxa_cartao_debito?: number
          updated_at?: string
          valor_hora?: number
        }
        Update: {
          custo_fixo_mensal?: number
          horas_produtivas_mes?: number
          id?: number
          margem_alvo?: number
          markup_pecas?: number
          precificacao_automatica?: boolean
          taxa_cartao_credito?: number
          taxa_cartao_debito?: number
          updated_at?: string
          valor_hora?: number
        }
        Relationships: []
      }
      ordem_fotos: {
        Row: {
          created_at: string
          id: string
          legenda: string | null
          nome_arquivo: string | null
          ordem_servico_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          legenda?: string | null
          nome_arquivo?: string | null
          ordem_servico_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          legenda?: string | null
          nome_arquivo?: string | null
          ordem_servico_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ordem_fotos_ordem_servico_id_fkey'
            columns: ['ordem_servico_id']
            isOneToOne: false
            referencedRelation: 'ordens_servico'
            referencedColumns: ['id']
          }
        ]
      }
      ordem_itens: {
        Row: {
          created_at: string
          descricao: string
          id: string
          ordem: number
          ordem_servico_id: string
          quantidade: number
          tipo: string
          valor_unitario: number
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          ordem?: number
          ordem_servico_id: string
          quantidade?: number
          tipo: string
          valor_unitario?: number
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          ordem?: number
          ordem_servico_id?: string
          quantidade?: number
          tipo?: string
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: 'ordem_itens_ordem_servico_id_fkey'
            columns: ['ordem_servico_id']
            isOneToOne: false
            referencedRelation: 'ordens_servico'
            referencedColumns: ['id']
          }
        ]
      }
      ordens_servico: {
        Row: {
          aberta_em: string
          aberto_por: string
          concluida_em: string | null
          created_at: string
          diagnostico: string | null
          forma_pagamento: string | null
          id: string
          km_entrada: number | null
          numero: string
          observacoes: string | null
          orcamento_public_token: string | null
          orcamento_status: string
          pago: boolean
          pago_em: string | null
          reclamacao: string | null
          status: string
          updated_at: string
          valor_total: number | null
          veiculo_id: string
        }
        Insert: {
          aberta_em?: string
          aberto_por: string
          concluida_em?: string | null
          created_at?: string
          diagnostico?: string | null
          forma_pagamento?: string | null
          id?: string
          km_entrada?: number | null
          numero?: string
          observacoes?: string | null
          orcamento_public_token?: string | null
          orcamento_status?: string
          pago?: boolean
          pago_em?: string | null
          reclamacao?: string | null
          status?: string
          updated_at?: string
          valor_total?: number | null
          veiculo_id: string
        }
        Update: {
          aberta_em?: string
          aberto_por?: string
          concluida_em?: string | null
          created_at?: string
          diagnostico?: string | null
          forma_pagamento?: string | null
          id?: string
          km_entrada?: number | null
          numero?: string
          observacoes?: string | null
          orcamento_public_token?: string | null
          orcamento_status?: string
          pago?: boolean
          pago_em?: string | null
          reclamacao?: string | null
          status?: string
          updated_at?: string
          valor_total?: number | null
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ordens_servico_aberto_por_fkey'
            columns: ['aberto_por']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ordens_servico_veiculo_id_fkey'
            columns: ['veiculo_id']
            isOneToOne: false
            referencedRelation: 'veiculos'
            referencedColumns: ['id']
          }
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          nome: string
          papel: string
          username: string
        }
        Insert: {
          created_at?: string
          id: string
          nome: string
          papel?: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          papel?: string
          username?: string
        }
        Relationships: []
      }
      servicos_catalogo: {
        Row: {
          ativo: boolean
          created_at: string
          custo: number
          estoque: number | null
          fornecedor_id: string | null
          id: string
          nome: string
          tipo: string
          valor_padrao: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          custo?: number
          estoque?: number | null
          fornecedor_id?: string | null
          id?: string
          nome: string
          tipo: string
          valor_padrao?: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          custo?: number
          estoque?: number | null
          fornecedor_id?: string | null
          id?: string
          nome?: string
          tipo?: string
          valor_padrao?: number
        }
        Relationships: [
          {
            foreignKeyName: 'servicos_catalogo_fornecedor_id_fkey'
            columns: ['fornecedor_id']
            isOneToOne: false
            referencedRelation: 'fornecedores'
            referencedColumns: ['id']
          }
        ]
      }
      veiculos: {
        Row: {
          ano: number | null
          cliente_id: string
          cor: string | null
          created_at: string
          id: string
          km_atual: number | null
          marca: string | null
          modelo: string | null
          observacoes: string | null
          placa: string
          updated_at: string
        }
        Insert: {
          ano?: number | null
          cliente_id: string
          cor?: string | null
          created_at?: string
          id?: string
          km_atual?: number | null
          marca?: string | null
          modelo?: string | null
          observacoes?: string | null
          placa: string
          updated_at?: string
        }
        Update: {
          ano?: number | null
          cliente_id?: string
          cor?: string | null
          created_at?: string
          id?: string
          km_atual?: number | null
          marca?: string | null
          modelo?: string | null
          observacoes?: string | null
          placa?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'veiculos_cliente_id_fkey'
            columns: ['cliente_id']
            isOneToOne: false
            referencedRelation: 'clientes'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {


      dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      dashboard_home: {
        Args: { p_now?: string }
        Returns: Json
      }
      team_indicators: {
        Args: { p_inicio: string, p_fim: string }
        Returns: Json
      }
      finance_summary: {
        Args: { p_mes: string }
        Returns: Json
      }
      finance_statement: {
        Args: { p_mes: string; p_limit?: number; p_offset?: number }
        Returns: {
          id: string
          tipo: string
          descricao: string
          valor: number
          pago_em: string
          forma_pagamento: string | null
          meta: string | null
          total_count: number
        }[]
      }
      finance_cashflow_6_months: {
        Args: { p_mes_final?: string }
        Returns: {
          mes: string
          mes_label: string
          entradas: number
          saidas: number
          saldo: number
        }[]
      }
      list_collaborators: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          nome: string
          papel: string
          username: string
          created_at: string
        }[]
      }
      search_vehicle_options: {
        Args: {
          p_search?: string | null
          p_limit?: number
          p_preferred_id?: string | null
        }
        Returns: {
          id: string
          placa: string
          marca: string | null
          modelo: string | null
          cliente_id: string
          cliente_nome: string
        }[]
      }
      update_collaborator_role: {
        Args: { p_user_id: string, p_papel: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Agendamento = Database['public']['Tables']['agendamentos']['Row']
export type AgendamentoInsert = Database['public']['Tables']['agendamentos']['Insert']
export type AgendamentoUpdate = Database['public']['Tables']['agendamentos']['Update']
export type Cliente = Database['public']['Tables']['clientes']['Row']
export type ClienteInsert = Database['public']['Tables']['clientes']['Insert']
export type ClienteUpdate = Database['public']['Tables']['clientes']['Update']
export type Veiculo = Database['public']['Tables']['veiculos']['Row']
export type VeiculoInsert = Database['public']['Tables']['veiculos']['Insert']
export type VeiculoUpdate = Database['public']['Tables']['veiculos']['Update']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type OrdemServico = Database['public']['Tables']['ordens_servico']['Row']
export type OrdemServicoInsert = Database['public']['Tables']['ordens_servico']['Insert']
export type OrdemServicoUpdate = Database['public']['Tables']['ordens_servico']['Update']
export type OrdemFoto = Database['public']['Tables']['ordem_fotos']['Row']
export type OrdemFotoInsert = Database['public']['Tables']['ordem_fotos']['Insert']
export type OrdemItem = Database['public']['Tables']['ordem_itens']['Row']
export type OrdemItemInsert = Database['public']['Tables']['ordem_itens']['Insert']
export type ServicoCatalogo = Database['public']['Tables']['servicos_catalogo']['Row']
export type ServicoCatalogoInsert = Database['public']['Tables']['servicos_catalogo']['Insert']
export type Fornecedor = Database['public']['Tables']['fornecedores']['Row']
export type FornecedorInsert = Database['public']['Tables']['fornecedores']['Insert']
export type CatalogoKitItem = Database['public']['Tables']['catalogo_kit_itens']['Row']
export type FinanceiroCategoria = Database['public']['Tables']['financeiro_categorias']['Row']
export type FinanceiroCategoriaInsert = Database['public']['Tables']['financeiro_categorias']['Insert']
export type FinanceiroConta = Database['public']['Tables']['financeiro_contas']['Row']
export type FinanceiroContaInsert = Database['public']['Tables']['financeiro_contas']['Insert']
export type FinanceiroContaUpdate = Database['public']['Tables']['financeiro_contas']['Update']
export type OficinaParametros = Database['public']['Tables']['oficina_parametros']['Row']
export type OficinaParametrosUpdate = Database['public']['Tables']['oficina_parametros']['Update']
export type ColaboradorPresenca = Database['public']['Tables']['colaborador_presencas']['Row']
export type ColaboradorPresencaInsert = Database['public']['Tables']['colaborador_presencas']['Insert']
export type ColaboradorFalta = Database['public']['Tables']['colaborador_faltas']['Row']
export type ColaboradorFaltaInsert = Database['public']['Tables']['colaborador_faltas']['Insert']
export type ColaboradorOcorrencia = Database['public']['Tables']['colaborador_ocorrencias']['Row']
export type ColaboradorOcorrenciaInsert = Database['public']['Tables']['colaborador_ocorrencias']['Insert']
