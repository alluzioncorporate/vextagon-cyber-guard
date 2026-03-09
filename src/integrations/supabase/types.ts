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
      honey_tokens: {
        Row: {
          access_count: number
          access_metadata: Json | null
          accessed_at: string | null
          created_at: string
          id: string
          label: string
          status: string
          token: string
          user_id: string
        }
        Insert: {
          access_count?: number
          access_metadata?: Json | null
          accessed_at?: string | null
          created_at?: string
          id?: string
          label: string
          status?: string
          token: string
          user_id: string
        }
        Update: {
          access_count?: number
          access_metadata?: Json | null
          accessed_at?: string | null
          created_at?: string
          id?: string
          label?: string
          status?: string
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      leaked_data: {
        Row: {
          breach_date: string | null
          checked_at: string
          data_types: string[] | null
          email: string
          id: string
          password_hash: string | null
          source: string | null
          status: string
          user_id: string
        }
        Insert: {
          breach_date?: string | null
          checked_at?: string
          data_types?: string[] | null
          email: string
          id?: string
          password_hash?: string | null
          source?: string | null
          status?: string
          user_id: string
        }
        Update: {
          breach_date?: string | null
          checked_at?: string
          data_types?: string[] | null
          email?: string
          id?: string
          password_hash?: string | null
          source?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      phishing_campaigns: {
        Row: {
          campaign_name: string
          completed_at: string | null
          created_at: string
          email_template: string
          id: string
          scheduled_at: string | null
          stats: Json | null
          status: string
          target_emails: string[]
          user_id: string
        }
        Insert: {
          campaign_name: string
          completed_at?: string | null
          created_at?: string
          email_template: string
          id?: string
          scheduled_at?: string | null
          stats?: Json | null
          status?: string
          target_emails: string[]
          user_id: string
        }
        Update: {
          campaign_name?: string
          completed_at?: string | null
          created_at?: string
          email_template?: string
          id?: string
          scheduled_at?: string | null
          stats?: Json | null
          status?: string
          target_emails?: string[]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cpf: string | null
          created_at: string
          full_name: string | null
          id: string
          subscription_tier: string
          updated_at: string
          whatsapp_enabled: boolean
          whatsapp_number: string | null
        }
        Insert: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          subscription_tier?: string
          updated_at?: string
          whatsapp_enabled?: boolean
          whatsapp_number?: string | null
        }
        Update: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          subscription_tier?: string
          updated_at?: string
          whatsapp_enabled?: boolean
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      security_alerts: {
        Row: {
          alert_type: string
          created_at: string
          description: string | null
          domain: string | null
          id: string
          notified_whatsapp: boolean
          read: boolean
          severity: string
          title: string
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          description?: string | null
          domain?: string | null
          id?: string
          notified_whatsapp?: boolean
          read?: boolean
          severity?: string
          title: string
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          description?: string | null
          domain?: string | null
          id?: string
          notified_whatsapp?: boolean
          read?: boolean
          severity?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      security_scans: {
        Row: {
          created_at: string
          dns_data: Json | null
          domain: string
          domain_id: string
          headers_data: Json | null
          id: string
          ports_data: Json | null
          scan_type: string
          score: number | null
          shodan_data: Json | null
          ssl_data: Json | null
          user_id: string
          vulnerabilities: Json | null
        }
        Insert: {
          created_at?: string
          dns_data?: Json | null
          domain: string
          domain_id: string
          headers_data?: Json | null
          id?: string
          ports_data?: Json | null
          scan_type?: string
          score?: number | null
          shodan_data?: Json | null
          ssl_data?: Json | null
          user_id: string
          vulnerabilities?: Json | null
        }
        Update: {
          created_at?: string
          dns_data?: Json | null
          domain?: string
          domain_id?: string
          headers_data?: Json | null
          id?: string
          ports_data?: Json | null
          scan_type?: string
          score?: number | null
          shodan_data?: Json | null
          ssl_data?: Json | null
          user_id?: string
          vulnerabilities?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "security_scans_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "user_domains"
            referencedColumns: ["id"]
          },
        ]
      }
      server_monitoring: {
        Row: {
          agent_token: string
          cpu_usage: number | null
          created_at: string
          disk_usage: number | null
          hostname: string
          id: string
          install_expires_at: string | null
          ip_address: string
          last_seen: string
          open_ports: Json | null
          os_info: Json | null
          ram_usage: number | null
          security_updates: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_token: string
          cpu_usage?: number | null
          created_at?: string
          disk_usage?: number | null
          hostname: string
          id?: string
          install_expires_at?: string | null
          ip_address: string
          last_seen?: string
          open_ports?: Json | null
          os_info?: Json | null
          ram_usage?: number | null
          security_updates?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_token?: string
          cpu_usage?: number | null
          created_at?: string
          disk_usage?: number | null
          hostname?: string
          id?: string
          install_expires_at?: string | null
          ip_address?: string
          last_seen?: string
          open_ports?: Json | null
          os_info?: Json | null
          ram_usage?: number | null
          security_updates?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_domains: {
        Row: {
          added_at: string
          domain: string
          id: string
          last_scanned_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          added_at?: string
          domain: string
          id?: string
          last_scanned_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          added_at?: string
          domain?: string
          id?: string
          last_scanned_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_config: {
        Row: {
          connection_status: string
          created_at: string
          enabled: boolean
          id: string
          last_notification_at: string | null
          phone_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          connection_status?: string
          created_at?: string
          enabled?: boolean
          id?: string
          last_notification_at?: string | null
          phone_number: string
          updated_at?: string
          user_id: string
        }
        Update: {
          connection_status?: string
          created_at?: string
          enabled?: boolean
          id?: string
          last_notification_at?: string | null
          phone_number?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
