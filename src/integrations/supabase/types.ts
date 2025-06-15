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
      chores: {
        Row: {
          assignment_type: string
          created_at: string
          created_by: string
          description: string | null
          frequency: string
          id: string
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
          name?: string
          participants?: string[] | null
          reminder_time?: string | null
          start_date?: string
          updated_at?: string
          weekly_schedule?: Json | null
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
      get_current_user_email: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_email_by_id: {
        Args: { user_id_param: string }
        Returns: string
      }
      get_users_details: {
        Args: { p_user_ids: string[] }
        Returns: Database["public"]["CompositeTypes"]["user_details"][]
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
