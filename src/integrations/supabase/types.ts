export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17";
  };
  public: {
    Tables: {
      attendance: {
        Row: {
          created_at: string;
          date: string;
          id: string;
          note: string | null;
          status: Database["public"]["Enums"]["attendance_status"];
          student_id: string;
        };
        Insert: {
          created_at?: string;
          date?: string;
          id?: string;
          note?: string | null;
          status?: Database["public"]["Enums"]["attendance_status"];
          student_id: string;
        };
        Update: {
          created_at?: string;
          date?: string;
          id?: string;
          note?: string | null;
          status?: Database["public"]["Enums"]["attendance_status"];
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      classes: {
        Row: {
          created_at: string;
          grade: string;
          id: string;
          name: string;
          school_year: string;
        };
        Insert: {
          created_at?: string;
          grade: string;
          id?: string;
          name: string;
          school_year?: string;
        };
        Update: {
          created_at?: string;
          grade?: string;
          id?: string;
          name?: string;
          school_year?: string;
        };
        Relationships: [];
      };
      grades: {
        Row: {
          created_at: string;
          created_by: string | null;
          graded_at: string;
          id: string;
          note: string | null;
          student_id: string;
          subject_id: string;
          value: number;
          weight: number;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          graded_at?: string;
          id?: string;
          note?: string | null;
          student_id: string;
          subject_id: string;
          value: number;
          weight?: number;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          graded_at?: string;
          id?: string;
          note?: string | null;
          student_id?: string;
          subject_id?: string;
          value?: number;
          weight?: number;
        };
        Relationships: [
          {
            foreignKeyName: "grades_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "grades_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "grades_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      notes: {
        Row: {
          content: string;
          created_at: string;
          created_by: string | null;
          id: string;
          student_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          student_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notes_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notes_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          class_id: string | null;
          created_at: string;
          full_name: string;
          id: string;
          user_id: string;
        };
        Insert: {
          class_id?: string | null;
          created_at?: string;
          full_name?: string;
          id?: string;
          user_id: string;
        };
        Update: {
          class_id?: string | null;
          created_at?: string;
          full_name?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
        ];
      };
      schedule: {
        Row: {
          class_id: string;
          created_at: string;
          end_time: string;
          id: string;
          room: string | null;
          start_time: string;
          subject_id: string;
          weekday: number;
        };
        Insert: {
          class_id: string;
          created_at?: string;
          end_time: string;
          id?: string;
          room?: string | null;
          start_time: string;
          subject_id: string;
          weekday: number;
        };
        Update: {
          class_id?: string;
          created_at?: string;
          end_time?: string;
          id?: string;
          room?: string | null;
          start_time?: string;
          subject_id?: string;
          weekday?: number;
        };
        Relationships: [
          {
            foreignKeyName: "schedule_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "schedule_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      students: {
        Row: {
          birth_date: string | null;
          class_id: string;
          created_at: string;
          full_name: string;
          id: string;
          profile_id: string | null;
        };
        Insert: {
          birth_date?: string | null;
          class_id: string;
          created_at?: string;
          full_name: string;
          id?: string;
          profile_id?: string | null;
        };
        Update: {
          birth_date?: string | null;
          class_id?: string;
          created_at?: string;
          full_name?: string;
          id?: string;
          profile_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "students_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      subjects: {
        Row: {
          class_id: string;
          color: string;
          created_at: string;
          id: string;
          name: string;
        };
        Insert: {
          class_id: string;
          color?: string;
          created_at?: string;
          id?: string;
          name: string;
        };
        Update: {
          class_id?: string;
          color?: string;
          created_at?: string;
          id?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subjects_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "teacher" | "student";
      attendance_status: "present" | "absent" | "late" | "excused";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["teacher", "student"],
      attendance_status: ["present", "absent", "late", "excused"],
    },
  },
} as const;
