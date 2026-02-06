export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_advice_history: {
        Row: {
          advice_content: string
          advice_type: string
          confidence: number | null
          created_at: string
          id: string
          is_urgent: boolean | null
          price_at_time: number | null
          reference_url: string | null
          symbol: string
          triggered_by: string | null
          urgency_reason: string | null
        }
        Insert: {
          advice_content: string
          advice_type: string
          confidence?: number | null
          created_at?: string
          id?: string
          is_urgent?: boolean | null
          price_at_time?: number | null
          reference_url?: string | null
          symbol: string
          triggered_by?: string | null
          urgency_reason?: string | null
        }
        Update: {
          advice_content?: string
          advice_type?: string
          confidence?: number | null
          created_at?: string
          id?: string
          is_urgent?: boolean | null
          price_at_time?: number | null
          reference_url?: string | null
          symbol?: string
          triggered_by?: string | null
          urgency_reason?: string | null
        }
        Relationships: []
      }
      ai_managed_positions: {
        Row: {
          allocated_asset: number
          close_price: number | null
          closed_at: string | null
          created_at: string
          current_pnl: number | null
          entry_price: number
          id: string
          signal_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          allocated_asset: number
          close_price?: number | null
          closed_at?: string | null
          created_at?: string
          current_pnl?: number | null
          entry_price: number
          id?: string
          signal_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          allocated_asset?: number
          close_price?: number | null
          closed_at?: string | null
          created_at?: string
          current_pnl?: number | null
          entry_price?: number
          id?: string
          signal_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_managed_positions_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "ai_trading_signals"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_performance_stats: {
        Row: {
          avg_hold_time_minutes: number | null
          avg_leverage: number | null
          avg_pnl: number | null
          best_trade_pnl: number | null
          created_at: string
          id: string
          losses: number | null
          period_end: string | null
          period_start: string
          period_type: string
          symbol: string | null
          total_pnl: number | null
          total_signals: number | null
          updated_at: string
          win_rate: number | null
          wins: number | null
          worst_trade_pnl: number | null
        }
        Insert: {
          avg_hold_time_minutes?: number | null
          avg_leverage?: number | null
          avg_pnl?: number | null
          best_trade_pnl?: number | null
          created_at?: string
          id?: string
          losses?: number | null
          period_end?: string | null
          period_start: string
          period_type: string
          symbol?: string | null
          total_pnl?: number | null
          total_signals?: number | null
          updated_at?: string
          win_rate?: number | null
          wins?: number | null
          worst_trade_pnl?: number | null
        }
        Update: {
          avg_hold_time_minutes?: number | null
          avg_leverage?: number | null
          avg_pnl?: number | null
          best_trade_pnl?: number | null
          created_at?: string
          id?: string
          losses?: number | null
          period_end?: string | null
          period_start?: string
          period_type?: string
          symbol?: string | null
          total_pnl?: number | null
          total_signals?: number | null
          updated_at?: string
          win_rate?: number | null
          wins?: number | null
          worst_trade_pnl?: number | null
        }
        Relationships: []
      }
      ai_self_reviews: {
        Row: {
          created_at: string
          id: string
          lessons_learned: string | null
          period_end: string
          period_start: string
          review_content: string
          signals_reviewed: number | null
          what_to_improve: string | null
          what_went_well: string | null
          win_rate_this_period: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          lessons_learned?: string | null
          period_end: string
          period_start: string
          review_content: string
          signals_reviewed?: number | null
          what_to_improve?: string | null
          what_went_well?: string | null
          win_rate_this_period?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          lessons_learned?: string | null
          period_end?: string
          period_start?: string
          review_content?: string
          signals_reviewed?: number | null
          what_to_improve?: string | null
          what_went_well?: string | null
          win_rate_this_period?: number | null
        }
        Relationships: []
      }
      ai_trading_signals: {
        Row: {
          close_price: number | null
          closed_at: string | null
          confidence: number | null
          created_at: string
          entry_price: number
          evidence_reasoning: string | null
          highest_price_reached: number | null
          id: string
          is_urgent: boolean | null
          leverage: number | null
          lowest_price_reached: number | null
          pnl_percent: number | null
          position: string
          reference_url: string | null
          sentiment_score: number | null
          status: string
          stop_loss: number
          symbol: string
          target_price: number
          urgency_reason: string | null
        }
        Insert: {
          close_price?: number | null
          closed_at?: string | null
          confidence?: number | null
          created_at?: string
          entry_price: number
          evidence_reasoning?: string | null
          highest_price_reached?: number | null
          id?: string
          is_urgent?: boolean | null
          leverage?: number | null
          lowest_price_reached?: number | null
          pnl_percent?: number | null
          position: string
          reference_url?: string | null
          sentiment_score?: number | null
          status?: string
          stop_loss: number
          symbol: string
          target_price: number
          urgency_reason?: string | null
        }
        Update: {
          close_price?: number | null
          closed_at?: string | null
          confidence?: number | null
          created_at?: string
          entry_price?: number
          evidence_reasoning?: string | null
          highest_price_reached?: number | null
          id?: string
          is_urgent?: boolean | null
          leverage?: number | null
          lowest_price_reached?: number | null
          pnl_percent?: number | null
          position?: string
          reference_url?: string | null
          sentiment_score?: number | null
          status?: string
          stop_loss?: number
          symbol?: string
          target_price?: number
          urgency_reason?: string | null
        }
        Relationships: []
      }
      trading_notes: {
        Row: {
          created_at: string
          id: string
          note_content: string
          position_id: string | null
          position_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note_content: string
          position_id?: string | null
          position_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note_content?: string
          position_id?: string | null
          position_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trading_signals: {
        Row: {
          close_price: number | null
          closed_at: string | null
          confidence: number
          created_at: string
          entry_price: number
          id: string
          leverage: number
          message: string | null
          position: string
          status: string
          stop_loss: number
          symbol: string
          target_price: number
        }
        Insert: {
          close_price?: number | null
          closed_at?: string | null
          confidence?: number
          created_at?: string
          entry_price: number
          id?: string
          leverage?: number
          message?: string | null
          position: string
          status?: string
          stop_loss: number
          symbol: string
          target_price: number
        }
        Update: {
          close_price?: number | null
          closed_at?: string | null
          confidence?: number
          created_at?: string
          entry_price?: number
          id?: string
          leverage?: number
          message?: string | null
          position?: string
          status?: string
          stop_loss?: number
          symbol?: string
          target_price?: number
        }
        Relationships: []
      }
      user_positions: {
        Row: {
          close_price: number | null
          closed_at: string | null
          created_at: string
          entry_price: number
          id: string
          leverage: number
          message: string | null
          position: string
          status: string
          stop_loss: number
          symbol: string
          target_price: number
          user_id: string
        }
        Insert: {
          close_price?: number | null
          closed_at?: string | null
          created_at?: string
          entry_price: number
          id?: string
          leverage?: number
          message?: string | null
          position: string
          status?: string
          stop_loss: number
          symbol: string
          target_price: number
          user_id: string
        }
        Update: {
          close_price?: number | null
          closed_at?: string | null
          created_at?: string
          entry_price?: number
          id?: string
          leverage?: number
          message?: string | null
          position?: string
          status?: string
          stop_loss?: number
          symbol?: string
          target_price?: number
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          id: string
          initial_asset: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          initial_asset?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          initial_asset?: number
          updated_at?: string
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
