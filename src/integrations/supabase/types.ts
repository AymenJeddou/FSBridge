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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_requests: {
        Row: {
          created_at: string
          decision_ia: string | null
          id: string
          motif: string | null
          pdf_url: string | null
          reviewed_at: string | null
          statut: Database["public"]["Enums"]["doc_status"]
          student_id: string
          type: Database["public"]["Enums"]["doc_type"]
        }
        Insert: {
          created_at?: string
          decision_ia?: string | null
          id?: string
          motif?: string | null
          pdf_url?: string | null
          reviewed_at?: string | null
          statut?: Database["public"]["Enums"]["doc_status"]
          student_id: string
          type: Database["public"]["Enums"]["doc_type"]
        }
        Update: {
          created_at?: string
          decision_ia?: string | null
          id?: string
          motif?: string | null
          pdf_url?: string | null
          reviewed_at?: string | null
          statut?: Database["public"]["Enums"]["doc_status"]
          student_id?: string
          type?: Database["public"]["Enums"]["doc_type"]
        }
        Relationships: [
          {
            foreignKeyName: "document_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          commentaire: string | null
          created_at: string
          date_evaluation: string
          id: string
          note: number
          poids: number
          student_id: string
          subject_id: string
          type: Database["public"]["Enums"]["grade_type"]
        }
        Insert: {
          commentaire?: string | null
          created_at?: string
          date_evaluation?: string
          id?: string
          note: number
          poids?: number
          student_id: string
          subject_id: string
          type: Database["public"]["Enums"]["grade_type"]
        }
        Update: {
          commentaire?: string | null
          created_at?: string
          date_evaluation?: string
          id?: string
          note?: number
          poids?: number
          student_id?: string
          subject_id?: string
          type?: Database["public"]["Enums"]["grade_type"]
        }
        Relationships: [
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          bureau: string | null
          cin: string | null
          created_at: string
          date_naissance: string | null
          email: string
          filiere: string | null
          id: string
          niveau: string | null
          nom: string
          prenom: string
          telephone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          bureau?: string | null
          cin?: string | null
          created_at?: string
          date_naissance?: string | null
          email?: string
          filiere?: string | null
          id?: string
          niveau?: string | null
          nom?: string
          prenom?: string
          telephone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          bureau?: string | null
          cin?: string | null
          created_at?: string
          date_naissance?: string | null
          email?: string
          filiere?: string | null
          id?: string
          niveau?: string | null
          nom?: string
          prenom?: string
          telephone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      schedule: {
        Row: {
          created_at: string
          filiere: string | null
          heure_debut: string
          heure_fin: string
          id: string
          jour: number
          niveau: string | null
          salle: string | null
          subject_id: string
          type_seance: string | null
        }
        Insert: {
          created_at?: string
          filiere?: string | null
          heure_debut: string
          heure_fin: string
          id?: string
          jour: number
          niveau?: string | null
          salle?: string | null
          subject_id: string
          type_seance?: string | null
        }
        Update: {
          created_at?: string
          filiere?: string | null
          heure_debut?: string
          heure_fin?: string
          id?: string
          jour?: number
          niveau?: string | null
          salle?: string | null
          subject_id?: string
          type_seance?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string | null
          coefficient: number
          created_at: string
          filiere: string | null
          id: string
          nom: string
          professor_id: string | null
          semestre: Database["public"]["Enums"]["semester"]
        }
        Insert: {
          code?: string | null
          coefficient?: number
          created_at?: string
          filiere?: string | null
          id?: string
          nom: string
          professor_id?: string | null
          semestre: Database["public"]["Enums"]["semester"]
        }
        Update: {
          code?: string | null
          coefficient?: number
          created_at?: string
          filiere?: string | null
          id?: string
          nom?: string
          professor_id?: string | null
          semestre?: Database["public"]["Enums"]["semester"]
        }
        Relationships: [
          {
            foreignKeyName: "subjects_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
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
      app_role: "admin" | "professor" | "student"
      doc_status: "en_attente" | "approuve" | "refuse"
      doc_type:
        | "attestation_inscription"
        | "releve_notes"
        | "attestation_presence"
        | "convention_stage"
      grade_type: "DS" | "Examen" | "TP" | "Projet"
      semester: "S1" | "S2" | "S3" | "S4" | "S5" | "S6"
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
      app_role: ["admin", "professor", "student"],
      doc_status: ["en_attente", "approuve", "refuse"],
      doc_type: [
        "attestation_inscription",
        "releve_notes",
        "attestation_presence",
        "convention_stage",
      ],
      grade_type: ["DS", "Examen", "TP", "Projet"],
      semester: ["S1", "S2", "S3", "S4", "S5", "S6"],
    },
  },
} as const
