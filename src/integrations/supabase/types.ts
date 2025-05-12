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
      fox_deliveries: {
        Row: {
          accepted_at: string | null
          account_created_by: string | null
          canceled_at: string | null
          collected_at: string | null
          collected_waiting_time: string | null
          collecting_driver: string | null
          collection_notes: string | null
          company_name: string | null
          cost: number | null
          courier_commission: number | null
          courier_commission_vat: number | null
          created_at: string | null
          customer_email: string | null
          customer_mobile: string | null
          customer_name: string | null
          delivered_at: string | null
          delivered_waiting_time: string | null
          delivering_driver: string | null
          delivery_address: string | null
          delivery_customer_name: string | null
          delivery_mobile_number: string | null
          delivery_notes: string | null
          distance: number | null
          driver_notes: string | null
          fuel_surcharge: number | null
          id: string
          insurance_protection: string | null
          invoice_id: string | null
          invoice_number: string | null
          job_created_by: string | null
          job_id: string | null
          luggage_count: number | null
          package_value: string | null
          passenger_count: number | null
          payment_method: string | null
          pickup_address: string | null
          pickup_customer_name: string | null
          pickup_mobile_number: string | null
          priority: string | null
          recipient_email: string | null
          reference: string | null
          return_job: boolean | null
          return_job_delivered_waiting_time: string | null
          rider_tips: number | null
          service_type: string | null
          status: string | null
          submitted_at: string | null
          tip_amount: number | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          accepted_at?: string | null
          account_created_by?: string | null
          canceled_at?: string | null
          collected_at?: string | null
          collected_waiting_time?: string | null
          collecting_driver?: string | null
          collection_notes?: string | null
          company_name?: string | null
          cost?: number | null
          courier_commission?: number | null
          courier_commission_vat?: number | null
          created_at?: string | null
          customer_email?: string | null
          customer_mobile?: string | null
          customer_name?: string | null
          delivered_at?: string | null
          delivered_waiting_time?: string | null
          delivering_driver?: string | null
          delivery_address?: string | null
          delivery_customer_name?: string | null
          delivery_mobile_number?: string | null
          delivery_notes?: string | null
          distance?: number | null
          driver_notes?: string | null
          fuel_surcharge?: number | null
          id?: string
          insurance_protection?: string | null
          invoice_id?: string | null
          invoice_number?: string | null
          job_created_by?: string | null
          job_id?: string | null
          luggage_count?: number | null
          package_value?: string | null
          passenger_count?: number | null
          payment_method?: string | null
          pickup_address?: string | null
          pickup_customer_name?: string | null
          pickup_mobile_number?: string | null
          priority?: string | null
          recipient_email?: string | null
          reference?: string | null
          return_job?: boolean | null
          return_job_delivered_waiting_time?: string | null
          rider_tips?: number | null
          service_type?: string | null
          status?: string | null
          submitted_at?: string | null
          tip_amount?: number | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          accepted_at?: string | null
          account_created_by?: string | null
          canceled_at?: string | null
          collected_at?: string | null
          collected_waiting_time?: string | null
          collecting_driver?: string | null
          collection_notes?: string | null
          company_name?: string | null
          cost?: number | null
          courier_commission?: number | null
          courier_commission_vat?: number | null
          created_at?: string | null
          customer_email?: string | null
          customer_mobile?: string | null
          customer_name?: string | null
          delivered_at?: string | null
          delivered_waiting_time?: string | null
          delivering_driver?: string | null
          delivery_address?: string | null
          delivery_customer_name?: string | null
          delivery_mobile_number?: string | null
          delivery_notes?: string | null
          distance?: number | null
          driver_notes?: string | null
          fuel_surcharge?: number | null
          id?: string
          insurance_protection?: string | null
          invoice_id?: string | null
          invoice_number?: string | null
          job_created_by?: string | null
          job_id?: string | null
          luggage_count?: number | null
          package_value?: string | null
          passenger_count?: number | null
          payment_method?: string | null
          pickup_address?: string | null
          pickup_customer_name?: string | null
          pickup_mobile_number?: string | null
          priority?: string | null
          recipient_email?: string | null
          reference?: string | null
          return_job?: boolean | null
          return_job_delivered_waiting_time?: string | null
          rider_tips?: number | null
          service_type?: string | null
          status?: string | null
          submitted_at?: string | null
          tip_amount?: number | null
          uploaded_at?: string | null
          uploaded_by?: string | null
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
