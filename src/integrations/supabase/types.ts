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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alert_episodes: {
        Row: {
          id: number
          started_ts: number
          last_updated_ts: number
          current_state: string
          status: string
          meta: Json | null
          buzzer_muted: boolean
          buzzer_status: string
          rpi_acknowledged_at: string | null
        }
        Insert: {
          id?: number
          started_ts: number
          last_updated_ts: number
          current_state: string
          status?: string
          meta?: Json | null
          buzzer_muted?: boolean
          buzzer_status?: string
          rpi_acknowledged_at?: string | null
        }
        Update: {
          id?: number
          started_ts?: number
          last_updated_ts?: number
          current_state?: string
          status?: string
          meta?: Json | null
          buzzer_muted?: boolean
          buzzer_status?: string
          rpi_acknowledged_at?: string | null
        }
      }
      alert_transitions: {
        Row: {
          id: number
          episode_id: number
          ts: number
          state: string
          meta: Json | null
        }
        Insert: {
          id?: number
          episode_id: number
          ts: number
          state: string
          meta?: Json | null
        }
        Update: {
          id?: number
          episode_id?: number
          ts?: number
          state?: string
          meta?: Json | null
        }
      }
      users: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          password: string
          role: 'security' | 'admin' | 'dean' | 'facility'
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email: string
          password: string
          role: 'security' | 'admin' | 'dean' | 'facility'
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          password?: string
          role?: 'security' | 'admin' | 'dean' | 'facility'
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
      }
      rooms: {
        Row: {
          id: string
          name: string
          status: 'normal' | 'warning' | 'alert' | 'error'
          last_updated: string
          occupants: number
          occupant_change: number
          created_at: string
        }
        Insert: {
          id: string
          name: string
          status: 'normal' | 'warning' | 'alert' | 'error'
          last_updated?: string
          occupants?: number
          occupant_change?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          status?: 'normal' | 'warning' | 'alert' | 'error'
          last_updated?: string
          occupants?: number
          occupant_change?: number
          created_at?: string
        }
      }
      sensor_readings: {
        Row: {
          id: number
          ts: number
          recorded_at: string | null
          gas_co: number | null
          gas_no2: number | null
          gas_o2: number | null
          temp_c: number | null
          temp_roc: number | null
          pm25: number | null
          detection_result: string | null
          created_at: string
        }
        Insert: {
          id?: number
          ts: number
          gas_co?: number | null
          gas_no2?: number | null
          gas_o2?: number | null
          temp_c?: number | null
          temp_roc?: number | null
          pm25?: number | null
          detection_result?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          ts?: number
          gas_co?: number | null
          gas_no2?: number | null
          gas_o2?: number | null
          temp_c?: number | null
          temp_roc?: number | null
          pm25?: number | null
          detection_result?: string | null
          created_at?: string
        }
      }
      sensors: {
        Row: {
          id: string
          room_id: string
          name: string
          type: 'temperature' | 'co' | 'no2' | 'o2' | 'pm25' | 'pm10'
          value: number
          unit: string
          status: 'normal' | 'warning' | 'critical'
          connected: boolean
          last_reading: string
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          name: string
          type: 'temperature' | 'co' | 'no2' | 'o2' | 'pm25' | 'pm10'
          value: number
          unit: string
          status: 'normal' | 'warning' | 'critical'
          connected?: boolean
          last_reading?: string
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          name?: string
          type?: 'temperature' | 'co' | 'no2' | 'o2' | 'pm25' | 'pm10'
          value?: number
          unit?: string
          status?: 'normal' | 'warning' | 'critical'
          connected?: boolean
          last_reading?: string
          created_at?: string
        }
      }
      event_logs: {
        Row: {
          id: string
          timestamp: string
          location: string
          event_type: 'normal' | 'warning' | 'alert' | 'error'
          room_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          timestamp?: string
          location: string
          event_type: 'normal' | 'warning' | 'alert' | 'error'
          room_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          timestamp?: string
          location?: string
          event_type?: 'normal' | 'warning' | 'alert' | 'error'
          room_id?: string | null
          created_at?: string
        }
      }
      camera_snapshots: {
        Row: {
          id: string
          room_id: string
          image_url: string
          captured_at: string
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          image_url: string
          captured_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          image_url?: string
          captured_at?: string
          created_at?: string
        }
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
