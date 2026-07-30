// Regenerated from the live schema via the Supabase MCP `generate_typescript_types` tool.
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
      // --- Curriculum resources & planner folders (migrations 0005-0006).
      // Hand-added; fold into the generated block on the next full regen.
      resource_categories: {
        Row: {
          id: string
          moodle_category_id: number
          name: string
          grade_band: string | null
          grade_level: string | null
          course_count: number | null
          sort_order: number
          last_synced_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          moodle_category_id: number
          name: string
          grade_band?: string | null
          grade_level?: string | null
          course_count?: number | null
          sort_order?: number
          last_synced_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          moodle_category_id?: number
          name?: string
          grade_band?: string | null
          grade_level?: string | null
          course_count?: number | null
          sort_order?: number
          last_synced_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      resource_courses: {
        Row: {
          id: string
          moodle_course_id: number
          category_id: string | null
          fullname: string
          shortname: string | null
          subject: string | null
          summary: string | null
          visible: boolean
          last_synced_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          moodle_course_id: number
          category_id?: string | null
          fullname: string
          shortname?: string | null
          subject?: string | null
          summary?: string | null
          visible?: boolean
          last_synced_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          moodle_course_id?: number
          category_id?: string | null
          fullname?: string
          shortname?: string | null
          subject?: string | null
          summary?: string | null
          visible?: boolean
          last_synced_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      resource_collections: {
        Row: {
          id: string
          source: string
          drive_folder_id: string | null
          parent_id: string | null
          name: string
          subject: string | null
          grade_level: string | null
          grade_band: string | null
          module_name: string | null
          depth: number
          path: string | null
          view_url: string | null
          last_synced_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          source?: string
          drive_folder_id?: string | null
          parent_id?: string | null
          name: string
          subject?: string | null
          grade_level?: string | null
          grade_band?: string | null
          module_name?: string | null
          depth?: number
          path?: string | null
          view_url?: string | null
          last_synced_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          source?: string
          drive_folder_id?: string | null
          parent_id?: string | null
          name?: string
          subject?: string | null
          grade_level?: string | null
          grade_band?: string | null
          module_name?: string | null
          depth?: number
          path?: string | null
          view_url?: string | null
          last_synced_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          id: string
          course_id: string | null
          collection_id: string | null
          source: string
          moodle_module_id: number | null
          drive_file_id: string | null
          name: string
          kind: string
          doc_role: string | null
          mime_type: string | null
          file_url: string | null
          file_size: number | null
          section_name: string | null
          sort_order: number
          ai_subject: string | null
          ai_topics: string[]
          ai_summary: string | null
          ai_classified_at: string | null
          last_synced_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          course_id?: string | null
          collection_id?: string | null
          source?: string
          moodle_module_id?: number | null
          drive_file_id?: string | null
          name: string
          kind?: string
          doc_role?: string | null
          mime_type?: string | null
          file_url?: string | null
          file_size?: number | null
          section_name?: string | null
          sort_order?: number
          ai_subject?: string | null
          ai_topics?: string[]
          ai_summary?: string | null
          ai_classified_at?: string | null
          last_synced_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string | null
          collection_id?: string | null
          source?: string
          moodle_module_id?: number | null
          drive_file_id?: string | null
          name?: string
          kind?: string
          doc_role?: string | null
          mime_type?: string | null
          file_url?: string | null
          file_size?: number | null
          section_name?: string | null
          sort_order?: number
          ai_subject?: string | null
          ai_topics?: string[]
          ai_summary?: string | null
          ai_classified_at?: string | null
          last_synced_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      resource_sync_runs: {
        Row: {
          id: string
          started_at: string
          finished_at: string | null
          status: string
          categories_seen: number
          courses_seen: number
          resources_seen: number
          error_message: string | null
        }
        Insert: {
          id?: string
          started_at?: string
          finished_at?: string | null
          status?: string
          categories_seen?: number
          courses_seen?: number
          resources_seen?: number
          error_message?: string | null
        }
        Update: {
          id?: string
          started_at?: string
          finished_at?: string | null
          status?: string
          categories_seen?: number
          courses_seen?: number
          resources_seen?: number
          error_message?: string | null
        }
        Relationships: []
      }
      planner_folders: {
        Row: {
          id: string
          teacher_id: string | null
          parent_id: string | null
          name: string
          colour: string | null
          is_ai_generated: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          teacher_id?: string | null
          parent_id?: string | null
          name: string
          colour?: string | null
          is_ai_generated?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          teacher_id?: string | null
          parent_id?: string | null
          name?: string
          colour?: string | null
          is_ai_generated?: boolean
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      planner_folder_items: {
        Row: {
          id: string
          folder_id: string
          resource_id: string
          note: string | null
          sort_order: number
          added_at: string
        }
        Insert: {
          id?: string
          folder_id: string
          resource_id: string
          note?: string | null
          sort_order?: number
          added_at?: string
        }
        Update: {
          id?: string
          folder_id?: string
          resource_id?: string
          note?: string | null
          sort_order?: number
          added_at?: string
        }
        Relationships: []
      }
      lesson_plan_resources: {
        Row: {
          id: string
          lesson_plan_id: string
          resource_id: string
          role: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          lesson_plan_id: string
          resource_id: string
          role?: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          lesson_plan_id?: string
          resource_id?: string
          role?: string
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
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
      curriculum_modules: {
        Row: {
          created_at: string
          grade_band: string | null
          id: string
          sequence_order: number | null
          source: string | null
          subject: string | null
          term: string | null
          title: string
        }
        Insert: {
          created_at?: string
          grade_band?: string | null
          id?: string
          sequence_order?: number | null
          source?: string | null
          subject?: string | null
          term?: string | null
          title: string
        }
        Update: {
          created_at?: string
          grade_band?: string | null
          id?: string
          sequence_order?: number | null
          source?: string | null
          subject?: string | null
          term?: string | null
          title?: string
        }
        Relationships: []
      }
      curriculum_standards: {
        Row: {
          code: string
          created_at: string
          description: string | null
          framework: string
          grade_band: string | null
          id: string
          subject: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          framework: string
          grade_band?: string | null
          id?: string
          subject?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          framework?: string
          grade_band?: string | null
          id?: string
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
          standards: string[]
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
          standards?: string[]
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
          standards?: string[]
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
      profiles: {
        Row: {
          created_at: string
          full_name: string
          grade_band: string | null
          id: string
          role: string
        }
        Insert: {
          created_at?: string
          full_name: string
          grade_band?: string | null
          id: string
          role: string
        }
        Update: {
          created_at?: string
          full_name?: string
          grade_band?: string | null
          id?: string
          role?: string
        }
        Relationships: []
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
