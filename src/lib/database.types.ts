export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      analytics: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          resource_id: string | null
          resource_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_id?: string
        }
        Relationships: []
      }
      chain_conditions: {
        Row: {
          action: string | null
          condition_target: string | null
          condition_type: string
          condition_value: string | null
          created_at: string | null
          id: string
          next_step_id: string | null
          step_id: string
        }
        Insert: {
          action?: string | null
          condition_target?: string | null
          condition_type: string
          condition_value?: string | null
          created_at?: string | null
          id?: string
          next_step_id?: string | null
          step_id: string
        }
        Update: {
          action?: string | null
          condition_target?: string | null
          condition_type?: string
          condition_value?: string | null
          created_at?: string | null
          id?: string
          next_step_id?: string | null
          step_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chain_conditions_next_step_id_fkey"
            columns: ["next_step_id"]
            isOneToOne: false
            referencedRelation: "chain_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chain_conditions_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "chain_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      chain_steps: {
        Row: {
          chain_id: string
          conditions: Json | null
          created_at: string | null
          expected_output: string | null
          id: string
          name: string
          prompt_template: string
          retries: number | null
          retry_count: number | null
          step_order: number
          timeout: number | null
          timeout_seconds: number | null
        }
        Insert: {
          chain_id: string
          conditions?: Json | null
          created_at?: string | null
          expected_output?: string | null
          id?: string
          name: string
          prompt_template: string
          retries?: number | null
          retry_count?: number | null
          step_order: number
          timeout?: number | null
          timeout_seconds?: number | null
        }
        Update: {
          chain_id?: string
          conditions?: Json | null
          created_at?: string | null
          expected_output?: string | null
          id?: string
          name?: string
          prompt_template?: string
          retries?: number | null
          retry_count?: number | null
          step_order?: number
          timeout?: number | null
          timeout_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chain_steps_chain_id_fkey"
            columns: ["chain_id"]
            isOneToOne: false
            referencedRelation: "prompt_chains"
            referencedColumns: ["id"]
          },
        ]
      }
      chain_variables: {
        Row: {
          chain_id: string
          created_at: string | null
          default_value: string | null
          description: string | null
          id: string
          is_required: boolean | null
          variable_name: string
          variable_type: string
        }
        Insert: {
          chain_id: string
          created_at?: string | null
          default_value?: string | null
          description?: string | null
          id?: string
          is_required?: boolean | null
          variable_name: string
          variable_type: string
        }
        Update: {
          chain_id?: string
          created_at?: string | null
          default_value?: string | null
          description?: string | null
          id?: string
          is_required?: boolean | null
          variable_name?: string
          variable_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chain_variables_chain_id_fkey"
            columns: ["chain_id"]
            isOneToOne: false
            referencedRelation: "prompt_chains"
            referencedColumns: ["id"]
          },
        ]
      }
      character_emotions: {
        Row: {
          character_id: string
          context: string | null
          created_at: string | null
          emotion_id: string
          id: string
          intensity: number | null
        }
        Insert: {
          character_id: string
          context?: string | null
          created_at?: string | null
          emotion_id: string
          id?: string
          intensity?: number | null
        }
        Update: {
          character_id?: string
          context?: string | null
          created_at?: string | null
          emotion_id?: string
          id?: string
          intensity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "character_emotions_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_emotions_emotion_id_fkey"
            columns: ["emotion_id"]
            isOneToOne: false
            referencedRelation: "emotions"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          background: string | null
          created_at: string | null
          description: string | null
          goals: string[] | null
          id: string
          name: string
          personality: string[] | null
          quirks: string[] | null
          relationships: Json | null
          speaking_style: string | null
          strengths: string[] | null
          traits: Json | null
          updated_at: string | null
          user_id: string
          weaknesses: string[] | null
        }
        Insert: {
          background?: string | null
          created_at?: string | null
          description?: string | null
          goals?: string[] | null
          id?: string
          name: string
          personality?: string[] | null
          quirks?: string[] | null
          relationships?: Json | null
          speaking_style?: string | null
          strengths?: string[] | null
          traits?: Json | null
          updated_at?: string | null
          user_id: string
          weaknesses?: string[] | null
        }
        Update: {
          background?: string | null
          created_at?: string | null
          description?: string | null
          goals?: string[] | null
          id?: string
          name?: string
          personality?: string[] | null
          quirks?: string[] | null
          relationships?: Json | null
          speaking_style?: string | null
          strengths?: string[] | null
          traits?: Json | null
          updated_at?: string | null
          user_id?: string
          weaknesses?: string[] | null
        }
        Relationships: []
      }
      cult_approvals: {
        Row: {
          approval_level: string | null
          approval_reason: string | null
          approval_timestamp: string | null
          approved: boolean | null
          approved_by: string | null
          blessed: boolean | null
          created_at: string | null
          id: string
          prompt_id: string | null
          sanctified: boolean | null
          template_id: string | null
          user_id: string | null
        }
        Insert: {
          approval_level?: string | null
          approval_reason?: string | null
          approval_timestamp?: string | null
          approved?: boolean | null
          approved_by?: string | null
          blessed?: boolean | null
          created_at?: string | null
          id?: string
          prompt_id?: string | null
          sanctified?: boolean | null
          template_id?: string | null
          user_id?: string | null
        }
        Update: {
          approval_level?: string | null
          approval_reason?: string | null
          approval_timestamp?: string | null
          approved?: boolean | null
          approved_by?: string | null
          blessed?: boolean | null
          created_at?: string | null
          id?: string
          prompt_id?: string | null
          sanctified?: boolean | null
          template_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cult_approvals_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cult_approvals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      emotion_history: {
        Row: {
          character_id: string
          context: string | null
          emotion_id: string
          id: string
          intensity: number | null
          triggered_at: string | null
        }
        Insert: {
          character_id: string
          context?: string | null
          emotion_id: string
          id?: string
          intensity?: number | null
          triggered_at?: string | null
        }
        Update: {
          character_id?: string
          context?: string | null
          emotion_id?: string
          id?: string
          intensity?: number | null
          triggered_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emotion_history_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emotion_history_emotion_id_fkey"
            columns: ["emotion_id"]
            isOneToOne: false
            referencedRelation: "emotions"
            referencedColumns: ["id"]
          },
        ]
      }
      emotions: {
        Row: {
          arousal: number | null
          context: string | null
          created_at: string | null
          description: string | null
          dominance: number | null
          id: string
          intensity: number | null
          name: string
          primary_emotion: string | null
          responses: string[] | null
          secondary_emotions: string[] | null
          triggers: string[] | null
          updated_at: string | null
          user_id: string
          valence: number | null
        }
        Insert: {
          arousal?: number | null
          context?: string | null
          created_at?: string | null
          description?: string | null
          dominance?: number | null
          id?: string
          intensity?: number | null
          name: string
          primary_emotion?: string | null
          responses?: string[] | null
          secondary_emotions?: string[] | null
          triggers?: string[] | null
          updated_at?: string | null
          user_id: string
          valence?: number | null
        }
        Update: {
          arousal?: number | null
          context?: string | null
          created_at?: string | null
          description?: string | null
          dominance?: number | null
          id?: string
          intensity?: number | null
          name?: string
          primary_emotion?: string | null
          responses?: string[] | null
          secondary_emotions?: string[] | null
          triggers?: string[] | null
          updated_at?: string | null
          user_id?: string
          valence?: number | null
        }
        Relationships: []
      }
      exports: {
        Row: {
          content: string
          created_at: string | null
          format: string
          id: string
          project_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          format: string
          id: string
          project_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          format?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      mcp_servers: {
        Row: {
          auth_config: Json | null
          config: Json | null
          created_at: string | null
          description: string | null
          endpoint_url: string | null
          id: string
          name: string
          server_type: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auth_config?: Json | null
          config?: Json | null
          created_at?: string | null
          description?: string | null
          endpoint_url?: string | null
          id?: string
          name: string
          server_type: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auth_config?: Json | null
          config?: Json | null
          created_at?: string | null
          description?: string | null
          endpoint_url?: string | null
          id?: string
          name?: string
          server_type?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      personas: {
        Row: {
          created_by: string | null
          id: string
          name: string
          tone_blocks: string[]
          traits: string[]
        }
        Insert: {
          created_by?: string | null
          id: string
          name: string
          tone_blocks: string[]
          traits: string[]
        }
        Update: {
          created_by?: string | null
          id?: string
          name?: string
          tone_blocks?: string[]
          traits?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "personas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          close_price: number
          created_at: string | null
          high_price: number
          id: string
          low_price: number
          open_price: number
          price_timestamp: string
          symbol: string
          volume: number | null
        }
        Insert: {
          close_price: number
          created_at?: string | null
          high_price: number
          id?: string
          low_price: number
          open_price: number
          price_timestamp: string
          symbol?: string
          volume?: number | null
        }
        Update: {
          close_price?: number
          created_at?: string | null
          high_price?: number
          id?: string
          low_price?: number
          open_price?: number
          price_timestamp?: string
          symbol?: string
          volume?: number | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          last_modified: string | null
          name: string
          user_id: string
        }
        Insert: {
          id: string
          last_modified?: string | null
          name: string
          user_id: string
        }
        Update: {
          id?: string
          last_modified?: string | null
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_blocks: {
        Row: {
          id: string
          label: string
          order: number
          project_id: string
          type: string
          value: string
        }
        Insert: {
          id: string
          label: string
          order: number
          project_id: string
          type: string
          value: string
        }
        Update: {
          id?: string
          label?: string
          order?: number
          project_id?: string
          type?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_blocks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_chains: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      prompt_templates: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          tags: string[] | null
          template: string
          updated_at: string | null
          user_id: string
          variables: Json | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          tags?: string[] | null
          template: string
          updated_at?: string | null
          user_id: string
          variables?: Json | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          tags?: string[] | null
          template?: string
          updated_at?: string | null
          user_id?: string
          variables?: Json | null
        }
        Relationships: []
      }
      prompts: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          prompt: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          project_id: string
          prompt: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          prompt?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_prompts: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          prompt: string
          shared_by: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          prompt: string
          shared_by: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          prompt?: string
          shared_by?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string | null
          id: string
          settings: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          settings?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          settings?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database["public"]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never