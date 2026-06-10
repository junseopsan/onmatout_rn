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
      ai_answer_logs: {
        Row: {
          answer: string
          created_at: string
          id: string
          question: string
          related_asana_ids: string[]
          related_routine_ids: string[]
          retrieved_document_ids: string[]
          safety_notice_required: boolean
          should_recommend_teacher: boolean
          thread_id: string | null
          user_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          question: string
          related_asana_ids?: string[]
          related_routine_ids?: string[]
          retrieved_document_ids?: string[]
          safety_notice_required?: boolean
          should_recommend_teacher?: boolean
          thread_id?: string | null
          user_id: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          question?: string
          related_asana_ids?: string[]
          related_routine_ids?: string[]
          retrieved_document_ids?: string[]
          safety_notice_required?: boolean
          should_recommend_teacher?: boolean
          thread_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_answer_logs_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "yoga_talk_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      app_versions: {
        Row: {
          min_version: string
          platform: string
          store_url: string
        }
        Insert: {
          min_version: string
          platform: string
          store_url: string
        }
        Update: {
          min_version?: string
          platform?: string
          store_url?: string
        }
        Relationships: []
      }
      asanacategory: {
        Row: {
          category_name_en: string
          category_name_ko: string
          created_at: string | null
          id: string
        }
        Insert: {
          category_name_en: string
          category_name_ko: string
          created_at?: string | null
          id?: string
        }
        Update: {
          category_name_en?: string
          category_name_ko?: string
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      asanas: {
        Row: {
          asana_meaning: string | null
          category_name_en: string | null
          created_at: string
          id: string
          image_count: number
          image_number: string | null
          level: string | null
          sanskrit_name: string | null
          sanskrit_name_en: string
          sanskrit_name_kr: string
          search_aliases: string[]
          updated_at: string
        }
        Insert: {
          asana_meaning?: string | null
          category_name_en?: string | null
          created_at?: string
          id?: string
          image_count?: number
          image_number?: string | null
          level?: string | null
          sanskrit_name?: string | null
          sanskrit_name_en: string
          sanskrit_name_kr: string
          search_aliases?: string[]
          updated_at?: string
        }
        Update: {
          asana_meaning?: string | null
          category_name_en?: string | null
          created_at?: string
          id?: string
          image_count?: number
          image_number?: string | null
          level?: string | null
          sanskrit_name?: string | null
          sanskrit_name_en?: string
          sanskrit_name_kr?: string
          search_aliases?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          attendance_date: string
          class_id: string
          created_at: string
          deducted: boolean
          id: string
          memo: string | null
          source: string
          status: string
          student_id: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          attendance_date: string
          class_id: string
          created_at?: string
          deducted?: boolean
          id?: string
          memo?: string | null
          source?: string
          status: string
          student_id: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          attendance_date?: string
          class_id?: string
          created_at?: string
          deducted?: boolean
          id?: string
          memo?: string | null
          source?: string
          status?: string
          student_id?: string
          teacher_id?: string
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
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_schedules: {
        Row: {
          class_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          start_time: string
        }
        Insert: {
          class_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          start_time: string
        }
        Update: {
          class_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_schedules_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_students: {
        Row: {
          class_id: string
          id: string
          joined_at: string
          status: string
          student_id: string
        }
        Insert: {
          class_id: string
          id?: string
          joined_at?: string
          status?: string
          student_id: string
        }
        Update: {
          class_id?: string
          id?: string
          joined_at?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          capacity: number | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          location: string | null
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      feed_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          parent_id: string | null
          record_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          record_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          record_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "feed_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_comments_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "practice_records"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_likes: {
        Row: {
          created_at: string | null
          id: string
          record_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          record_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          record_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_likes_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "practice_records"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_shares: {
        Row: {
          created_at: string | null
          id: string
          record_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          record_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          record_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_shares_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "practice_records"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_documents: {
        Row: {
          content: string
          created_at: string
          embedding: string | null
          id: string
          metadata: Json
          source_id: string
          source_type: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json
          source_id: string
          source_type: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json
          source_id?: string
          source_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      memberships: {
        Row: {
          class_id: string | null
          created_at: string
          end_date: string
          hold_started_at: string | null
          id: string
          start_date: string
          status: string
          student_id: string
          total_count: number | null
          type: string
          updated_at: string
          used_count: number
          weekly_limit: number | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          end_date: string
          hold_started_at?: string | null
          id?: string
          start_date: string
          status?: string
          student_id: string
          total_count?: number | null
          type: string
          updated_at?: string
          used_count?: number
          weekly_limit?: number | null
        }
        Update: {
          class_id?: string | null
          created_at?: string
          end_date?: string
          hold_started_at?: string | null
          id?: string
          start_date?: string
          status?: string
          student_id?: string
          total_count?: number | null
          type?: string
          updated_at?: string
          used_count?: number
          weekly_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "memberships_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_records: {
        Row: {
          asanas: Json
          created_at: string | null
          id: string
          memo: string | null
          photos: Json
          practice_date: string
          practice_time: string | null
          states: Json
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          asanas?: Json
          created_at?: string | null
          id?: string
          memo?: string | null
          photos?: Json
          practice_date: string
          practice_time?: string | null
          states?: Json
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          asanas?: Json
          created_at?: string | null
          id?: string
          memo?: string | null
          photos?: Json
          practice_date?: string
          practice_time?: string | null
          states?: Json
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      routine_items: {
        Row: {
          asana_id: string
          created_at: string
          duration_seconds: number | null
          id: string
          memo: string | null
          order_index: number
          routine_id: string
          updated_at: string
        }
        Insert: {
          asana_id: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          memo?: string | null
          order_index: number
          routine_id: string
          updated_at?: string
        }
        Update: {
          asana_id?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          memo?: string | null
          order_index?: number
          routine_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_items_asana_id_fkey"
            columns: ["asana_id"]
            isOneToOne: false
            referencedRelation: "asanas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_items_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_shares: {
        Row: {
          class_id: string | null
          created_at: string
          id: string
          routine_id: string
          shared_at: string
          student_id: string | null
          teacher_id: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          id?: string
          routine_id: string
          shared_at?: string
          student_id?: string | null
          teacher_id: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          id?: string
          routine_id?: string
          shared_at?: string
          student_id?: string | null
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_shares_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_shares_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_shares_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      routines: {
        Row: {
          created_at: string
          description: string | null
          id: string
          teacher_id: string
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          teacher_id: string
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          teacher_id?: string
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      student_profiles: {
        Row: {
          created_at: string
          id: string
          invite_code: string
          invite_code_used_at: string | null
          memo: string | null
          name: string
          phone: string | null
          phone_consent_at: string | null
          status: string
          teacher_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          invite_code: string
          invite_code_used_at?: string | null
          memo?: string | null
          name: string
          phone?: string | null
          phone_consent_at?: string | null
          status?: string
          teacher_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          invite_code?: string
          invite_code_used_at?: string | null
          memo?: string | null
          name?: string
          phone?: string | null
          phone_consent_at?: string | null
          status?: string
          teacher_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      studio_promotions: {
        Row: {
          class_date: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          link: string | null
          price: number | null
          priority: number | null
          promotion_type: Database["public"]["Enums"]["promotion_type_enum"]
          schedule_text: string | null
          studio_id: string
          title: string
        }
        Insert: {
          class_date: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          link?: string | null
          price?: number | null
          priority?: number | null
          promotion_type?: Database["public"]["Enums"]["promotion_type_enum"]
          schedule_text?: string | null
          studio_id: string
          title: string
        }
        Update: {
          class_date?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          link?: string | null
          price?: number | null
          priority?: number | null
          promotion_type?: Database["public"]["Enums"]["promotion_type_enum"]
          schedule_text?: string | null
          studio_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_promotions_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      studios: {
        Row: {
          address: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          instagram: string | null
          latitude: number | null
          longitude: number | null
          name: string
          phone: string | null
          priority: number | null
          updated_at: string | null
          url: string | null
          website: string | null
        }
        Insert: {
          address: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          instagram?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          phone?: string | null
          priority?: number | null
          updated_at?: string | null
          url?: string | null
          website?: string | null
        }
        Update: {
          address?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          instagram?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          phone?: string | null
          priority?: number | null
          updated_at?: string | null
          url?: string | null
          website?: string | null
        }
        Relationships: []
      }
      support_requests: {
        Row: {
          admin_response: string | null
          category: string | null
          content: string
          created_at: string | null
          id: string
          status: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_response?: string | null
          category?: string | null
          content: string
          created_at?: string | null
          id?: string
          status?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_response?: string | null
          category?: string | null
          content?: string
          created_at?: string | null
          id?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      teacher_profiles: {
        Row: {
          bio: string | null
          cancellation_hours_before: number
          created_at: string
          id: string
          instagram_url: string | null
          location: string | null
          studio_name: string | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          bio?: string | null
          cancellation_hours_before?: number
          created_at?: string
          id?: string
          instagram_url?: string | null
          location?: string | null
          studio_name?: string | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          bio?: string | null
          cancellation_hours_before?: number
          created_at?: string
          id?: string
          instagram_url?: string | null
          location?: string | null
          studio_name?: string | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      teacher_students: {
        Row: {
          created_at: string
          status: string
          student_profile_id: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          status?: string
          student_profile_id: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          status?: string
          student_profile_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_students_student_profile_id_fkey"
            columns: ["student_profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorite_asanas: {
        Row: {
          asana_id: string | null
          created_at: string | null
          id: string
          memo: string | null
          save_type: string
          user_id: string | null
        }
        Insert: {
          asana_id?: string | null
          created_at?: string | null
          id?: string
          memo?: string | null
          save_type?: string
          user_id?: string | null
        }
        Update: {
          asana_id?: string | null
          created_at?: string | null
          id?: string
          memo?: string | null
          save_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_favorite_asanas_asana_id_fkey"
            columns: ["asana_id"]
            isOneToOne: false
            referencedRelation: "asanas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          email_notifications: boolean | null
          id: string
          language: string | null
          name: string | null
          phone: string | null
          practice_reminders: boolean | null
          push_notifications: boolean | null
          theme: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          name?: string | null
          phone?: string | null
          practice_reminders?: boolean | null
          push_notifications?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          name?: string | null
          phone?: string | null
          practice_reminders?: boolean | null
          push_notifications?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      yoga_talk_attachments: {
        Row: {
          attachment_id: string
          attachment_type: string
          created_at: string
          id: string
          message_id: string
        }
        Insert: {
          attachment_id: string
          attachment_type: string
          created_at?: string
          id?: string
          message_id: string
        }
        Update: {
          attachment_id?: string
          attachment_type?: string
          created_at?: string
          id?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "yoga_talk_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "yoga_talk_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      yoga_talk_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          sender_id: string | null
          sender_type: string
          thread_id: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_type: string
          thread_id: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_type?: string
          thread_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "yoga_talk_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "yoga_talk_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      yoga_talk_threads: {
        Row: {
          category: string
          class_id: string | null
          closed_at: string | null
          created_at: string
          id: string
          last_activity_at: string
          reminder_count: number
          status: string
          student_id: string
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          class_id?: string | null
          closed_at?: string | null
          created_at?: string
          id?: string
          last_activity_at?: string
          reminder_count?: number
          status?: string
          student_id: string
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          class_id?: string | null
          closed_at?: string | null
          created_at?: string
          id?: string
          last_activity_at?: string
          reminder_count?: number
          status?: string
          student_id?: string
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "yoga_talk_threads_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "yoga_talk_threads_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_thread: { Args: { p_thread_id: string }; Returns: boolean }
      cancel_attendance: {
        Args: { p_attendance_id: string; p_memo?: string | null }
        Returns: {
          attendance_date: string
          class_id: string
          created_at: string
          deducted: boolean
          id: string
          memo: string | null
          source: string
          status: string
          student_id: string
          teacher_id: string
          updated_at: string
        }
      }
      mark_attendance: {
        Args: {
          p_attendance_date: string
          p_class_id: string
          p_memo?: string | null
          p_source?: string
          p_status: string
          p_student_id: string
        }
        Returns: {
          attendance_date: string
          class_id: string
          created_at: string
          deducted: boolean
          id: string
          memo: string | null
          source: string
          status: string
          student_id: string
          teacher_id: string
          updated_at: string
        }
      }
      earth: { Args: never; Returns: number }
      generate_invite_code: { Args: never; Returns: string }
      get_user_by_phone: {
        Args: { p_phone: string }
        Returns: {
          phone: string
          user_id: string
        }[]
      }
      is_my_student: {
        Args: { p_student_profile_id: string }
        Returns: boolean
      }
      is_my_student_profile: {
        Args: { p_student_profile_id: string }
        Returns: boolean
      }
      is_routine_shared_with_me: {
        Args: { p_routine_id: string }
        Returns: boolean
      }
      is_student_in_class: { Args: { p_class_id: string }; Returns: boolean }
      is_teacher_of_class: { Args: { p_class_id: string }; Returns: boolean }
    }
    Enums: {
      promotion_type_enum: "one_time" | "recurring"
      user_role: "user" | "admin"
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
      promotion_type_enum: ["one_time", "recurring"],
      user_role: ["user", "admin"],
    },
  },
} as const
