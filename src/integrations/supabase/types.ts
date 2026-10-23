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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      admin_roles: {
        Row: { user_id: string; role: "owner" | "staff"; view_leads: boolean; delete_leads: boolean; view_pricing: boolean; manage_coupons: boolean; created_at: string; updated_at: string }
        Insert: { user_id: string; role: "owner" | "staff"; view_leads?: boolean; delete_leads?: boolean; view_pricing?: boolean; manage_coupons?: boolean; created_at?: string; updated_at?: string }
        Update: { user_id?: string; role?: "owner" | "staff"; view_leads?: boolean; delete_leads?: boolean; view_pricing?: boolean; manage_coupons?: boolean; created_at?: string; updated_at?: string }
        Relationships: []
      }
      admin_audit_log: {
        Row: { id: number; actor_id: string | null; action: string; object_type: string; object_id: string | null; occurred_at: string; result: "denied" | "success" | "failure" | "validation_error" }
        Insert: { id?: number; actor_id?: string | null; action: string; object_type: string; object_id?: string | null; occurred_at?: string; result: "denied" | "success" | "failure" | "validation_error" }
        Update: { id?: number; actor_id?: string | null; action?: string; object_type?: string; object_id?: string | null; occurred_at?: string; result?: "denied" | "success" | "failure" | "validation_error" }
        Relationships: []
      }
      account_email_claims: {
        Row: {
          email: string
          user_id: string
          claimed_at: string
        }
        Insert: {
          email: string
          user_id: string
          claimed_at?: string
        }
        Update: {
          email?: string
          user_id?: string
          claimed_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          delivery_accepted_at: string | null
          delivery_attempted_at: string | null
          delivery_status: string
          email: string
          id: string
          marketing_consent: boolean
          message: string
          name: string
          phone: string
          transactional_consent: boolean
        }
        Insert: {
          created_at?: string
          delivery_accepted_at?: string | null
          delivery_attempted_at?: string | null
          delivery_status?: string
          email: string
          id?: string
          marketing_consent?: boolean
          message: string
          name: string
          phone: string
          transactional_consent?: boolean
        }
        Update: {
          created_at?: string
          delivery_accepted_at?: string | null
          delivery_attempted_at?: string | null
          delivery_status?: string
          email?: string
          id?: string
          marketing_consent?: boolean
          message?: string
          name?: string
          phone?: string
          transactional_consent?: boolean
        }
        Relationships: []
      }
      coupons: {
        Row: {
          active: boolean
          amount: number
          code: string
          created_at: string
          expires_at: string | null
          id: string
          max_uses: number | null
          meds: string[]
          type: string
          updated_at: string
          uses: number
        }
        Insert: {
          active?: boolean
          amount: number
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          meds?: string[]
          type: string
          updated_at?: string
          uses?: number
        }
        Update: {
          active?: boolean
          amount?: number
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          meds?: string[]
          type?: string
          updated_at?: string
          uses?: number
        }
        Relationships: []
      }
      funnel_leads: {
        Row: {
          age_18: string | null
          created_at: string
          email: string | null
          email_consent: boolean
          email_marketing_consent: boolean
          first_name: string | null
          id: string
          last_name: string | null
          on_glp1: string | null
          phone: string | null
          session_id: string
          sms_marketing_consent: boolean
          sms_transactional_consent: boolean
          stage: string
          state: string | null
          updated_at: string
        }
        Insert: {
          age_18?: string | null
          created_at?: string
          email?: string | null
          email_consent?: boolean
          email_marketing_consent?: boolean
          first_name?: string | null
          id?: string
          last_name?: string | null
          on_glp1?: string | null
          phone?: string | null
          session_id: string
          sms_marketing_consent?: boolean
          sms_transactional_consent?: boolean
          stage?: string
          state?: string | null
          updated_at?: string
        }
        Update: {
          age_18?: string | null
          created_at?: string
          email?: string | null
          email_consent?: boolean
          email_marketing_consent?: boolean
          first_name?: string | null
          id?: string
          last_name?: string | null
          on_glp1?: string | null
          phone?: string | null
          session_id?: string
          sms_marketing_consent?: boolean
          sms_transactional_consent?: boolean
          stage?: string
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      fuse_webhook_events: {
        Row: {
          event: string
          idempotency_key: string
          received_at: string
        }
        Insert: {
          event: string
          idempotency_key: string
          received_at?: string
        }
        Update: {
          event?: string
          idempotency_key?: string
          received_at?: string
        }
        Relationships: []
      }
      order_failures: {
        Row: {
          amount: number | null
          coupon_code: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          medication: string | null
          phone: string | null
          plan_id: string | null
          product_id: string | null
          reason: string | null
          session_id: string | null
          state: string | null
        }
        Insert: {
          amount?: number | null
          coupon_code?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          medication?: string | null
          phone?: string | null
          plan_id?: string | null
          product_id?: string | null
          reason?: string | null
          session_id?: string | null
          state?: string | null
        }
        Update: {
          amount?: number | null
          coupon_code?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          medication?: string | null
          phone?: string | null
          plan_id?: string | null
          product_id?: string | null
          reason?: string | null
          session_id?: string | null
          state?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          apt: string | null
          card_last4: string | null
          city: string | null
          coupon_code: string | null
          created_at: string
          discount: number
          dob: string | null
          email: string
          environment: string
          first_name: string | null
          fuse_order_id: string | null
          fuse_session_id: string | null
          fuzerx_consult_id: string | null
          fuzerx_fill_request_id: string | null
          fuzerx_last_event: string | null
          fuzerx_patient_token: string | null
          fuzerx_prescription_token: string | null
          fuzerx_status: string | null
          fuzerx_updated_at: string | null
          gender: string | null
          id: string
          is_renewal: boolean
          last_name: string | null
          medication: string
          order_number: string
          payment_mode: string
          phone: string | null
          plan_id: string
          product_id: string
          product_name: string
          session_id: string | null
          state: string | null
          status: string
          street: string | null
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          stripe_subscription_id: string | null
          subtotal: number
          total: number
          user_id: string | null
          zip: string | null
        }
        Insert: {
          apt?: string | null
          card_last4?: string | null
          city?: string | null
          coupon_code?: string | null
          created_at?: string
          discount?: number
          dob?: string | null
          email: string
          environment?: string
          first_name?: string | null
          fuse_order_id?: string | null
          fuse_session_id?: string | null
          fuzerx_consult_id?: string | null
          fuzerx_fill_request_id?: string | null
          fuzerx_last_event?: string | null
          fuzerx_patient_token?: string | null
          fuzerx_prescription_token?: string | null
          fuzerx_status?: string | null
          fuzerx_updated_at?: string | null
          gender?: string | null
          id?: string
          is_renewal?: boolean
          last_name?: string | null
          medication: string
          order_number: string
          payment_mode?: string
          phone?: string | null
          plan_id: string
          product_id: string
          product_name: string
          session_id?: string | null
          state?: string | null
          status?: string
          street?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          subtotal: number
          total: number
          user_id?: string | null
          zip?: string | null
        }
        Update: {
          apt?: string | null
          card_last4?: string | null
          city?: string | null
          coupon_code?: string | null
          created_at?: string
          discount?: number
          dob?: string | null
          email?: string
          environment?: string
          first_name?: string | null
          fuse_order_id?: string | null
          fuse_session_id?: string | null
          fuzerx_consult_id?: string | null
          fuzerx_fill_request_id?: string | null
          fuzerx_last_event?: string | null
          fuzerx_patient_token?: string | null
          fuzerx_prescription_token?: string | null
          fuzerx_status?: string | null
          fuzerx_updated_at?: string | null
          gender?: string | null
          id?: string
          is_renewal?: boolean
          last_name?: string | null
          medication?: string
          order_number?: string
          payment_mode?: string
          phone?: string | null
          plan_id?: string
          product_id?: string
          product_name?: string
          session_id?: string | null
          state?: string | null
          status?: string
          street?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          subtotal?: number
          total?: number
          user_id?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          email: string
          environment: string
          first_order_number: string | null
          id: string
          medication: string | null
          price_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          email: string
          environment?: string
          first_order_number?: string | null
          id?: string
          medication?: string | null
          price_id: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          email?: string
          environment?: string
          first_order_number?: string | null
          id?: string
          medication?: string | null
          price_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_admin_coupon: { Args: { p_actor_id: string; p_coupon_id: string }; Returns: undefined }
      delete_admin_funnel_leads: { Args: { p_actor_id: string; p_lead_ids: string[] }; Returns: number }
      save_admin_coupon: { Args: { p_actor_id: string; p_coupon_id: string | null; p_code: string; p_type: string; p_amount: number; p_active: boolean; p_expires_at: string | null; p_max_uses: number | null; p_meds: string[] }; Returns: string }
      claim_verified_guest_records: { Args: { _user_id: string }; Returns: string }
      redeem_coupon: { Args: { _code: string }; Returns: undefined }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
