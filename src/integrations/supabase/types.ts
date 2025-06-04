// Updated: 2025-07-29 16:30:23
// Updated: 2025-07-29 16:30:18
// Updated: 2025-07-29 16:30:17
// Updated: 2025-07-29 16:30:11
// Updated: 2025-07-29 16:30:09
// Updated: 2025-07-29 16:30:08
// Updated: 2025-07-29 16:30:06
// Updated: 2025-07-29 16:30:02
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      database: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      gallery_items: {
        Row: {
          caption: string | null
          created_at: string | null
          id: string
          image_url: string
          type: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          type?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          type?: string | null
        }
        Relationships: []
      }
      menu_categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      menu_item_variants: {
        Row: {
          created_at: string
          id: string
          menu_item_id: string
          out_until: string | null
          price_modifier_cents: number
          sort_order: number | null
          stock_status: string | null
          updated_at: string
          variant_name: string
          variant_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          menu_item_id: string
          out_until?: string | null
          price_modifier_cents?: number
          sort_order?: number | null
          stock_status?: string | null
          updated_at?: string
          variant_name: string
          variant_type: string
        }
        Update: {
          created_at?: string
          id?: string
          menu_item_id?: string
          out_until?: string | null
          price_modifier_cents?: number
          sort_order?: number | null
          stock_status?: string | null
          updated_at?: string
          variant_name?: string
          variant_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_variants_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean | null
          name: string
          out_until: string | null
          price_cents: number
          stock_notes: string | null
          stock_status: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name: string
          out_until?: string | null
          price_cents: number
          stock_notes?: string | null
          stock_status?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name?: string
          out_until?: string | null
          price_cents?: number
          stock_notes?: string | null
          stock_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          channel: string | null
          created_at: string | null
          event: string | null
          id: string
          order_id: string | null
          recipient: string | null
          success: boolean | null
        }
        Insert: {
          channel?: string | null
          created_at?: string | null
          event?: string | null
          id?: string
          order_id?: string | null
          recipient?: string | null
          success?: boolean | null
        }
        Update: {
          channel?: string | null
          created_at?: string | null
          event?: string | null
          id?: string
          order_id?: string | null
          recipient?: string | null
          success?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          custom_name: string | null
          id: string
          menu_item_id: string | null
          order_id: string | null
          quantity: number
          special_instructions: string | null
          unit_price_cents: number
        }
        Insert: {
          created_at?: string | null
          custom_name?: string | null
          id?: string
          menu_item_id?: string | null
          order_id?: string | null
          quantity: number
          special_instructions?: string | null
          unit_price_cents: number
        }
        Update: {
          created_at?: string | null
          custom_name?: string | null
          id?: string
          menu_item_id?: string | null
          order_id?: string | null
          quantity?: number
          special_instructions?: string | null
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          notification_preference: string | null
          special_requests: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          stripe_payment_id: string | null
          total_cents: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          notification_preference?: string | null
          special_requests?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          stripe_payment_id?: string | null
          total_cents: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          notification_preference?: string | null
          special_requests?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          stripe_payment_id?: string | null
          total_cents?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: string | null
          sms_opt_in: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string | null
          sms_opt_in?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string | null
          sms_opt_in?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          subscription_data: Json
          updated_at: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          subscription_data: Json
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          subscription_data?: Json
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_order_transaction: {
        Args: {
          p_user_id: string
          p_customer_name: string
          p_customer_email: string
          p_customer_phone: string
          p_total_cents: number
          p_stripe_payment_id: string
          p_special_requests: string
          p_cart_data: string
        }
        Returns: Json
      }
    }
    Enums: {
      order_status:
        | "pending"
        | "confirmed"
        | "in_progress"
        | "ready_for_pickup"
        | "completed"
        | "cancelled"
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
    Enums: {
      order_status: [
        "pending",
        "confirmed",
        "in_progress",
        "ready_for_pickup",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
