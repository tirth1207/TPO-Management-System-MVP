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
      applications: {
        Row: {
          cover_letter: string | null
          created_at: string
          id: string
          job_id: string
          status: Database["public"]["Enums"]["application_status"]
          student_user_id: string
          updated_at: string
        }
        Insert: {
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id: string
          status?: Database["public"]["Enums"]["application_status"]
          student_user_id: string
          updated_at?: string
        }
        Update: {
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id?: string
          status?: Database["public"]["Enums"]["application_status"]
          student_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_student_user_id_fkey"
            columns: ["student_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      company_profiles: {
        Row: {
          company_name: string
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at: string
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          company_name: string
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at?: string
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          company_name?: string
          contact_email?: string
          contact_name?: string
          contact_phone?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      faculty_profiles: {
        Row: {
          created_at: string
          department: string
          full_name: string
          phone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department: string
          full_name: string
          phone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string
          full_name?: string
          phone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "faculty_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      history: {
        Row: {
          action_type: Database["public"]["Enums"]["history_action"]
          actor_role: Database["public"]["Enums"]["tpo_role"]
          actor_user_id: string
          after: Json | null
          before: Json | null
          created_at: string
          id: number
          target_id: string
          target_table: string
        }
        Insert: {
          action_type: Database["public"]["Enums"]["history_action"]
          actor_role: Database["public"]["Enums"]["tpo_role"]
          actor_user_id: string
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: never
          target_id: string
          target_table: string
        }
        Update: {
          action_type?: Database["public"]["Enums"]["history_action"]
          actor_role?: Database["public"]["Enums"]["tpo_role"]
          actor_user_id?: string
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: never
          target_id?: string
          target_table?: string
        }
        Relationships: [
          {
            foreignKeyName: "history_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      jobs: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          approved_at: string | null
          approved_by: string | null
          company_user_id: string
          created_at: string
          ctc: number | null
          description: string
          id: string
          location: string | null
          rejected_reason: string | null
          state: Database["public"]["Enums"]["job_state"]
          title: string
          updated_at: string
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          company_user_id: string
          created_at?: string
          ctc?: number | null
          description: string
          id?: string
          location?: string | null
          rejected_reason?: string | null
          state?: Database["public"]["Enums"]["job_state"]
          title: string
          updated_at?: string
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          company_user_id?: string
          created_at?: string
          ctc?: number | null
          description?: string
          id?: string
          location?: string | null
          rejected_reason?: string | null
          state?: Database["public"]["Enums"]["job_state"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_user_id_fkey"
            columns: ["company_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          approved_at: string | null
          approved_by: string | null
          created_at: string
          profile_complete: boolean
          rejected_reason: string | null
          role: Database["public"]["Enums"]["tpo_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          profile_complete?: boolean
          rejected_reason?: string | null
          role: Database["public"]["Enums"]["tpo_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          profile_complete?: boolean
          rejected_reason?: string | null
          role?: Database["public"]["Enums"]["tpo_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      student_profiles: {
        Row: {
          created_at: string
          department: string
          full_name: string
          graduation_year: number
          phone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department: string
          full_name: string
          graduation_year: number
          phone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string
          full_name?: string
          graduation_year?: number
          phone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
      placement_comparison_records: {
        Row: {
          academic_year: number
          avg_ctc: number | null
          companies_hiring: number
          company_name: string | null
          company_user_id: string | null
          created_at: string
          created_by: string
          department: string | null
          faculty_user_id: string | null
          eligible_students: number
          highest_ctc: number | null
          id: string
          lowest_ctc: number | null
          median_ctc: number | null
          notes: string | null
          offers: number
          placed_students: number
          scope_type: string
          total_students: number
          updated_at: string
        }
        Insert: {
          academic_year: number
          avg_ctc?: number | null
          companies_hiring?: number
          company_name?: string | null
          company_user_id?: string | null
          created_at?: string
          created_by: string
          department?: string | null
          faculty_user_id?: string | null
          eligible_students?: number
          highest_ctc?: number | null
          id?: string
          lowest_ctc?: number | null
          median_ctc?: number | null
          notes?: string | null
          offers?: number
          placed_students?: number
          scope_type: string
          total_students?: number
          updated_at?: string
        }
        Update: {
          academic_year?: number
          avg_ctc?: number | null
          companies_hiring?: number
          company_name?: string | null
          company_user_id?: string | null
          created_at?: string
          created_by?: string
          faculty_user_id?: string | null
          department?: string | null
          eligible_students?: number
          highest_ctc?: number | null
          id?: string
          lowest_ctc?: number | null
          median_ctc?: number | null
          notes?: string | null
          offers?: number
          placed_students?: number
          scope_type?: string
          total_students?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "placement_comparison_records_company_user_id_fkey"
            columns: ["company_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "placement_comparison_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    Views: {
      [_ in never]: never
    }
    Functions: {
      tpo_assert_valid_application_transition: {
        Args: {
          p_new: Database["public"]["Enums"]["application_status"]
          p_old: Database["public"]["Enums"]["application_status"]
        }
        Returns: undefined
      }
      tpo_assert_valid_approval_transition: {
        Args: {
          p_new: Database["public"]["Enums"]["approval_status"]
          p_old: Database["public"]["Enums"]["approval_status"]
        }
        Returns: undefined
      }
      tpo_audit_write: {
        Args: {
          p_action_type: Database["public"]["Enums"]["history_action"]
          p_after: Json
          p_before: Json
          p_target_id: string
          p_target_table: string
        }
        Returns: undefined
      }
      tpo_is_admin_or_manager: { Args: { p_user_id: string }; Returns: boolean }
      tpo_is_approved: { Args: { p_user_id: string }; Returns: boolean }
      tpo_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["tpo_role"]
      }
    }
    Enums: {
      application_status:
        | "applied"
        | "shortlisted"
        | "rejected"
        | "interview_scheduled"
        | "offer_made"
        | "offer_accepted"
        | "offer_rejected"
      approval_status:
        | "draft"
        | "email_verified"
        | "pending_approval"
        | "approved"
        | "rejected"
      history_action:
        | "profile_status_change"
        | "job_status_change"
        | "application_status_change"
        | "profile_update"
        | "job_update"
        | "application_update"
      job_state: "open" | "closed"
      tpo_role: "student" | "faculty" | "company" | "manager" | "admin"
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
      application_status: [
        "applied",
        "shortlisted",
        "rejected",
        "interview_scheduled",
        "offer_made",
        "offer_accepted",
        "offer_rejected",
      ],
      approval_status: [
        "draft",
        "email_verified",
        "pending_approval",
        "approved",
        "rejected",
      ],
      history_action: [
        "profile_status_change",
        "job_status_change",
        "application_status_change",
        "profile_update",
        "job_update",
        "application_update",
      ],
      job_state: ["open", "closed"],
      tpo_role: ["student", "faculty", "company", "manager", "admin"],
    },
  },
} as const
