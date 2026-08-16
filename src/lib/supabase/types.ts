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
      academic_calendar: {
        Row: {
          created_at: string
          date: string
          day_type: string
          id: string
          label: string | null
          term: string | null
        }
        Insert: {
          created_at?: string
          date: string
          day_type: string
          id?: string
          label?: string | null
          term?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          day_type?: string
          id?: string
          label?: string | null
          term?: string | null
        }
        Relationships: []
      }
      agent_actions: {
        Row: {
          action_type: string
          conversation_id: string | null
          created_at: string
          error_message: string | null
          id: string
          payload: Json
          proposed_by: string | null
          rationale: string | null
          result_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          action_type: string
          conversation_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          payload: Json
          proposed_by?: string | null
          rationale?: string | null
          result_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          action_type?: string
          conversation_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          payload?: Json
          proposed_by?: string | null
          rationale?: string | null
          result_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_actions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "agent_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_actions_proposed_by_fkey"
            columns: ["proposed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_actions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_conversations: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          specialist: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          specialist?: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          specialist?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_conversations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_messages: {
        Row: {
          content: Json
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: Json
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: Json
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "agent_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_results: {
        Row: {
          assessment_id: string
          created_at: string
          id: string
          notes: string | null
          sbg_level: number | null
          score: number | null
          student_id: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          id?: string
          notes?: string | null
          sbg_level?: number | null
          score?: number | null
          student_id: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          sbg_level?: number | null
          score?: number | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_results_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          class_id: string | null
          created_at: string
          date: string | null
          id: string
          sbg_level_max: number
          standard_code: string | null
          title: string
          type: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          date?: string | null
          id?: string
          sbg_level_max?: number
          standard_code?: string | null
          title: string
          type?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string
          date?: string | null
          id?: string
          sbg_level_max?: number
          standard_code?: string | null
          title?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          class_id: string
          created_at: string
          date: string
          id: string
          note: string | null
          recorded_by: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          date: string
          id?: string
          note?: string | null
          recorded_by?: string | null
          status: string
          student_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          recorded_by?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_date_fkey"
            columns: ["date"]
            isOneToOne: false
            referencedRelation: "academic_calendar"
            referencedColumns: ["date"]
          },
          {
            foreignKeyName: "attendance_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_summary: {
        Row: {
          attendance_pct: number | null
          created_at: string
          id: string
          present_days: number | null
          student_id: string
          term: string
          total_days: number | null
        }
        Insert: {
          attendance_pct?: number | null
          created_at?: string
          id?: string
          present_days?: number | null
          student_id: string
          term: string
          total_days?: number | null
        }
        Update: {
          attendance_pct?: number | null
          created_at?: string
          id?: string
          present_days?: number | null
          student_id?: string
          term?: string
          total_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_summary_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          detail: Json | null
          entity: string | null
          entity_id: string | null
          id: number
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          detail?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: number
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          detail?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_enrollment: {
        Row: {
          class_id: string
          enrolled_at: string
          id: string
          student_id: string
        }
        Insert: {
          class_id: string
          enrolled_at?: string
          id?: string
          student_id: string
        }
        Update: {
          class_id?: string
          enrolled_at?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_enrollment_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_enrollment_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          grade_band: string | null
          grade_level: string | null
          id: string
          name: string
          subject: string | null
          teacher_id: string | null
          term: string | null
        }
        Insert: {
          created_at?: string
          grade_band?: string | null
          grade_level?: string | null
          id?: string
          name: string
          subject?: string | null
          teacher_id?: string | null
          term?: string | null
        }
        Update: {
          created_at?: string
          grade_band?: string | null
          grade_level?: string | null
          id?: string
          name?: string
          subject?: string | null
          teacher_id?: string | null
          term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_frameworks: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          notes: string | null
          parent_framework: string | null
          primary_standard: string
          source_url: string | null
          state_anchor: string | null
          subject: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          parent_framework?: string | null
          primary_standard: string
          source_url?: string | null
          state_anchor?: string | null
          subject: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          parent_framework?: string | null
          primary_standard?: string
          source_url?: string | null
          state_anchor?: string | null
          subject?: string
        }
        Relationships: []
      }
      curriculum_modules: {
        Row: {
          created_at: string
          grade_band: string | null
          grade_level: string | null
          id: string
          planned_days: number | null
          sequence_order: number | null
          source: string | null
          source_url: string | null
          subject: string | null
          term: string | null
          title: string
        }
        Insert: {
          created_at?: string
          grade_band?: string | null
          grade_level?: string | null
          id?: string
          planned_days?: number | null
          sequence_order?: number | null
          source?: string | null
          source_url?: string | null
          subject?: string | null
          term?: string | null
          title: string
        }
        Update: {
          created_at?: string
          grade_band?: string | null
          grade_level?: string | null
          id?: string
          planned_days?: number | null
          sequence_order?: number | null
          source?: string | null
          source_url?: string | null
          subject?: string | null
          term?: string | null
          title?: string
        }
        Relationships: []
      }
      curriculum_programmes: {
        Row: {
          created_at: string
          governing_standard: string | null
          grades: string | null
          id: string
          is_daily: boolean
          notes: string | null
          programme: string
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          governing_standard?: string | null
          grades?: string | null
          id?: string
          is_daily?: boolean
          notes?: string | null
          programme: string
          status?: string
          subject: string
        }
        Update: {
          created_at?: string
          governing_standard?: string | null
          grades?: string | null
          id?: string
          is_daily?: boolean
          notes?: string | null
          programme?: string
          status?: string
          subject?: string
        }
        Relationships: []
      }
      curriculum_sources: {
        Row: {
          acquired: boolean
          category: string
          created_at: string
          id: string
          licence: string | null
          name: string
          priority: number | null
          provides: string | null
          url: string
        }
        Insert: {
          acquired?: boolean
          category: string
          created_at?: string
          id?: string
          licence?: string | null
          name: string
          priority?: number | null
          provides?: string | null
          url: string
        }
        Update: {
          acquired?: boolean
          category?: string
          created_at?: string
          id?: string
          licence?: string | null
          name?: string
          priority?: number | null
          provides?: string | null
          url?: string
        }
        Relationships: []
      }
      curriculum_standards: {
        Row: {
          code: string
          created_at: string
          description: string | null
          domain: string | null
          framework: string
          grade_band: string | null
          grade_level: string | null
          id: string
          source_url: string | null
          subject: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          domain?: string | null
          framework: string
          grade_band?: string | null
          grade_level?: string | null
          id?: string
          source_url?: string | null
          subject?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          domain?: string | null
          framework?: string
          grade_band?: string | null
          grade_level?: string | null
          id?: string
          source_url?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      duolingo_tracker: {
        Row: {
          created_at: string
          id: string
          language: string
          proficiency_level: string | null
          session_date: string | null
          streak_days: number | null
          student_id: string
          xp_earned: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          language?: string
          proficiency_level?: string | null
          session_date?: string | null
          streak_days?: number | null
          student_id: string
          xp_earned?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          language?: string
          proficiency_level?: string | null
          session_date?: string | null
          streak_days?: number | null
          student_id?: string
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "duolingo_tracker_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      interventions: {
        Row: {
          category: string | null
          created_at: string
          description: string
          follow_up_date: string | null
          id: string
          start_date: string
          status: string
          student_id: string
          teacher_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description: string
          follow_up_date?: string | null
          id?: string
          start_date?: string
          status?: string
          student_id: string
          teacher_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string
          follow_up_date?: string | null
          id?: string
          start_date?: string
          status?: string
          student_id?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interventions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interventions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      language_platform_migration: {
        Row: {
          created_at: string
          evaluation_status: string
          id: string
          notes: string | null
          platform_name: string
          target_term: string
        }
        Insert: {
          created_at?: string
          evaluation_status?: string
          id?: string
          notes?: string | null
          platform_name: string
          target_term?: string
        }
        Update: {
          created_at?: string
          evaluation_status?: string
          id?: string
          notes?: string | null
          platform_name?: string
          target_term?: string
        }
        Relationships: []
      }
      lesson_plan_resources: {
        Row: {
          created_at: string
          id: string
          lesson_plan_id: string
          resource_id: string
          role: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_plan_id: string
          resource_id: string
          role?: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          lesson_plan_id?: string
          resource_id?: string
          role?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_plan_resources_lesson_plan_id_fkey"
            columns: ["lesson_plan_id"]
            isOneToOne: false
            referencedRelation: "lesson_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_plan_resources_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_plan_standards: {
        Row: {
          created_at: string
          id: string
          lesson_plan_id: string
          standard_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_plan_id: string
          standard_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_plan_id?: string
          standard_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_plan_standards_lesson_plan_id_fkey"
            columns: ["lesson_plan_id"]
            isOneToOne: false
            referencedRelation: "lesson_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_plan_standards_standard_id_fkey"
            columns: ["standard_id"]
            isOneToOne: false
            referencedRelation: "curriculum_standards"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_plans: {
        Row: {
          assessment_strategy: string | null
          class_id: string | null
          created_at: string
          curriculum_module_id: string | null
          differentiation: string | null
          direct_instruction: string | null
          guided_practice: string | null
          homework: string | null
          id: string
          independent_practice: string | null
          lesson_date: string | null
          materials: string | null
          objective: string | null
          reflection: string | null
          status: string
          teacher_id: string | null
          tier: string
          title: string
          updated_at: string
          warm_up: string | null
          week_of: string | null
        }
        Insert: {
          assessment_strategy?: string | null
          class_id?: string | null
          created_at?: string
          curriculum_module_id?: string | null
          differentiation?: string | null
          direct_instruction?: string | null
          guided_practice?: string | null
          homework?: string | null
          id?: string
          independent_practice?: string | null
          lesson_date?: string | null
          materials?: string | null
          objective?: string | null
          reflection?: string | null
          status?: string
          teacher_id?: string | null
          tier: string
          title: string
          updated_at?: string
          warm_up?: string | null
          week_of?: string | null
        }
        Update: {
          assessment_strategy?: string | null
          class_id?: string | null
          created_at?: string
          curriculum_module_id?: string | null
          differentiation?: string | null
          direct_instruction?: string | null
          guided_practice?: string | null
          homework?: string | null
          id?: string
          independent_practice?: string | null
          lesson_date?: string | null
          materials?: string | null
          objective?: string | null
          reflection?: string | null
          status?: string
          teacher_id?: string | null
          tier?: string
          title?: string
          updated_at?: string
          warm_up?: string | null
          week_of?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_plans_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_plans_curriculum_module_id_fkey"
            columns: ["curriculum_module_id"]
            isOneToOne: false
            referencedRelation: "curriculum_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_plans_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      mobymax_assignments: {
        Row: {
          assigned_date: string
          class_id: string | null
          completion_pct: number
          created_at: string
          due_date: string | null
          id: string
          subject: string | null
          title: string
        }
        Insert: {
          assigned_date?: string
          class_id?: string | null
          completion_pct?: number
          created_at?: string
          due_date?: string | null
          id?: string
          subject?: string | null
          title: string
        }
        Update: {
          assigned_date?: string
          class_id?: string | null
          completion_pct?: number
          created_at?: string
          due_date?: string | null
          id?: string
          subject?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "mobymax_assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      mobymax_log: {
        Row: {
          created_at: string
          id: string
          lessons_completed: number | null
          minutes_spent: number | null
          proficiency_pct: number | null
          session_date: string | null
          student_id: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          lessons_completed?: number | null
          minutes_spent?: number | null
          proficiency_pct?: number | null
          session_date?: string | null
          student_id: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          lessons_completed?: number | null
          minutes_spent?: number | null
          proficiency_pct?: number | null
          session_date?: string | null
          student_id?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mobymax_log_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      pacing_monitor: {
        Row: {
          actual_completion_date: string | null
          class_id: string | null
          created_at: string
          curriculum_module_id: string | null
          id: string
          notes: string | null
          planned_completion_date: string | null
          status: string
        }
        Insert: {
          actual_completion_date?: string | null
          class_id?: string | null
          created_at?: string
          curriculum_module_id?: string | null
          id?: string
          notes?: string | null
          planned_completion_date?: string | null
          status?: string
        }
        Update: {
          actual_completion_date?: string | null
          class_id?: string | null
          created_at?: string
          curriculum_module_id?: string | null
          id?: string
          notes?: string | null
          planned_completion_date?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pacing_monitor_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacing_monitor_curriculum_module_id_fkey"
            columns: ["curriculum_module_id"]
            isOneToOne: false
            referencedRelation: "curriculum_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      planner_folder_items: {
        Row: {
          added_at: string
          folder_id: string
          id: string
          note: string | null
          resource_id: string
          sort_order: number
        }
        Insert: {
          added_at?: string
          folder_id: string
          id?: string
          note?: string | null
          resource_id: string
          sort_order?: number
        }
        Update: {
          added_at?: string
          folder_id?: string
          id?: string
          note?: string | null
          resource_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "planner_folder_items_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "planner_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planner_folder_items_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      planner_folders: {
        Row: {
          colour: string | null
          created_at: string
          id: string
          is_ai_generated: boolean
          name: string
          parent_id: string | null
          sort_order: number
          teacher_id: string | null
        }
        Insert: {
          colour?: string | null
          created_at?: string
          id?: string
          is_ai_generated?: boolean
          name: string
          parent_id?: string | null
          sort_order?: number
          teacher_id?: string | null
        }
        Update: {
          colour?: string | null
          created_at?: string
          id?: string
          is_ai_generated?: boolean
          name?: string
          parent_id?: string | null
          sort_order?: number
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "planner_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "planner_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planner_folders_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          grade_band: string | null
          id: string
          role: string
          school_id: string | null
        }
        Insert: {
          created_at?: string
          full_name: string
          grade_band?: string | null
          id: string
          role: string
          school_id?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string
          grade_band?: string | null
          id?: string
          role?: string
          school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      reflection_pd_log: {
        Row: {
          created_at: string
          entry_date: string
          hours: number | null
          id: string
          notes: string | null
          teacher_id: string | null
          title: string | null
          type: string
        }
        Insert: {
          created_at?: string
          entry_date?: string
          hours?: number | null
          id?: string
          notes?: string | null
          teacher_id?: string | null
          title?: string | null
          type?: string
        }
        Update: {
          created_at?: string
          entry_date?: string
          hours?: number | null
          id?: string
          notes?: string | null
          teacher_id?: string | null
          title?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reflection_pd_log_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      report_comments: {
        Row: {
          author_teacher_id: string | null
          comment: string
          created_at: string
          id: string
          student_id: string
          term: string
        }
        Insert: {
          author_teacher_id?: string | null
          comment: string
          created_at?: string
          id?: string
          student_id: string
          term: string
        }
        Update: {
          author_teacher_id?: string | null
          comment?: string
          created_at?: string
          id?: string
          student_id?: string
          term?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_comments_author_teacher_id_fkey"
            columns: ["author_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_comments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_categories: {
        Row: {
          course_count: number | null
          created_at: string
          grade_band: string | null
          grade_level: string | null
          id: string
          last_synced_at: string | null
          moodle_category_id: number
          name: string
          sort_order: number
        }
        Insert: {
          course_count?: number | null
          created_at?: string
          grade_band?: string | null
          grade_level?: string | null
          id?: string
          last_synced_at?: string | null
          moodle_category_id: number
          name: string
          sort_order?: number
        }
        Update: {
          course_count?: number | null
          created_at?: string
          grade_band?: string | null
          grade_level?: string | null
          id?: string
          last_synced_at?: string | null
          moodle_category_id?: number
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      resource_collections: {
        Row: {
          created_at: string
          depth: number
          drive_folder_id: string | null
          grade_band: string | null
          grade_level: string | null
          id: string
          last_synced_at: string | null
          module_name: string | null
          name: string
          parent_id: string | null
          path: string | null
          source: string
          subject: string | null
          view_url: string | null
        }
        Insert: {
          created_at?: string
          depth?: number
          drive_folder_id?: string | null
          grade_band?: string | null
          grade_level?: string | null
          id?: string
          last_synced_at?: string | null
          module_name?: string | null
          name: string
          parent_id?: string | null
          path?: string | null
          source?: string
          subject?: string | null
          view_url?: string | null
        }
        Update: {
          created_at?: string
          depth?: number
          drive_folder_id?: string | null
          grade_band?: string | null
          grade_level?: string | null
          id?: string
          last_synced_at?: string | null
          module_name?: string | null
          name?: string
          parent_id?: string | null
          path?: string | null
          source?: string
          subject?: string | null
          view_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_collections_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "resource_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_courses: {
        Row: {
          category_id: string | null
          created_at: string
          fullname: string
          id: string
          last_synced_at: string | null
          moodle_course_id: number
          shortname: string | null
          subject: string | null
          summary: string | null
          visible: boolean
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          fullname: string
          id?: string
          last_synced_at?: string | null
          moodle_course_id: number
          shortname?: string | null
          subject?: string | null
          summary?: string | null
          visible?: boolean
        }
        Update: {
          category_id?: string | null
          created_at?: string
          fullname?: string
          id?: string
          last_synced_at?: string | null
          moodle_course_id?: number
          shortname?: string | null
          subject?: string | null
          summary?: string | null
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "resource_courses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "resource_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_sync_runs: {
        Row: {
          categories_seen: number
          courses_seen: number
          error_message: string | null
          finished_at: string | null
          id: string
          resources_seen: number
          started_at: string
          status: string
        }
        Insert: {
          categories_seen?: number
          courses_seen?: number
          error_message?: string | null
          finished_at?: string | null
          id?: string
          resources_seen?: number
          started_at?: string
          status?: string
        }
        Update: {
          categories_seen?: number
          courses_seen?: number
          error_message?: string | null
          finished_at?: string | null
          id?: string
          resources_seen?: number
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          ai_classified_at: string | null
          ai_subject: string | null
          ai_summary: string | null
          ai_topics: string[]
          collection_id: string | null
          course_id: string | null
          created_at: string
          doc_role: string | null
          drive_file_id: string | null
          file_size: number | null
          file_url: string | null
          id: string
          kind: string
          last_synced_at: string | null
          mime_type: string | null
          moodle_module_id: number | null
          name: string
          section_name: string | null
          sort_order: number
          source: string
        }
        Insert: {
          ai_classified_at?: string | null
          ai_subject?: string | null
          ai_summary?: string | null
          ai_topics?: string[]
          collection_id?: string | null
          course_id?: string | null
          created_at?: string
          doc_role?: string | null
          drive_file_id?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          kind?: string
          last_synced_at?: string | null
          mime_type?: string | null
          moodle_module_id?: number | null
          name: string
          section_name?: string | null
          sort_order?: number
          source?: string
        }
        Update: {
          ai_classified_at?: string | null
          ai_subject?: string | null
          ai_summary?: string | null
          ai_topics?: string[]
          collection_id?: string | null
          course_id?: string | null
          created_at?: string
          doc_role?: string | null
          drive_file_id?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          kind?: string
          last_synced_at?: string | null
          mime_type?: string | null
          moodle_module_id?: number | null
          name?: string
          section_name?: string | null
          sort_order?: number
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "resource_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "resource_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          code: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          timezone: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          timezone?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          timezone?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          created_at: string
          full_name: string
          grade_band: string | null
          grade_level: string | null
          id: string
          status: string
          student_number: string | null
        }
        Insert: {
          created_at?: string
          full_name: string
          grade_band?: string | null
          grade_level?: string | null
          id?: string
          status?: string
          student_number?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string
          grade_band?: string | null
          grade_level?: string | null
          id?: string
          status?: string
          student_number?: string | null
        }
        Relationships: []
      }
      system_alerts: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          recipient_role: string | null
          severity: string
          teacher_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          recipient_role?: string | null
          severity?: string
          teacher_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          recipient_role?: string | null
          severity?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_alerts_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          grade_band: string | null
          id: string
          profile_id: string | null
          status: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          grade_band?: string | null
          id?: string
          profile_id?: string | null
          status?: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          grade_band?: string | null
          id?: string
          profile_id?: string | null
          status?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teachers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_runs: {
        Row: {
          alerts_created: number
          error_message: string | null
          finished_at: string | null
          id: string
          matches_found: number
          started_at: string
          status: string
          summary: string | null
          workflow_id: string
        }
        Insert: {
          alerts_created?: number
          error_message?: string | null
          finished_at?: string | null
          id?: string
          matches_found?: number
          started_at?: string
          status?: string
          summary?: string | null
          workflow_id: string
        }
        Update: {
          alerts_created?: number
          error_message?: string | null
          finished_at?: string | null
          id?: string
          matches_found?: number
          started_at?: string
          status?: string
          summary?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_runs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          cadence: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_enabled: boolean
          last_run_at: string | null
          name: string
          params: Json
          recipient_role: string | null
          rule_type: string
          severity: string
        }
        Insert: {
          cadence?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_enabled?: boolean
          last_run_at?: string | null
          name: string
          params?: Json
          recipient_role?: string | null
          rule_type: string
          severity?: string
        }
        Update: {
          cadence?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_enabled?: boolean
          last_run_at?: string | null
          name?: string
          params?: Json
          recipient_role?: string | null
          rule_type?: string
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_role: { Args: never; Returns: string }
      current_teacher_id: { Args: never; Returns: string }
      is_staff_admin: { Args: never; Returns: boolean }
      is_superadmin: { Args: never; Returns: boolean }
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
