export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      academic_years: {
        Row: {
          created_at: string;
          ends_on: string;
          id: string;
          is_active: boolean;
          label: string;
          school_id: string;
          starts_on: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          ends_on: string;
          id?: string;
          is_active?: boolean;
          label: string;
          school_id: string;
          starts_on: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          ends_on?: string;
          id?: string;
          is_active?: boolean;
          label?: string;
          school_id?: string;
          starts_on?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "academic_years_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_generation_runs: {
        Row: {
          action: string;
          class_id: string;
          context_fingerprint: string | null;
          created_at: string;
          error_code: string | null;
          error_message: string | null;
          finished_at: string | null;
          id: string;
          lesson_id: string;
          model_key: string;
          output_material_id: string | null;
          provider_key: string;
          requested_by: string;
          school_id: string;
          started_at: string | null;
          status: Database["public"]["Enums"]["ai_generation_status"];
          updated_at: string;
        };
        Insert: {
          action: string;
          class_id: string;
          context_fingerprint?: string | null;
          created_at?: string;
          error_code?: string | null;
          error_message?: string | null;
          finished_at?: string | null;
          id?: string;
          lesson_id: string;
          model_key: string;
          output_material_id?: string | null;
          provider_key: string;
          requested_by?: string;
          school_id: string;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["ai_generation_status"];
          updated_at?: string;
        };
        Update: {
          action?: string;
          class_id?: string;
          context_fingerprint?: string | null;
          created_at?: string;
          error_code?: string | null;
          error_message?: string | null;
          finished_at?: string | null;
          id?: string;
          lesson_id?: string;
          model_key?: string;
          output_material_id?: string | null;
          provider_key?: string;
          requested_by?: string;
          school_id?: string;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["ai_generation_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_generation_class_school_fk";
            columns: ["school_id", "class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["school_id", "id"];
          },
          {
            foreignKeyName: "ai_generation_lesson_school_fk";
            columns: ["school_id", "lesson_id"];
            isOneToOne: false;
            referencedRelation: "lesson_instances";
            referencedColumns: ["school_id", "id"];
          },
          {
            foreignKeyName: "ai_generation_runs_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_generation_runs_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lesson_instances";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_generation_runs_output_material_id_fkey";
            columns: ["output_material_id"];
            isOneToOne: false;
            referencedRelation: "lesson_materials";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_generation_runs_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      art_education_theme_catalog: {
        Row: {
          activity_outline: string[];
          created_at: string;
          differentiation_advanced: string | null;
          differentiation_easy: string | null;
          grade: number;
          id: string;
          is_active: boolean;
          learning_goals: string[];
          materials: string[];
          outcome_codes: string[];
          reflection_prompt: string | null;
          sort_order: number;
          source_kind: string;
          suggested_minutes: number;
          summary: string;
          title: string;
        };
        Insert: {
          activity_outline?: string[];
          created_at?: string;
          differentiation_advanced?: string | null;
          differentiation_easy?: string | null;
          grade: number;
          id?: string;
          is_active?: boolean;
          learning_goals?: string[];
          materials?: string[];
          outcome_codes?: string[];
          reflection_prompt?: string | null;
          sort_order?: number;
          source_kind?: string;
          suggested_minutes?: number;
          summary: string;
          title: string;
        };
        Update: {
          activity_outline?: string[];
          created_at?: string;
          differentiation_advanced?: string | null;
          differentiation_easy?: string | null;
          grade?: number;
          id?: string;
          is_active?: boolean;
          learning_goals?: string[];
          materials?: string[];
          outcome_codes?: string[];
          reflection_prompt?: string | null;
          sort_order?: number;
          source_kind?: string;
          suggested_minutes?: number;
          summary?: string;
          title?: string;
        };
        Relationships: [];
      };
      calendar_events: {
        Row: {
          academic_year_id: string;
          affects_schedule: boolean;
          all_day: boolean;
          blocks_lessons: boolean;
          class_id: string | null;
          created_at: string;
          created_by: string;
          ends_at: string;
          id: string;
          kind: Database["public"]["Enums"]["calendar_event_kind"];
          note: string | null;
          recurrence_rule: string | null;
          school_id: string;
          scope: Database["public"]["Enums"]["calendar_event_scope"];
          source: string | null;
          starts_at: string;
          student_alias_id: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          academic_year_id: string;
          affects_schedule?: boolean;
          all_day?: boolean;
          blocks_lessons?: boolean;
          class_id?: string | null;
          created_at?: string;
          created_by: string;
          ends_at: string;
          id?: string;
          kind?: Database["public"]["Enums"]["calendar_event_kind"];
          note?: string | null;
          recurrence_rule?: string | null;
          school_id: string;
          scope?: Database["public"]["Enums"]["calendar_event_scope"];
          source?: string | null;
          starts_at: string;
          student_alias_id?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          academic_year_id?: string;
          affects_schedule?: boolean;
          all_day?: boolean;
          blocks_lessons?: boolean;
          class_id?: string | null;
          created_at?: string;
          created_by?: string;
          ends_at?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["calendar_event_kind"];
          note?: string | null;
          recurrence_rule?: string | null;
          school_id?: string;
          scope?: Database["public"]["Enums"]["calendar_event_scope"];
          source?: string | null;
          starts_at?: string;
          student_alias_id?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "calendar_events_academic_year_id_fkey";
            columns: ["academic_year_id"];
            isOneToOne: false;
            referencedRelation: "academic_years";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "calendar_events_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "calendar_events_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "calendar_events_student_alias_id_fkey";
            columns: ["student_alias_id"];
            isOneToOne: false;
            referencedRelation: "student_aliases";
            referencedColumns: ["id"];
          },
        ];
      };
      class_curriculum_selections: {
        Row: {
          academic_year_id: string;
          class_id: string;
          curriculum_version_id: string;
          id: string;
          school_curriculum_version_id: string | null;
          school_id: string;
          selected_at: string;
          selected_by: string | null;
        };
        Insert: {
          academic_year_id: string;
          class_id: string;
          curriculum_version_id: string;
          id?: string;
          school_curriculum_version_id?: string | null;
          school_id: string;
          selected_at?: string;
          selected_by?: string | null;
        };
        Update: {
          academic_year_id?: string;
          class_id?: string;
          curriculum_version_id?: string;
          id?: string;
          school_curriculum_version_id?: string | null;
          school_id?: string;
          selected_at?: string;
          selected_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "class_curriculum_class_same_school";
            columns: ["class_id", "school_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id", "school_id"];
          },
          {
            foreignKeyName: "class_curriculum_school_version_same_school";
            columns: ["school_curriculum_version_id", "school_id"];
            isOneToOne: false;
            referencedRelation: "school_curriculum_versions";
            referencedColumns: ["id", "school_id"];
          },
          {
            foreignKeyName: "class_curriculum_selections_curriculum_version_id_fkey";
            columns: ["curriculum_version_id"];
            isOneToOne: false;
            referencedRelation: "curriculum_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "class_curriculum_selections_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "class_curriculum_year_same_school";
            columns: ["academic_year_id", "school_id"];
            isOneToOne: false;
            referencedRelation: "academic_years";
            referencedColumns: ["id", "school_id"];
          },
        ];
      };
      class_memberships: {
        Row: {
          class_id: string;
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["class_role"];
          user_id: string;
        };
        Insert: {
          class_id: string;
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["class_role"];
          user_id: string;
        };
        Update: {
          class_id?: string;
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["class_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "class_memberships_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
        ];
      };
      classes: {
        Row: {
          academic_year_id: string;
          created_at: string;
          grade: number;
          id: string;
          name: string;
          school_id: string;
          updated_at: string;
        };
        Insert: {
          academic_year_id: string;
          created_at?: string;
          grade: number;
          id?: string;
          name: string;
          school_id: string;
          updated_at?: string;
        };
        Update: {
          academic_year_id?: string;
          created_at?: string;
          grade?: number;
          id?: string;
          name?: string;
          school_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "classes_academic_year_same_school";
            columns: ["academic_year_id", "school_id"];
            isOneToOne: false;
            referencedRelation: "academic_years";
            referencedColumns: ["id", "school_id"];
          },
          {
            foreignKeyName: "classes_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      curriculum_areas: {
        Row: {
          code: string | null;
          created_at: string;
          curriculum_version_id: string;
          id: string;
          name: string;
          sort_order: number;
          source_id: string | null;
        };
        Insert: {
          code?: string | null;
          created_at?: string;
          curriculum_version_id: string;
          id?: string;
          name: string;
          sort_order?: number;
          source_id?: string | null;
        };
        Update: {
          code?: string | null;
          created_at?: string;
          curriculum_version_id?: string;
          id?: string;
          name?: string;
          sort_order?: number;
          source_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "curriculum_areas_curriculum_version_id_fkey";
            columns: ["curriculum_version_id"];
            isOneToOne: false;
            referencedRelation: "curriculum_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "curriculum_areas_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "curriculum_sources";
            referencedColumns: ["id"];
          },
        ];
      };
      curriculum_dependencies: {
        Row: {
          created_at: string;
          curriculum_version_id: string;
          dependency_type: Database["public"]["Enums"]["curriculum_dependency_type"];
          from_outcome_id: string;
          id: string;
          rationale: string | null;
          source_id: string | null;
          to_outcome_id: string;
        };
        Insert: {
          created_at?: string;
          curriculum_version_id: string;
          dependency_type: Database["public"]["Enums"]["curriculum_dependency_type"];
          from_outcome_id: string;
          id?: string;
          rationale?: string | null;
          source_id?: string | null;
          to_outcome_id: string;
        };
        Update: {
          created_at?: string;
          curriculum_version_id?: string;
          dependency_type?: Database["public"]["Enums"]["curriculum_dependency_type"];
          from_outcome_id?: string;
          id?: string;
          rationale?: string | null;
          source_id?: string | null;
          to_outcome_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "curriculum_dependencies_curriculum_version_id_fkey";
            columns: ["curriculum_version_id"];
            isOneToOne: false;
            referencedRelation: "curriculum_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "curriculum_dependencies_from_outcome_id_fkey";
            columns: ["from_outcome_id"];
            isOneToOne: false;
            referencedRelation: "curriculum_outcomes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "curriculum_dependencies_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "curriculum_sources";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "curriculum_dependencies_to_outcome_id_fkey";
            columns: ["to_outcome_id"];
            isOneToOne: false;
            referencedRelation: "curriculum_outcomes";
            referencedColumns: ["id"];
          },
        ];
      };
      curriculum_outcomes: {
        Row: {
          created_at: string;
          curriculum_version_id: string;
          description: string | null;
          id: string;
          metadata: Json;
          minimum_level: string | null;
          official_code: string | null;
          origin: Database["public"]["Enums"]["curriculum_origin"];
          period_label: string | null;
          sort_order: number;
          source_id: string;
          source_locator: string | null;
          subject_id: string;
          target_grade: number | null;
          title: string;
          topic_id: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          curriculum_version_id: string;
          description?: string | null;
          id?: string;
          metadata?: Json;
          minimum_level?: string | null;
          official_code?: string | null;
          origin?: Database["public"]["Enums"]["curriculum_origin"];
          period_label?: string | null;
          sort_order?: number;
          source_id: string;
          source_locator?: string | null;
          subject_id: string;
          target_grade?: number | null;
          title: string;
          topic_id?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          curriculum_version_id?: string;
          description?: string | null;
          id?: string;
          metadata?: Json;
          minimum_level?: string | null;
          official_code?: string | null;
          origin?: Database["public"]["Enums"]["curriculum_origin"];
          period_label?: string | null;
          sort_order?: number;
          source_id?: string;
          source_locator?: string | null;
          subject_id?: string;
          target_grade?: number | null;
          title?: string;
          topic_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "curriculum_outcomes_curriculum_version_id_fkey";
            columns: ["curriculum_version_id"];
            isOneToOne: false;
            referencedRelation: "curriculum_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "curriculum_outcomes_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "curriculum_sources";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "curriculum_outcomes_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "curriculum_subjects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "curriculum_outcomes_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "curriculum_topics";
            referencedColumns: ["id"];
          },
        ];
      };
      curriculum_sources: {
        Row: {
          authority: string;
          checksum: string | null;
          created_at: string;
          id: string;
          license_note: string | null;
          metadata: Json;
          origin: Database["public"]["Enums"]["curriculum_origin"];
          published_on: string | null;
          retrieved_at: string;
          source_url: string;
          source_version: string | null;
          title: string;
        };
        Insert: {
          authority: string;
          checksum?: string | null;
          created_at?: string;
          id?: string;
          license_note?: string | null;
          metadata?: Json;
          origin?: Database["public"]["Enums"]["curriculum_origin"];
          published_on?: string | null;
          retrieved_at?: string;
          source_url: string;
          source_version?: string | null;
          title: string;
        };
        Update: {
          authority?: string;
          checksum?: string | null;
          created_at?: string;
          id?: string;
          license_note?: string | null;
          metadata?: Json;
          origin?: Database["public"]["Enums"]["curriculum_origin"];
          published_on?: string | null;
          retrieved_at?: string;
          source_url?: string;
          source_version?: string | null;
          title?: string;
        };
        Relationships: [];
      };
      curriculum_subjects: {
        Row: {
          area_id: string | null;
          code: string | null;
          created_at: string;
          curriculum_version_id: string;
          grade_from: number;
          grade_to: number;
          id: string;
          name: string;
          sort_order: number;
          source_id: string | null;
        };
        Insert: {
          area_id?: string | null;
          code?: string | null;
          created_at?: string;
          curriculum_version_id: string;
          grade_from?: number;
          grade_to?: number;
          id?: string;
          name: string;
          sort_order?: number;
          source_id?: string | null;
        };
        Update: {
          area_id?: string | null;
          code?: string | null;
          created_at?: string;
          curriculum_version_id?: string;
          grade_from?: number;
          grade_to?: number;
          id?: string;
          name?: string;
          sort_order?: number;
          source_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "curriculum_subjects_area_id_fkey";
            columns: ["area_id"];
            isOneToOne: false;
            referencedRelation: "curriculum_areas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "curriculum_subjects_curriculum_version_id_fkey";
            columns: ["curriculum_version_id"];
            isOneToOne: false;
            referencedRelation: "curriculum_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "curriculum_subjects_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "curriculum_sources";
            referencedColumns: ["id"];
          },
        ];
      };
      curriculum_topics: {
        Row: {
          code: string | null;
          created_at: string;
          curriculum_version_id: string;
          description: string | null;
          grade_from: number | null;
          grade_to: number | null;
          id: string;
          name: string;
          parent_topic_id: string | null;
          sort_order: number;
          source_id: string | null;
          subject_id: string;
        };
        Insert: {
          code?: string | null;
          created_at?: string;
          curriculum_version_id: string;
          description?: string | null;
          grade_from?: number | null;
          grade_to?: number | null;
          id?: string;
          name: string;
          parent_topic_id?: string | null;
          sort_order?: number;
          source_id?: string | null;
          subject_id: string;
        };
        Update: {
          code?: string | null;
          created_at?: string;
          curriculum_version_id?: string;
          description?: string | null;
          grade_from?: number | null;
          grade_to?: number | null;
          id?: string;
          name?: string;
          parent_topic_id?: string | null;
          sort_order?: number;
          source_id?: string | null;
          subject_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "curriculum_topics_curriculum_version_id_fkey";
            columns: ["curriculum_version_id"];
            isOneToOne: false;
            referencedRelation: "curriculum_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "curriculum_topics_parent_topic_id_fkey";
            columns: ["parent_topic_id"];
            isOneToOne: false;
            referencedRelation: "curriculum_topics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "curriculum_topics_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "curriculum_sources";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "curriculum_topics_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "curriculum_subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      curriculum_versions: {
        Row: {
          code: string;
          created_at: string;
          description: string | null;
          id: string;
          metadata: Json;
          name: string;
          origin: Database["public"]["Enums"]["curriculum_origin"];
          source_id: string | null;
          status: Database["public"]["Enums"]["curriculum_status"];
          updated_at: string;
          valid_from: string | null;
          valid_to: string | null;
        };
        Insert: {
          code: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          metadata?: Json;
          name: string;
          origin?: Database["public"]["Enums"]["curriculum_origin"];
          source_id?: string | null;
          status?: Database["public"]["Enums"]["curriculum_status"];
          updated_at?: string;
          valid_from?: string | null;
          valid_to?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          metadata?: Json;
          name?: string;
          origin?: Database["public"]["Enums"]["curriculum_origin"];
          source_id?: string | null;
          status?: Database["public"]["Enums"]["curriculum_status"];
          updated_at?: string;
          valid_from?: string | null;
          valid_to?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "curriculum_versions_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "curriculum_sources";
            referencedColumns: ["id"];
          },
        ];
      };
      lesson_instances: {
        Row: {
          academic_year_id: string;
          class_id: string;
          created_at: string;
          created_by: string;
          curriculum_subject_id: string | null;
          curriculum_topic_id: string | null;
          ends_at: string | null;
          id: string;
          lesson_date: string;
          moved_from_lesson_id: string | null;
          school_id: string;
          slot_order: number;
          source_calendar_event_id: string | null;
          starts_at: string | null;
          status: Database["public"]["Enums"]["lesson_status"];
          subject_name: string;
          teacher_note: string | null;
          timetable_slot_id: string | null;
          title: string | null;
          topic: string | null;
          updated_at: string;
        };
        Insert: {
          academic_year_id: string;
          class_id: string;
          created_at?: string;
          created_by?: string;
          curriculum_subject_id?: string | null;
          curriculum_topic_id?: string | null;
          ends_at?: string | null;
          id?: string;
          lesson_date: string;
          moved_from_lesson_id?: string | null;
          school_id: string;
          slot_order: number;
          source_calendar_event_id?: string | null;
          starts_at?: string | null;
          status?: Database["public"]["Enums"]["lesson_status"];
          subject_name: string;
          teacher_note?: string | null;
          timetable_slot_id?: string | null;
          title?: string | null;
          topic?: string | null;
          updated_at?: string;
        };
        Update: {
          academic_year_id?: string;
          class_id?: string;
          created_at?: string;
          created_by?: string;
          curriculum_subject_id?: string | null;
          curriculum_topic_id?: string | null;
          ends_at?: string | null;
          id?: string;
          lesson_date?: string;
          moved_from_lesson_id?: string | null;
          school_id?: string;
          slot_order?: number;
          source_calendar_event_id?: string | null;
          starts_at?: string | null;
          status?: Database["public"]["Enums"]["lesson_status"];
          subject_name?: string;
          teacher_note?: string | null;
          timetable_slot_id?: string | null;
          title?: string | null;
          topic?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lesson_class_school_fk";
            columns: ["school_id", "class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["school_id", "id"];
          },
          {
            foreignKeyName: "lesson_instances_academic_year_id_fkey";
            columns: ["academic_year_id"];
            isOneToOne: false;
            referencedRelation: "academic_years";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lesson_instances_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lesson_instances_curriculum_subject_id_fkey";
            columns: ["curriculum_subject_id"];
            isOneToOne: false;
            referencedRelation: "curriculum_subjects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lesson_instances_curriculum_topic_id_fkey";
            columns: ["curriculum_topic_id"];
            isOneToOne: false;
            referencedRelation: "curriculum_topics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lesson_instances_moved_from_lesson_id_fkey";
            columns: ["moved_from_lesson_id"];
            isOneToOne: false;
            referencedRelation: "lesson_instances";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lesson_instances_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lesson_instances_source_calendar_event_id_fkey";
            columns: ["source_calendar_event_id"];
            isOneToOne: false;
            referencedRelation: "calendar_events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lesson_instances_timetable_slot_id_fkey";
            columns: ["timetable_slot_id"];
            isOneToOne: false;
            referencedRelation: "timetable_slots";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lesson_year_school_fk";
            columns: ["school_id", "academic_year_id"];
            isOneToOne: false;
            referencedRelation: "academic_years";
            referencedColumns: ["school_id", "id"];
          },
        ];
      };
      lesson_materials: {
        Row: {
          class_id: string;
          content: Json;
          created_at: string;
          created_by: string;
          difficulty: string | null;
          export_status: string;
          id: string;
          kind: Database["public"]["Enums"]["material_kind"];
          lesson_id: string;
          school_id: string;
          target_student_alias_id: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          class_id: string;
          content?: Json;
          created_at?: string;
          created_by?: string;
          difficulty?: string | null;
          export_status?: string;
          id?: string;
          kind: Database["public"]["Enums"]["material_kind"];
          lesson_id: string;
          school_id: string;
          target_student_alias_id?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          class_id?: string;
          content?: Json;
          created_at?: string;
          created_by?: string;
          difficulty?: string | null;
          export_status?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["material_kind"];
          lesson_id?: string;
          school_id?: string;
          target_student_alias_id?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lesson_materials_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lesson_materials_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lesson_instances";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lesson_materials_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lesson_materials_target_student_alias_id_fkey";
            columns: ["target_student_alias_id"];
            isOneToOne: false;
            referencedRelation: "student_aliases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "material_class_school_fk";
            columns: ["school_id", "class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["school_id", "id"];
          },
          {
            foreignKeyName: "material_lesson_school_fk";
            columns: ["school_id", "lesson_id"];
            isOneToOne: false;
            referencedRelation: "lesson_instances";
            referencedColumns: ["school_id", "id"];
          },
        ];
      };
      lesson_preparations: {
        Row: {
          board_notes: string | null;
          class_id: string;
          created_at: string;
          created_by: string;
          homework: string | null;
          id: string;
          learning_goals: Json;
          lesson_id: string;
          objective: string | null;
          reflection: string | null;
          school_id: string;
          teacher_notes: string | null;
          timeline: Json;
          updated_at: string;
          version: number;
        };
        Insert: {
          board_notes?: string | null;
          class_id: string;
          created_at?: string;
          created_by?: string;
          homework?: string | null;
          id?: string;
          learning_goals?: Json;
          lesson_id: string;
          objective?: string | null;
          reflection?: string | null;
          school_id: string;
          teacher_notes?: string | null;
          timeline?: Json;
          updated_at?: string;
          version?: number;
        };
        Update: {
          board_notes?: string | null;
          class_id?: string;
          created_at?: string;
          created_by?: string;
          homework?: string | null;
          id?: string;
          learning_goals?: Json;
          lesson_id?: string;
          objective?: string | null;
          reflection?: string | null;
          school_id?: string;
          teacher_notes?: string | null;
          timeline?: Json;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "lesson_preparations_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lesson_preparations_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lesson_instances";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lesson_preparations_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "preparation_class_school_fk";
            columns: ["school_id", "class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["school_id", "id"];
          },
          {
            foreignKeyName: "preparation_lesson_school_fk";
            columns: ["school_id", "lesson_id"];
            isOneToOne: false;
            referencedRelation: "lesson_instances";
            referencedColumns: ["school_id", "id"];
          },
        ];
      };
      lesson_progress: {
        Row: {
          class_id: string;
          completed_summary: string | null;
          confirmed_at: string;
          confirmed_by: string;
          created_at: string;
          id: string;
          lesson_id: string;
          next_lesson_note: string | null;
          school_id: string;
          state: Database["public"]["Enums"]["lesson_progress_state"];
          teacher_reflection: string | null;
          unfinished_summary: string | null;
          updated_at: string;
        };
        Insert: {
          class_id: string;
          completed_summary?: string | null;
          confirmed_at?: string;
          confirmed_by?: string;
          created_at?: string;
          id?: string;
          lesson_id: string;
          next_lesson_note?: string | null;
          school_id: string;
          state?: Database["public"]["Enums"]["lesson_progress_state"];
          teacher_reflection?: string | null;
          unfinished_summary?: string | null;
          updated_at?: string;
        };
        Update: {
          class_id?: string;
          completed_summary?: string | null;
          confirmed_at?: string;
          confirmed_by?: string;
          created_at?: string;
          id?: string;
          lesson_id?: string;
          next_lesson_note?: string | null;
          school_id?: string;
          state?: Database["public"]["Enums"]["lesson_progress_state"];
          teacher_reflection?: string | null;
          unfinished_summary?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lesson_progress_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lesson_progress_class_school_fk";
            columns: ["school_id", "class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["school_id", "id"];
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: true;
            referencedRelation: "lesson_instances";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lesson_progress_lesson_school_fk";
            columns: ["school_id", "lesson_id"];
            isOneToOne: false;
            referencedRelation: "lesson_instances";
            referencedColumns: ["school_id", "id"];
          },
          {
            foreignKeyName: "lesson_progress_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      pseudonym_catalog: {
        Row: {
          code: string;
          created_at: string;
          display_name: string;
          emoji: string | null;
          id: string;
          is_active: boolean;
          set_key: string;
          sort_order: number;
        };
        Insert: {
          code: string;
          created_at?: string;
          display_name: string;
          emoji?: string | null;
          id?: string;
          is_active?: boolean;
          set_key: string;
          sort_order?: number;
        };
        Update: {
          code?: string;
          created_at?: string;
          display_name?: string;
          emoji?: string | null;
          id?: string;
          is_active?: boolean;
          set_key?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      school_curriculum_mappings: {
        Row: {
          created_at: string;
          id: string;
          metadata: Json;
          official_outcome_id: string | null;
          school_code: string | null;
          school_curriculum_version_id: string;
          school_description: string | null;
          school_title: string;
          sort_order: number;
          target_grade: number | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          metadata?: Json;
          official_outcome_id?: string | null;
          school_code?: string | null;
          school_curriculum_version_id: string;
          school_description?: string | null;
          school_title: string;
          sort_order?: number;
          target_grade?: number | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          metadata?: Json;
          official_outcome_id?: string | null;
          school_code?: string | null;
          school_curriculum_version_id?: string;
          school_description?: string | null;
          school_title?: string;
          sort_order?: number;
          target_grade?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "school_curriculum_mappings_official_outcome_id_fkey";
            columns: ["official_outcome_id"];
            isOneToOne: false;
            referencedRelation: "curriculum_outcomes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "school_curriculum_mappings_school_curriculum_version_id_fkey";
            columns: ["school_curriculum_version_id"];
            isOneToOne: false;
            referencedRelation: "school_curriculum_versions";
            referencedColumns: ["id"];
          },
        ];
      };
      school_curriculum_versions: {
        Row: {
          academic_year_id: string;
          base_curriculum_version_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          name: string;
          school_id: string;
          source_reference: string | null;
          status: Database["public"]["Enums"]["curriculum_status"];
          updated_at: string;
        };
        Insert: {
          academic_year_id: string;
          base_curriculum_version_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name: string;
          school_id: string;
          source_reference?: string | null;
          status?: Database["public"]["Enums"]["curriculum_status"];
          updated_at?: string;
        };
        Update: {
          academic_year_id?: string;
          base_curriculum_version_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name?: string;
          school_id?: string;
          source_reference?: string | null;
          status?: Database["public"]["Enums"]["curriculum_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "school_curriculum_versions_base_curriculum_version_id_fkey";
            columns: ["base_curriculum_version_id"];
            isOneToOne: false;
            referencedRelation: "curriculum_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "school_curriculum_versions_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "school_curriculum_year_same_school";
            columns: ["academic_year_id", "school_id"];
            isOneToOne: false;
            referencedRelation: "academic_years";
            referencedColumns: ["id", "school_id"];
          },
        ];
      };
      school_memberships: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["school_role"];
          school_id: string;
          status: Database["public"]["Enums"]["membership_status"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["school_role"];
          school_id: string;
          status?: Database["public"]["Enums"]["membership_status"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["school_role"];
          school_id?: string;
          status?: Database["public"]["Enums"]["membership_status"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "school_memberships_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      schools: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      special_education_audit_log: {
        Row: {
          action: string;
          actor_user_id: string;
          case_id: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: string;
          school_id: string;
        };
        Insert: {
          action: string;
          actor_user_id: string;
          case_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
          school_id: string;
        };
        Update: {
          action?: string;
          actor_user_id?: string;
          case_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          id?: string;
          school_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "special_education_audit_log_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "special_education_cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "special_education_audit_log_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      special_education_case_support_areas: {
        Row: {
          area_code: string;
          case_id: string;
          created_at: string;
          created_by: string;
          note: string | null;
          school_id: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          area_code: string;
          case_id: string;
          created_at?: string;
          created_by: string;
          note?: string | null;
          school_id: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          area_code?: string;
          case_id?: string;
          created_at?: string;
          created_by?: string;
          note?: string | null;
          school_id?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "special_education_case_support_areas_area_code_fkey";
            columns: ["area_code"];
            isOneToOne: false;
            referencedRelation: "special_education_support_area_catalog";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "special_education_case_support_areas_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "special_education_cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "special_education_case_support_areas_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      special_education_cases: {
        Row: {
          class_id: string;
          created_at: string;
          created_by: string;
          focus_summary: string | null;
          id: string;
          school_id: string;
          status: string;
          student_alias_id: string;
          updated_at: string;
        };
        Insert: {
          class_id: string;
          created_at?: string;
          created_by: string;
          focus_summary?: string | null;
          id?: string;
          school_id: string;
          status?: string;
          student_alias_id: string;
          updated_at?: string;
        };
        Update: {
          class_id?: string;
          created_at?: string;
          created_by?: string;
          focus_summary?: string | null;
          id?: string;
          school_id?: string;
          status?: string;
          student_alias_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "special_education_cases_class_id_school_id_fkey";
            columns: ["class_id", "school_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id", "school_id"];
          },
          {
            foreignKeyName: "special_education_cases_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "special_education_cases_student_alias_id_fkey";
            columns: ["student_alias_id"];
            isOneToOne: false;
            referencedRelation: "student_aliases";
            referencedColumns: ["id"];
          },
        ];
      };
      special_education_followups: {
        Row: {
          case_id: string;
          completed_at: string | null;
          created_at: string;
          created_by: string;
          due_on: string;
          id: string;
          note: string;
          school_id: string;
        };
        Insert: {
          case_id: string;
          completed_at?: string | null;
          created_at?: string;
          created_by: string;
          due_on: string;
          id?: string;
          note: string;
          school_id: string;
        };
        Update: {
          case_id?: string;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string;
          due_on?: string;
          id?: string;
          note?: string;
          school_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "special_education_followups_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "special_education_cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "special_education_followups_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      special_education_interventions: {
        Row: {
          area_code: string | null;
          case_id: string;
          created_at: string;
          created_by: string;
          goal_id: string | null;
          id: string;
          observed_effect: string | null;
          performed_at: string | null;
          planned_for: string | null;
          school_id: string;
          status: string;
          strategy: string;
          updated_at: string;
        };
        Insert: {
          area_code?: string | null;
          case_id: string;
          created_at?: string;
          created_by: string;
          goal_id?: string | null;
          id?: string;
          observed_effect?: string | null;
          performed_at?: string | null;
          planned_for?: string | null;
          school_id: string;
          status?: string;
          strategy: string;
          updated_at?: string;
        };
        Update: {
          area_code?: string | null;
          case_id?: string;
          created_at?: string;
          created_by?: string;
          goal_id?: string | null;
          id?: string;
          observed_effect?: string | null;
          performed_at?: string | null;
          planned_for?: string | null;
          school_id?: string;
          status?: string;
          strategy?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "special_education_interventions_area_code_fkey";
            columns: ["area_code"];
            isOneToOne: false;
            referencedRelation: "special_education_support_area_catalog";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "special_education_interventions_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "special_education_cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "special_education_interventions_goal_id_fkey";
            columns: ["goal_id"];
            isOneToOne: false;
            referencedRelation: "special_education_support_goals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "special_education_interventions_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      special_education_observations: {
        Row: {
          case_id: string;
          context: string | null;
          created_at: string;
          created_by: string;
          id: string;
          observation: string;
          observed_at: string;
          observed_response: string | null;
          response_effect: string | null;
          school_id: string;
          support_area: string | null;
          support_used: string | null;
        };
        Insert: {
          case_id: string;
          context?: string | null;
          created_at?: string;
          created_by: string;
          id?: string;
          observation: string;
          observed_at?: string;
          observed_response?: string | null;
          response_effect?: string | null;
          school_id: string;
          support_area?: string | null;
          support_used?: string | null;
        };
        Update: {
          case_id?: string;
          context?: string | null;
          created_at?: string;
          created_by?: string;
          id?: string;
          observation?: string;
          observed_at?: string;
          observed_response?: string | null;
          response_effect?: string | null;
          school_id?: string;
          support_area?: string | null;
          support_used?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "special_education_observations_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "special_education_cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "special_education_observations_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      special_education_practitioners: {
        Row: {
          granted_at: string;
          granted_by: string | null;
          is_active: boolean;
          role: string;
          school_id: string;
          user_id: string;
        };
        Insert: {
          granted_at?: string;
          granted_by?: string | null;
          is_active?: boolean;
          role?: string;
          school_id: string;
          user_id: string;
        };
        Update: {
          granted_at?: string;
          granted_by?: string | null;
          is_active?: boolean;
          role?: string;
          school_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "special_education_practitioners_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      special_education_progress_reviews: {
        Row: {
          area_code: string | null;
          case_id: string;
          change_level: string;
          created_at: string;
          created_by: string;
          evidence: string;
          id: string;
          next_step: string | null;
          reviewed_on: string;
          school_id: string;
        };
        Insert: {
          area_code?: string | null;
          case_id: string;
          change_level: string;
          created_at?: string;
          created_by: string;
          evidence: string;
          id?: string;
          next_step?: string | null;
          reviewed_on?: string;
          school_id: string;
        };
        Update: {
          area_code?: string | null;
          case_id?: string;
          change_level?: string;
          created_at?: string;
          created_by?: string;
          evidence?: string;
          id?: string;
          next_step?: string | null;
          reviewed_on?: string;
          school_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "special_education_progress_reviews_area_code_fkey";
            columns: ["area_code"];
            isOneToOne: false;
            referencedRelation: "special_education_support_area_catalog";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "special_education_progress_reviews_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "special_education_cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "special_education_progress_reviews_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      special_education_strategy_catalog: {
        Row: {
          age_note: string | null;
          area_code: string;
          contraindication_note: string | null;
          created_at: string;
          id: string;
          implementation_steps: string[];
          is_active: boolean;
          sort_order: number;
          source_kind: string;
          source_label: string | null;
          source_url: string | null;
          summary: string;
          title: string;
        };
        Insert: {
          age_note?: string | null;
          area_code: string;
          contraindication_note?: string | null;
          created_at?: string;
          id?: string;
          implementation_steps?: string[];
          is_active?: boolean;
          sort_order?: number;
          source_kind: string;
          source_label?: string | null;
          source_url?: string | null;
          summary: string;
          title: string;
        };
        Update: {
          age_note?: string | null;
          area_code?: string;
          contraindication_note?: string | null;
          created_at?: string;
          id?: string;
          implementation_steps?: string[];
          is_active?: boolean;
          sort_order?: number;
          source_kind?: string;
          source_label?: string | null;
          source_url?: string | null;
          summary?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "special_education_strategy_catalog_area_code_fkey";
            columns: ["area_code"];
            isOneToOne: false;
            referencedRelation: "special_education_support_area_catalog";
            referencedColumns: ["code"];
          },
        ];
      };
      special_education_support_area_catalog: {
        Row: {
          code: string;
          description: string;
          is_active: boolean;
          label: string;
          sort_order: number;
        };
        Insert: {
          code: string;
          description: string;
          is_active?: boolean;
          label: string;
          sort_order: number;
        };
        Update: {
          code?: string;
          description?: string;
          is_active?: boolean;
          label?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      special_education_support_goals: {
        Row: {
          area_code: string | null;
          case_id: string;
          created_at: string;
          created_by: string;
          description: string | null;
          id: string;
          school_id: string;
          status: string;
          target_date: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          area_code?: string | null;
          case_id: string;
          created_at?: string;
          created_by: string;
          description?: string | null;
          id?: string;
          school_id: string;
          status?: string;
          target_date?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          area_code?: string | null;
          case_id?: string;
          created_at?: string;
          created_by?: string;
          description?: string | null;
          id?: string;
          school_id?: string;
          status?: string;
          target_date?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "special_education_support_goals_area_code_fkey";
            columns: ["area_code"];
            isOneToOne: false;
            referencedRelation: "special_education_support_area_catalog";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "special_education_support_goals_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "special_education_cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "special_education_support_goals_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      spring_break_terms: {
        Row: {
          districts: string[];
          ends_on: string;
          id: string;
          school_year_label: string;
          source_url: string;
          starts_on: string;
        };
        Insert: {
          districts: string[];
          ends_on: string;
          id?: string;
          school_year_label: string;
          source_url: string;
          starts_on: string;
        };
        Update: {
          districts?: string[];
          ends_on?: string;
          id?: string;
          school_year_label?: string;
          source_url?: string;
          starts_on?: string;
        };
        Relationships: [];
      };
      student_aliases: {
        Row: {
          alias: string;
          avatar_key: string | null;
          class_id: string;
          created_at: string;
          id: string;
          is_active: boolean;
          school_id: string;
          updated_at: string;
        };
        Insert: {
          alias: string;
          avatar_key?: string | null;
          class_id: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          school_id: string;
          updated_at?: string;
        };
        Update: {
          alias?: string;
          avatar_key?: string | null;
          class_id?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          school_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "student_aliases_class_same_school";
            columns: ["class_id", "school_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id", "school_id"];
          },
          {
            foreignKeyName: "student_aliases_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      student_learning_signals: {
        Row: {
          active: boolean;
          class_id: string;
          created_at: string;
          created_by: string;
          curriculum_outcome_id: string | null;
          id: string;
          kind: Database["public"]["Enums"]["learning_signal_kind"];
          lesson_id: string;
          note: string | null;
          school_id: string;
          student_alias_id: string;
          topic: string | null;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          class_id: string;
          created_at?: string;
          created_by?: string;
          curriculum_outcome_id?: string | null;
          id?: string;
          kind: Database["public"]["Enums"]["learning_signal_kind"];
          lesson_id: string;
          note?: string | null;
          school_id: string;
          student_alias_id: string;
          topic?: string | null;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          class_id?: string;
          created_at?: string;
          created_by?: string;
          curriculum_outcome_id?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["learning_signal_kind"];
          lesson_id?: string;
          note?: string | null;
          school_id?: string;
          student_alias_id?: string;
          topic?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "learning_signal_alias_school_fk";
            columns: ["school_id", "student_alias_id"];
            isOneToOne: false;
            referencedRelation: "student_aliases";
            referencedColumns: ["school_id", "id"];
          },
          {
            foreignKeyName: "learning_signal_class_school_fk";
            columns: ["school_id", "class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["school_id", "id"];
          },
          {
            foreignKeyName: "learning_signal_lesson_school_fk";
            columns: ["school_id", "lesson_id"];
            isOneToOne: false;
            referencedRelation: "lesson_instances";
            referencedColumns: ["school_id", "id"];
          },
          {
            foreignKeyName: "student_learning_signals_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_learning_signals_curriculum_outcome_id_fkey";
            columns: ["curriculum_outcome_id"];
            isOneToOne: false;
            referencedRelation: "curriculum_outcomes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_learning_signals_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lesson_instances";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_learning_signals_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_learning_signals_student_alias_id_fkey";
            columns: ["student_alias_id"];
            isOneToOne: false;
            referencedRelation: "student_aliases";
            referencedColumns: ["id"];
          },
        ];
      };
      system_calendar_days: {
        Row: {
          blocks_lessons: boolean;
          calendar_key: string;
          created_at: string;
          ends_on: string;
          id: string;
          kind: Database["public"]["Enums"]["system_calendar_kind"];
          school_year_label: string | null;
          source_name: string;
          source_url: string;
          starts_on: string;
          title: string;
        };
        Insert: {
          blocks_lessons?: boolean;
          calendar_key: string;
          created_at?: string;
          ends_on: string;
          id?: string;
          kind: Database["public"]["Enums"]["system_calendar_kind"];
          school_year_label?: string | null;
          source_name: string;
          source_url: string;
          starts_on: string;
          title: string;
        };
        Update: {
          blocks_lessons?: boolean;
          calendar_key?: string;
          created_at?: string;
          ends_on?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["system_calendar_kind"];
          school_year_label?: string | null;
          source_name?: string;
          source_url?: string;
          starts_on?: string;
          title?: string;
        };
        Relationships: [];
      };
      teacher_assistant_settings: {
        Row: {
          afternoon_reflection_enabled: boolean;
          assistant_name: string;
          created_at: string;
          custom_style: string | null;
          memory_enabled: boolean;
          morning_briefing_enabled: boolean;
          tone: Database["public"]["Enums"]["assistant_tone"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          afternoon_reflection_enabled?: boolean;
          assistant_name?: string;
          created_at?: string;
          custom_style?: string | null;
          memory_enabled?: boolean;
          morning_briefing_enabled?: boolean;
          tone?: Database["public"]["Enums"]["assistant_tone"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          afternoon_reflection_enabled?: boolean;
          assistant_name?: string;
          created_at?: string;
          custom_style?: string | null;
          memory_enabled?: boolean;
          morning_briefing_enabled?: boolean;
          tone?: Database["public"]["Enums"]["assistant_tone"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      teacher_personal_memory: {
        Row: {
          content: string;
          created_at: string;
          explicitly_confirmed: boolean;
          id: string;
          is_active: boolean;
          kind: Database["public"]["Enums"]["teacher_memory_kind"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          explicitly_confirmed?: boolean;
          id?: string;
          is_active?: boolean;
          kind: Database["public"]["Enums"]["teacher_memory_kind"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          explicitly_confirmed?: boolean;
          id?: string;
          is_active?: boolean;
          kind?: Database["public"]["Enums"]["teacher_memory_kind"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      teacher_profiles: {
        Row: {
          created_at: string;
          display_name: string;
          locale: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string;
          locale?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          display_name?: string;
          locale?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      timetable_slots: {
        Row: {
          academic_year_id: string;
          class_id: string;
          created_at: string;
          curriculum_subject_id: string | null;
          ends_at: string;
          id: string;
          is_active: boolean;
          school_id: string;
          slot_order: number;
          starts_at: string;
          subject_name: string;
          updated_at: string;
          valid_from: string | null;
          valid_to: string | null;
          weekday: number;
        };
        Insert: {
          academic_year_id: string;
          class_id: string;
          created_at?: string;
          curriculum_subject_id?: string | null;
          ends_at: string;
          id?: string;
          is_active?: boolean;
          school_id: string;
          slot_order: number;
          starts_at: string;
          subject_name: string;
          updated_at?: string;
          valid_from?: string | null;
          valid_to?: string | null;
          weekday: number;
        };
        Update: {
          academic_year_id?: string;
          class_id?: string;
          created_at?: string;
          curriculum_subject_id?: string | null;
          ends_at?: string;
          id?: string;
          is_active?: boolean;
          school_id?: string;
          slot_order?: number;
          starts_at?: string;
          subject_name?: string;
          updated_at?: string;
          valid_from?: string | null;
          valid_to?: string | null;
          weekday?: number;
        };
        Relationships: [
          {
            foreignKeyName: "timetable_class_school_fk";
            columns: ["school_id", "class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["school_id", "id"];
          },
          {
            foreignKeyName: "timetable_slots_academic_year_id_fkey";
            columns: ["academic_year_id"];
            isOneToOne: false;
            referencedRelation: "academic_years";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "timetable_slots_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "timetable_slots_curriculum_subject_id_fkey";
            columns: ["curriculum_subject_id"];
            isOneToOne: false;
            referencedRelation: "curriculum_subjects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "timetable_slots_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "timetable_year_school_fk";
            columns: ["school_id", "academic_year_id"];
            isOneToOne: false;
            referencedRelation: "academic_years";
            referencedColumns: ["school_id", "id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_access_class: { Args: { _class_id: string }; Returns: boolean };
      class_day_blockers: {
        Args: { _class_id: string; _day: string };
        Returns: {
          blocks_lessons: boolean;
          event_id: string;
          source: string;
          title: string;
        }[];
      };
      create_school_tenant: {
        Args: {
          _academic_year_label?: string;
          _ends_on?: string;
          _school_name: string;
          _starts_on?: string;
        };
        Returns: string;
      };
      get_calendar_planning_impacts: {
        Args: { _class_id: string; _from: string; _to: string };
        Returns: {
          affects_schedule: boolean;
          all_day: boolean;
          blocks_lessons: boolean;
          ends_at: string;
          event_id: string;
          kind: Database["public"]["Enums"]["calendar_event_kind"];
          starts_at: string;
          title: string;
        }[];
      };
      grant_special_education_access: {
        Args: { p_role?: string; p_school_id: string; p_user_id: string };
        Returns: undefined;
      };
      has_special_education_access: {
        Args: { p_school_id: string };
        Returns: boolean;
      };
      is_class_day_blocked: {
        Args: { _class_id: string; _day: string };
        Returns: boolean;
      };
      is_class_teacher: { Args: { _class_id: string }; Returns: boolean };
      is_lesson_slot_blocked: {
        Args: {
          _class_id: string;
          _day: string;
          _ends_at: string;
          _starts_at: string;
        };
        Returns: boolean;
      };
      is_school_admin: { Args: { _school_id: string }; Returns: boolean };
      is_school_member: { Args: { _school_id: string }; Returns: boolean };
      materialize_lessons_for_week: {
        Args: { _class_id: string; _week_start: string };
        Returns: number;
      };
      special_education_alias_belongs_to_case_tenant: {
        Args: { p_alias_id: string; p_class_id: string; p_school_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      ai_generation_status: "queued" | "running" | "succeeded" | "failed" | "cancelled";
      assistant_tone: "friendly" | "calm" | "efficient" | "custom";
      calendar_event_kind:
        | "meeting"
        | "trip"
        | "excursion"
        | "school_event"
        | "holiday"
        | "director_day_off"
        | "birthday"
        | "name_day"
        | "test"
        | "project"
        | "training"
        | "absence"
        | "other";
      calendar_event_scope: "private" | "class" | "school";
      class_role: "teacher" | "assistant_teacher";
      curriculum_dependency_type: "prerequisite" | "recommended_before" | "related" | "next_step";
      curriculum_origin: "official" | "school" | "licensed" | "internal";
      curriculum_status: "draft" | "validated" | "published" | "retired";
      learning_signal_kind: "needs_practice" | "improving" | "mastered" | "advanced" | "follow_up";
      lesson_progress_state: "not_started" | "partial" | "completed";
      lesson_status: "planned" | "draft" | "prepared" | "completed" | "cancelled" | "moved";
      material_kind:
        | "lesson_plan"
        | "board_notes"
        | "worksheet"
        | "answer_key"
        | "quiz"
        | "test"
        | "presentation"
        | "activity"
        | "differentiation"
        | "homework"
        | "other";
      membership_status: "active" | "invited" | "suspended";
      school_role: "school_admin" | "teacher";
      system_calendar_kind: "state_holiday" | "other_holiday" | "school_break" | "school_milestone";
      teacher_memory_kind:
        | "communication_preference"
        | "planning_preference"
        | "recurring_commitment"
        | "personal_note";
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
      ai_generation_status: ["queued", "running", "succeeded", "failed", "cancelled"],
      assistant_tone: ["friendly", "calm", "efficient", "custom"],
      calendar_event_kind: [
        "meeting",
        "trip",
        "excursion",
        "school_event",
        "holiday",
        "director_day_off",
        "birthday",
        "name_day",
        "test",
        "project",
        "training",
        "absence",
        "other",
      ],
      calendar_event_scope: ["private", "class", "school"],
      class_role: ["teacher", "assistant_teacher"],
      curriculum_dependency_type: ["prerequisite", "recommended_before", "related", "next_step"],
      curriculum_origin: ["official", "school", "licensed", "internal"],
      curriculum_status: ["draft", "validated", "published", "retired"],
      learning_signal_kind: ["needs_practice", "improving", "mastered", "advanced", "follow_up"],
      lesson_progress_state: ["not_started", "partial", "completed"],
      lesson_status: ["planned", "draft", "prepared", "completed", "cancelled", "moved"],
      material_kind: [
        "lesson_plan",
        "board_notes",
        "worksheet",
        "answer_key",
        "quiz",
        "test",
        "presentation",
        "activity",
        "differentiation",
        "homework",
        "other",
      ],
      membership_status: ["active", "invited", "suspended"],
      school_role: ["school_admin", "teacher"],
      system_calendar_kind: ["state_holiday", "other_holiday", "school_break", "school_milestone"],
      teacher_memory_kind: [
        "communication_preference",
        "planning_preference",
        "recurring_commitment",
        "personal_note",
      ],
    },
  },
} as const;
