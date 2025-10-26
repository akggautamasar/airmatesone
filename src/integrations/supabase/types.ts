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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      chores: {
        Row: {
          assignment_type: string
          created_at: string
          created_by: string
          description: string | null
          frequency: string
          id: string
          last_reminder_sent_date: string | null
          name: string
          participants: string[] | null
          reminder_time: string | null
          start_date: string
          updated_at: string
          weekly_schedule: Json | null
        }
        Insert: {
          assignment_type?: string
          created_at?: string
          created_by: string
          description?: string | null
          frequency?: string
          id?: string
          last_reminder_sent_date?: string | null
          name: string
          participants?: string[] | null
          reminder_time?: string | null
          start_date: string
          updated_at?: string
          weekly_schedule?: Json | null
        }
        Update: {
          assignment_type?: string
          created_at?: string
          created_by?: string
          description?: string | null
          frequency?: string
          id?: string
          last_reminder_sent_date?: string | null
          name?: string
          participants?: string[] | null
          reminder_time?: string | null
          start_date?: string
          updated_at?: string
          weekly_schedule?: Json | null
        }
        Relationships: []
      }
      event_types: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_default: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          event_date: string
          event_type: string | null
          id: string
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_date: string
          event_type?: string | null
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_date?: string
          event_type?: string | null
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      expense_splits: {
        Row: {
          amount: number
          created_at: string
          expense_id: string
          id: string
          roommate_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          expense_id: string
          id?: string
          roommate_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          expense_id?: string
          id?: string
          roommate_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_splits_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_splits_roommate_id_fkey"
            columns: ["roommate_id"]
            isOneToOne: false
            referencedRelation: "roommates"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_subcategories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string
          id: string
          paid_by: string
          sharers: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          date?: string
          description: string
          id?: string
          paid_by: string
          sharers?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          paid_by?: string
          sharers?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      grocery_items: {
        Row: {
          category: string
          created_at: string
          id: string
          is_completed: boolean | null
          name: string
          quantity: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_completed?: boolean | null
          name: string
          quantity?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_completed?: boolean | null
          name?: string
          quantity?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      market_trips: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          updated_at: string
          user_id: string
          user_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id: string
          user_name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      monthly_budgets: {
        Row: {
          budget_amount: number
          category_id: string
          created_at: string
          id: string
          month: number
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          budget_amount: number
          category_id: string
          created_at?: string
          id?: string
          month: number
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          budget_amount?: number
          category_id?: string
          created_at?: string
          id?: string
          month?: number
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      note_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          note_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          note_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          note_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_reactions_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "shared_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_reminders: {
        Row: {
          created_at: string
          creditor_user_id: string
          debtor_user_id: string
          expense_id: string
          id: string
          is_active: boolean
          reminder_sent_at: string | null
          settlement_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          creditor_user_id: string
          debtor_user_id: string
          expense_id: string
          id?: string
          is_active?: boolean
          reminder_sent_at?: string | null
          settlement_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          creditor_user_id?: string
          debtor_user_id?: string
          expense_id?: string
          id?: string
          is_active?: boolean
          reminder_sent_at?: string | null
          settlement_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_reminders_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_reminders_settlement_id_fkey"
            columns: ["settlement_id"]
            isOneToOne: false
            referencedRelation: "settlements"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          expense_id: string | null
          id: string
          is_read: boolean
          message: string
          settlement_id: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expense_id?: string | null
          id?: string
          is_read?: boolean
          message: string
          settlement_id?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expense_id?: string | null
          id?: string
          is_read?: boolean
          message?: string
          settlement_id?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_settlement_id_fkey"
            columns: ["settlement_id"]
            isOneToOne: false
            referencedRelation: "settlements"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_modes: {
        Row: {
          created_at: string
          id: string
          name: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      personal_transactions: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          description: string | null
          id: string
          is_recurring: boolean | null
          notes: string | null
          payment_mode_id: string
          recurring_frequency: string | null
          subcategory_id: string | null
          transaction_date: string
          type: string
          updated_at: string
          user_id: string
          voice_note_url: string | null
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          payment_mode_id: string
          recurring_frequency?: string | null
          subcategory_id?: string | null
          transaction_date: string
          type: string
          updated_at?: string
          user_id: string
          voice_note_url?: string | null
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          payment_mode_id?: string
          recurring_frequency?: string | null
          subcategory_id?: string | null
          transaction_date?: string
          type?: string
          updated_at?: string
          user_id?: string
          voice_note_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personal_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_transactions_payment_mode_id_fkey"
            columns: ["payment_mode_id"]
            isOneToOne: false
            referencedRelation: "payment_modes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_transactions_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "expense_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          created_by: string
          id: string
          name: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by: string
          id?: string
          name: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          language: string | null
          mobile_number: string | null
          name: string | null
          updated_at: string
          upi_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          language?: string | null
          mobile_number?: string | null
          name?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          language?: string | null
          mobile_number?: string | null
          name?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Relationships: []
      }
      roommates: {
        Row: {
          balance: number | null
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          updated_at: string
          upi_id: string
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
          upi_id: string
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
          upi_id?: string
          user_id?: string
        }
        Relationships: []
      }
      settlements: {
        Row: {
          amount: number
          created_at: string
          creditor_user_id: string | null
          debtor_user_id: string | null
          email: string
          expense_id: string | null
          id: string
          marked_by_creditor: boolean | null
          marked_by_debtor: boolean | null
          name: string
          settled_date: string | null
          status: string
          transaction_group_id: string | null
          type: string
          updated_at: string
          upi_id: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          creditor_user_id?: string | null
          debtor_user_id?: string | null
          email: string
          expense_id?: string | null
          id?: string
          marked_by_creditor?: boolean | null
          marked_by_debtor?: boolean | null
          name: string
          settled_date?: string | null
          status?: string
          transaction_group_id?: string | null
          type: string
          updated_at?: string
          upi_id: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          creditor_user_id?: string | null
          debtor_user_id?: string | null
          email?: string
          expense_id?: string | null
          id?: string
          marked_by_creditor?: boolean | null
          marked_by_debtor?: boolean | null
          name?: string
          settled_date?: string | null
          status?: string
          transaction_group_id?: string | null
          type?: string
          updated_at?: string
          upi_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlements_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_notes: {
        Row: {
          color_hex: string | null
          content: string
          created_at: string
          done_by_user_id: string | null
          id: string
          is_archived: boolean
          is_done: boolean
          is_pinned: boolean
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color_hex?: string | null
          content: string
          created_at?: string
          done_by_user_id?: string | null
          id?: string
          is_archived?: boolean
          is_done?: boolean
          is_pinned?: boolean
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color_hex?: string | null
          content?: string
          created_at?: string
          done_by_user_id?: string | null
          id?: string
          is_archived?: boolean
          is_done?: boolean
          is_pinned?: boolean
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_notes_done_by_user_id_fkey"
            columns: ["done_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_shopping_items: {
        Row: {
          added_by: string
          category: string | null
          created_at: string
          id: string
          is_purchased: boolean | null
          name: string
          purchased_at: string | null
          purchased_by: string | null
          quantity: string
          updated_at: string
        }
        Insert: {
          added_by: string
          category?: string | null
          created_at?: string
          id?: string
          is_purchased?: boolean | null
          name: string
          purchased_at?: string | null
          purchased_by?: string | null
          quantity: string
          updated_at?: string
        }
        Update: {
          added_by?: string
          category?: string | null
          created_at?: string
          id?: string
          is_purchased?: boolean | null
          name?: string
          purchased_at?: string | null
          purchased_by?: string | null
          quantity?: string
          updated_at?: string
        }
        Relationships: []
      }
      shopping_list_items: {
        Row: {
          added_by: string
          created_at: string
          custom_product_name: string | null
          id: string
          is_purchased: boolean | null
          product_id: string | null
          purchased_at: string | null
          purchased_by: string | null
          quantity: string
          shopping_list_id: string
          updated_at: string
        }
        Insert: {
          added_by: string
          created_at?: string
          custom_product_name?: string | null
          id?: string
          is_purchased?: boolean | null
          product_id?: string | null
          purchased_at?: string | null
          purchased_by?: string | null
          quantity: string
          shopping_list_id: string
          updated_at?: string
        }
        Update: {
          added_by?: string
          created_at?: string
          custom_product_name?: string | null
          id?: string
          is_purchased?: boolean | null
          product_id?: string | null
          purchased_at?: string | null
          purchased_by?: string | null
          quantity?: string
          shopping_list_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_list_items_shopping_list_id_fkey"
            columns: ["shopping_list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_lists: {
        Row: {
          created_at: string
          created_by: string
          date: string
          id: string
          is_market_notification_sent: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          date: string
          id?: string
          is_market_notification_sent?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          date?: string
          id?: string
          is_market_notification_sent?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_email: { Args: never; Returns: string }
      get_user_email_by_id: { Args: { user_id_param: string }; Returns: string }
      get_users_details: {
        Args: { p_user_ids: string[] }
        Returns: Database["public"]["CompositeTypes"]["user_details"][]
        SetofOptions: {
          from: "*"
          to: "user_details"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      send_market_notification: {
        Args: { shopping_list_id_param: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      user_details: {
        id: string | null
        name: string | null
        email: string | null
      }
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
