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
      ordens_servico: {
        Row: {
          aberta_em: string
          aberto_por: string
          concluida_em: string | null
          created_at: string
          id: string
          km_entrada: number | null
          numero: string
          observacoes: string | null
          reclamacao: string | null
          status: string
          updated_at: string
          veiculo_id: string
        }
        Insert: {
          aberta_em?: string
          aberto_por: string
          concluida_em?: string | null
          created_at?: string
          id?: string
          km_entrada?: number | null
          numero?: string
          observacoes?: string | null
          reclamacao?: string | null
          status?: string
          updated_at?: string
          veiculo_id: string
        }
        Update: {
          aberta_em?: string
          aberto_por?: string
          concluida_em?: string | null
          created_at?: string
          id?: string
          km_entrada?: number | null
          numero?: string
          observacoes?: string | null
          reclamacao?: string | null
          status?: string
          updated_at?: string
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
        }
        Insert: {
          created_at?: string
          id: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
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
