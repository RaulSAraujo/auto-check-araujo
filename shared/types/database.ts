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
      checklist_item_fotos: {
        Row: {
          checklist_item_id: string
          created_at: string
          id: string
          nome_arquivo: string | null
          storage_path: string
        }
        Insert: {
          checklist_item_id: string
          created_at?: string
          id?: string
          nome_arquivo?: string | null
          storage_path: string
        }
        Update: {
          checklist_item_id?: string
          created_at?: string
          id?: string
          nome_arquivo?: string | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: 'checklist_item_fotos_checklist_item_id_fkey'
            columns: ['checklist_item_id']
            isOneToOne: false
            referencedRelation: 'checklist_itens'
            referencedColumns: ['id']
          }
        ]
      }
      checklist_itens: {
        Row: {
          categoria: string
          checklist_id: string
          created_at: string
          id: string
          label: string
          observacao: string | null
          ordem: number
          resultado: string | null
          updated_at: string
        }
        Insert: {
          categoria: string
          checklist_id: string
          created_at?: string
          id?: string
          label: string
          observacao?: string | null
          ordem?: number
          resultado?: string | null
          updated_at?: string
        }
        Update: {
          categoria?: string
          checklist_id?: string
          created_at?: string
          id?: string
          label?: string
          observacao?: string | null
          ordem?: number
          resultado?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'checklist_itens_checklist_id_fkey'
            columns: ['checklist_id']
            isOneToOne: false
            referencedRelation: 'checklists'
            referencedColumns: ['id']
          }
        ]
      }
      checklist_template_itens: {
        Row: {
          categoria: string
          id: string
          label: string
          ordem: number
          template_id: string
        }
        Insert: {
          categoria: string
          id?: string
          label: string
          ordem?: number
          template_id: string
        }
        Update: {
          categoria?: string
          id?: string
          label?: string
          ordem?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'checklist_template_itens_template_id_fkey'
            columns: ['template_id']
            isOneToOne: false
            referencedRelation: 'checklist_templates'
            referencedColumns: ['id']
          }
        ]
      }
      checklist_templates: {
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
      checklists: {
        Row: {
          created_at: string
          id: string
          ordem_servico_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          ordem_servico_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          ordem_servico_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'checklists_ordem_servico_id_fkey'
            columns: ['ordem_servico_id']
            isOneToOne: true
            referencedRelation: 'ordens_servico'
            referencedColumns: ['id']
          }
        ]
      }
      clientes: {
        Row: {
          created_at: string
          documento: string | null
          email: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          documento?: string | null
          email?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          documento?: string | null
          email?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
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
          forma_pagamento: string | null
          id: string
          km_entrada: number | null
          numero: string
          observacoes: string | null
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
          forma_pagamento?: string | null
          id?: string
          km_entrada?: number | null
          numero?: string
          observacoes?: string | null
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
          forma_pagamento?: string | null
          id?: string
          km_entrada?: number | null
          numero?: string
          observacoes?: string | null
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
        }
        Insert: {
          created_at?: string
          id: string
          nome: string
          papel?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          papel?: string
        }
        Relationships: []
      }
      servicos_catalogo: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          tipo: string
          valor_padrao: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          tipo: string
          valor_padrao?: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          tipo?: string
          valor_padrao?: number
        }
        Relationships: []
      }
      veiculos: {
        Row: {
          ano: number | null
          cliente_id: string
          cor: string | null
          created_at: string
          id: string
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
      criar_checklist_da_os: {
        Args: { p_ordem_servico_id: string }
        Returns: string
      }
      dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      financeiro_resumo: {
        Args: { p_mes: string }
        Returns: Json
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
export type Checklist = Database['public']['Tables']['checklists']['Row']
export type ChecklistItem = Database['public']['Tables']['checklist_itens']['Row']
export type ChecklistItemFoto = Database['public']['Tables']['checklist_item_fotos']['Row']
export type OrdemItem = Database['public']['Tables']['ordem_itens']['Row']
export type OrdemItemInsert = Database['public']['Tables']['ordem_itens']['Insert']
export type ServicoCatalogo = Database['public']['Tables']['servicos_catalogo']['Row']
