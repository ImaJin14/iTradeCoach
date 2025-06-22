
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      blog_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          post_id: string
          status: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          post_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["prof_id"]
          },
          {
            foreignKeyName: "blog_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_tags: {
        Row: {
          created_at: string
          id: string
          post_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "blog_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string
          category_id: string | null
          content: string
          created_at: string
          excerpt: string | null
          featured: boolean
          featured_image_url: string | null
          id: string
          published_at: string | null
          read_time: number | null
          slug: string
          status: string
          title: string
          updated_at: string
          views_count: number | null
        }
        Insert: {
          author_id: string
          category_id?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          featured?: boolean
          featured_image_url?: string | null
          id?: string
          published_at?: string | null
          read_time?: number | null
          slug: string
          status?: string
          title: string
          updated_at?: string
          views_count?: number | null
        }
        Update: {
          author_id?: string
          category_id?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          featured?: boolean
          featured_image_url?: string | null
          id?: string
          published_at?: string | null
          read_time?: number | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["prof_id"]
          },
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          sender: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          sender: string
          session_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          sender?: string
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_complete_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_learning_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      coach_availability: {
        Row: {
          coach_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_recurring: boolean
          notes: string | null
          specific_date: string | null
          start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_recurring?: boolean
          notes?: string | null
          specific_date?: string | null
          start_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_recurring?: boolean
          notes?: string | null
          specific_date?: string | null
          start_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_availability_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "coach_availability_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_statistics"
            referencedColumns: ["coach_id"]
          },
        ]
      }
      coach_profiles: {
        Row: {
          algorand_wallet: string | null
          coach_id: string
          created_at: string
          earnings: number | null
          expertise_areas: string[] | null
          hourly_rate: number | null
          rating: number | null
          replica_created_at: string | null
          subscription_active: boolean | null
          subscription_required: boolean | null
          tavus_replica_id: string | null
          tavus_replica_status: string | null
          tavus_training_video_url: string | null
          total_students: number | null
          updated_at: string
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          video_intro_url: string | null
        }
        Insert: {
          algorand_wallet?: string | null
          coach_id: string
          created_at?: string
          earnings?: number | null
          expertise_areas?: string[] | null
          hourly_rate?: number | null
          rating?: number | null
          replica_created_at?: string | null
          subscription_active?: boolean | null
          subscription_required?: boolean | null
          tavus_replica_id?: string | null
          tavus_replica_status?: string | null
          tavus_training_video_url?: string | null
          total_students?: number | null
          updated_at?: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          video_intro_url?: string | null
        }
        Update: {
          algorand_wallet?: string | null
          coach_id?: string
          created_at?: string
          earnings?: number | null
          expertise_areas?: string[] | null
          hourly_rate?: number | null
          rating?: number | null
          replica_created_at?: string | null
          subscription_active?: boolean | null
          subscription_required?: boolean | null
          tavus_replica_id?: string | null
          tavus_replica_status?: string | null
          tavus_training_video_url?: string | null
          total_students?: number | null
          updated_at?: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          video_intro_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_profiles_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["prof_id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string | null
          coach_id: string
          created_at: string
          description: string | null
          duration: string | null
          id: number
          is_hidden: boolean | null
          learning_objectives: string | null
          level: string | null
          prerequisites: string | null
          price: number | null
          status: string | null
          student_id: string | null
          tags: string[] | null
          thumbnail: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          coach_id: string
          created_at?: string
          description?: string | null
          duration?: string | null
          id?: never
          is_hidden?: boolean | null
          learning_objectives?: string | null
          level?: string | null
          prerequisites?: string | null
          price?: number | null
          status?: string | null
          student_id?: string | null
          tags?: string[] | null
          thumbnail?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          coach_id?: string
          created_at?: string
          description?: string | null
          duration?: string | null
          id?: never
          is_hidden?: boolean | null
          learning_objectives?: string | null
          level?: string | null
          prerequisites?: string | null
          price?: number | null
          status?: string | null
          student_id?: string | null
          tags?: string[] | null
          thumbnail?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "courses_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_statistics"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "courses_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "courses_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_progress"
            referencedColumns: ["student_id"]
          },
        ]
      }
      learning_progress: {
        Row: {
          completed_topics: string[] | null
          created_at: string | null
          current_streak_days: number | null
          id: string
          last_activity_date: string | null
          total_time_minutes: number | null
          total_xp: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_topics?: string[] | null
          created_at?: string | null
          current_streak_days?: number | null
          id?: string
          last_activity_date?: string | null
          total_time_minutes?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_topics?: string[] | null
          created_at?: string | null
          current_streak_days?: number | null
          id?: string
          last_activity_date?: string | null
          total_time_minutes?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_complete_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_learning_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      learning_topics: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          estimated_duration: number | null
          id: string
          is_active: boolean | null
          level: string
          popularity_score: number | null
          title: string
          total_lessons: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_duration?: number | null
          id?: string
          is_active?: boolean | null
          level: string
          popularity_score?: number | null
          title: string
          total_lessons?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_duration?: number | null
          id?: string
          is_active?: boolean | null
          level?: string
          popularity_score?: number | null
          title?: string
          total_lessons?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_topics_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "learning_topics_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "coach_statistics"
            referencedColumns: ["coach_id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string | null
          created_at: string | null
          description: string | null
          duration: number | null
          id: string
          is_active: boolean | null
          order_index: number
          title: string
          topic_id: string
          type: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          is_active?: boolean | null
          order_index: number
          title: string
          topic_id: string
          type: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          is_active?: boolean | null
          order_index?: number
          title?: string
          topic_id?: string
          type?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "learning_topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topic_progress_view"
            referencedColumns: ["topic_id"]
          },
        ]
      }
      live_session_feedback: {
        Row: {
          created_at: string
          feedback_text: string | null
          id: string
          live_session_id: string
          rating: number
          student_id: string
        }
        Insert: {
          created_at?: string
          feedback_text?: string | null
          id?: string
          live_session_id: string
          rating: number
          student_id: string
        }
        Update: {
          created_at?: string
          feedback_text?: string | null
          id?: string
          live_session_id?: string
          rating?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_session_feedback_live_session_id_fkey"
            columns: ["live_session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_session_feedback_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "live_session_feedback_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_progress"
            referencedColumns: ["student_id"]
          },
        ]
      }
      live_sessions: {
        Row: {
          coach_id: string
          created_at: string
          current_participants: number
          description: string
          duration: number
          id: string
          learning_path: string
          max_participants: number
          meeting_url: string | null
          price: number
          recording_url: string | null
          scheduled_time: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          current_participants?: number
          description: string
          duration: number
          id?: string
          learning_path: string
          max_participants?: number
          meeting_url?: string | null
          price?: number
          recording_url?: string | null
          scheduled_time: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          current_participants?: number
          description?: string
          duration?: number
          id?: string
          learning_path?: string
          max_participants?: number
          meeting_url?: string | null
          price?: number
          recording_url?: string | null
          scheduled_time?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_sessions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "live_sessions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_statistics"
            referencedColumns: ["coach_id"]
          },
        ]
      }
      payment_history: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          payment_method: string | null
          prof_id: string | null
          status: string
          subscription_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_method?: string | null
          prof_id?: string | null
          status: string
          subscription_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_method?: string | null
          prof_id?: string | null
          status?: string
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_history_prof_id_fkey"
            columns: ["prof_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["prof_id"]
          },
          {
            foreignKeyName: "payment_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          role: string | null
          subscription_status: string | null
          trading_experience: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          role?: string | null
          subscription_status?: string | null
          trading_experience?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          role?: string | null
          subscription_status?: string | null
          trading_experience?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      session_enrollments: {
        Row: {
          created_at: string
          enrolled_at: string
          id: string
          session_id: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enrolled_at?: string
          id?: string
          session_id: string
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enrolled_at?: string
          id?: string
          session_id?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_enrollments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "session_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_progress"
            referencedColumns: ["student_id"]
          },
        ]
      }
      session_materials: {
        Row: {
          created_at: string
          description: string | null
          file_type: string
          file_url: string
          id: string
          live_session_id: string | null
          session_id: string | null
          title: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_type: string
          file_url: string
          id?: string
          live_session_id?: string | null
          session_id?: string | null
          title: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_type?: string
          file_url?: string
          id?: string
          live_session_id?: string | null
          session_id?: string | null
          title?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_materials_live_session_id_fkey"
            columns: ["live_session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_materials_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_materials_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "upcoming_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_materials_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "session_materials_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "coach_statistics"
            referencedColumns: ["coach_id"]
          },
        ]
      }
      session_recordings: {
        Row: {
          created_at: string
          duration: number | null
          file_size: number | null
          id: string
          recording_url: string
          session_id: string
          upload_status: string
        }
        Insert: {
          created_at?: string
          duration?: number | null
          file_size?: number | null
          id?: string
          recording_url: string
          session_id: string
          upload_status?: string
        }
        Update: {
          created_at?: string
          duration?: number | null
          file_size?: number | null
          id?: string
          recording_url?: string
          session_id?: string
          upload_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_recordings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_requests: {
        Row: {
          coach_id: string
          coach_response: string | null
          created_at: string
          duration: number
          id: string
          learning_goals: string | null
          message: string
          preferred_time: string
          status: string
          student_id: string
          topic: string
          updated_at: string
        }
        Insert: {
          coach_id: string
          coach_response?: string | null
          created_at?: string
          duration: number
          id?: string
          learning_goals?: string | null
          message: string
          preferred_time: string
          status?: string
          student_id: string
          topic: string
          updated_at?: string
        }
        Update: {
          coach_id?: string
          coach_response?: string | null
          created_at?: string
          duration?: number
          id?: string
          learning_goals?: string | null
          message?: string
          preferred_time?: string
          status?: string
          student_id?: string
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_requests_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "session_requests_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_statistics"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "session_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "session_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_progress"
            referencedColumns: ["student_id"]
          },
        ]
      }
      sessions: {
        Row: {
          coach_id: string
          created_at: string
          duration: number
          id: string
          notes: string | null
          price: number | null
          scheduled_time: string
          status: Database["public"]["Enums"]["session_status"] | null
          student_id: string
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          duration?: number
          id?: string
          notes?: string | null
          price?: number | null
          scheduled_time: string
          status?: Database["public"]["Enums"]["session_status"] | null
          student_id: string
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          duration?: number
          id?: string
          notes?: string | null
          price?: number | null
          scheduled_time?: string
          status?: Database["public"]["Enums"]["session_status"] | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "sessions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_statistics"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_progress"
            referencedColumns: ["student_id"]
          },
        ]
      }
      student_profiles: {
        Row: {
          courses_completed: string[] | null
          created_at: string
          current_level: Database["public"]["Enums"]["student_level"] | null
          learning_goals: string[] | null
          selected_coach_id: string | null
          selected_path: string | null
          student_id: string
          subscription_required: boolean | null
          tokens_earned: number | null
          updated_at: string
        }
        Insert: {
          courses_completed?: string[] | null
          created_at?: string
          current_level?: Database["public"]["Enums"]["student_level"] | null
          learning_goals?: string[] | null
          selected_coach_id?: string | null
          selected_path?: string | null
          student_id: string
          subscription_required?: boolean | null
          tokens_earned?: number | null
          updated_at?: string
        }
        Update: {
          courses_completed?: string[] | null
          created_at?: string
          current_level?: Database["public"]["Enums"]["student_level"] | null
          learning_goals?: string[] | null
          selected_coach_id?: string | null
          selected_path?: string | null
          student_id?: string
          subscription_required?: boolean | null
          tokens_earned?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_selected_coach_id_fkey"
            columns: ["selected_coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "student_profiles_selected_coach_id_fkey"
            columns: ["selected_coach_id"]
            isOneToOne: false
            referencedRelation: "coach_statistics"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "student_profiles_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["prof_id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          interval: string
          name: string
          price: number
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id: string
          interval: string
          name: string
          price: number
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          interval?: string
          name?: string
          price?: number
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string
          current_period_start: string
          id: string
          plan_id: string | null
          prof_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end: string
          current_period_start: string
          id?: string
          plan_id?: string | null
          prof_id?: string | null
          status: string
          updated_at?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id?: string | null
          prof_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_prof_id_fkey"
            columns: ["prof_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["prof_id"]
          },
        ]
      }
      testimonials: {
        Row: {
          approved: boolean | null
          author_id: string
          author_name: string
          author_title: string
          created_at: string
          id: string
          rating: number
          text: string
          updated_at: string
        }
        Insert: {
          approved?: boolean | null
          author_id: string
          author_name: string
          author_title: string
          created_at?: string
          id?: string
          rating: number
          text: string
          updated_at?: string
        }
        Update: {
          approved?: boolean | null
          author_id?: string
          author_name?: string
          author_title?: string
          created_at?: string
          id?: string
          rating?: number
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["prof_id"]
          },
        ]
      }
      tutoring_sessions: {
        Row: {
          coach_id: string
          context_metadata: Json | null
          conversation_id: string
          created_at: string | null
          daily_room_url: string | null
          duration: number | null
          ended_at: string | null
          id: string
          session_type: string
          status: string
          student_id: string
        }
        Insert: {
          coach_id: string
          context_metadata?: Json | null
          conversation_id: string
          created_at?: string | null
          daily_room_url?: string | null
          duration?: number | null
          ended_at?: string | null
          id?: string
          session_type?: string
          status?: string
          student_id: string
        }
        Update: {
          coach_id?: string
          context_metadata?: Json | null
          conversation_id?: string
          created_at?: string | null
          daily_room_url?: string | null
          duration?: number | null
          ended_at?: string | null
          id?: string
          session_type?: string
          status?: string
          student_id?: string
        }
        Relationships: []
      }
      user_lesson_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          lesson_id: string
          time_spent: number | null
          topic_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          lesson_id: string
          time_spent?: number | null
          topic_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          lesson_id?: string
          time_spent?: number | null
          topic_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_progress_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "learning_topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_progress_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topic_progress_view"
            referencedColumns: ["topic_id"]
          },
          {
            foreignKeyName: "user_lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_complete_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_learning_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          linkedin: string | null
          prof_id: string
          profile_complete: boolean
          twitter: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          linkedin?: string | null
          prof_id: string
          profile_complete?: boolean
          twitter?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          linkedin?: string | null
          prof_id?: string
          profile_complete?: boolean
          twitter?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_prof_id_fkey"
            columns: ["prof_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_prof_id_fkey"
            columns: ["prof_id"]
            isOneToOne: true
            referencedRelation: "user_complete_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_prof_id_fkey"
            columns: ["prof_id"]
            isOneToOne: true
            referencedRelation: "user_learning_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string
          language: string | null
          notifications: Json | null
          prof_id: string
          timezone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          language?: string | null
          notifications?: Json | null
          prof_id: string
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          language?: string | null
          notifications?: Json | null
          prof_id?: string
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_prof_id_fkey"
            columns: ["prof_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["prof_id"]
          },
        ]
      }
      video_responses: {
        Row: {
          coach_id: string
          created_at: string
          error_message: string | null
          id: string
          processing_duration: number | null
          question: string | null
          replica_type: string | null
          script_used: string | null
          status: string
          student_id: string
          tavus_video_id: string
          template_id: string
          topic: string | null
          updated_at: string
          url: string | null
          user_level: string | null
        }
        Insert: {
          coach_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          processing_duration?: number | null
          question?: string | null
          replica_type?: string | null
          script_used?: string | null
          status?: string
          student_id: string
          tavus_video_id: string
          template_id: string
          topic?: string | null
          updated_at?: string
          url?: string | null
          user_level?: string | null
        }
        Update: {
          coach_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          processing_duration?: number | null
          question?: string | null
          replica_type?: string | null
          script_used?: string | null
          status?: string
          student_id?: string
          tavus_video_id?: string
          template_id?: string
          topic?: string | null
          updated_at?: string
          url?: string | null
          user_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_responses_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "video_responses_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_statistics"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "video_responses_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "video_responses_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_progress"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "video_responses_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "video_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      video_templates: {
        Row: {
          coach_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          script: string
          tavus_template_id: string
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          script: string
          tavus_template_id: string
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          script?: string
          tavus_template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_templates_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "video_templates_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_statistics"
            referencedColumns: ["coach_id"]
          },
        ]
      }
    }
    Views: {
      coach_statistics: {
        Row: {
          coach_id: string | null
          earnings: number | null
          enrolled_students: number | null
          hourly_rate: number | null
          name: string | null
          rating: number | null
          subscription_active: boolean | null
          total_live_sessions: number | null
          total_sessions: number | null
          total_students: number | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_profiles_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["prof_id"]
          },
        ]
      }
      public_platform_stats: {
        Row: {
          avg_rating: number | null
          expert_count: number | null
          session_count: number | null
          topic_count: number | null
          total_users: number | null
        }
        Relationships: []
      }
      session_analytics: {
        Row: {
          avg_price: number | null
          cancelled_sessions: number | null
          completed_sessions: number | null
          month: string | null
          total_revenue: number | null
          total_sessions: number | null
        }
        Relationships: []
      }
      student_progress: {
        Row: {
          courses_completed_count: number | null
          current_level: Database["public"]["Enums"]["student_level"] | null
          enrolled_live_sessions: number | null
          name: string | null
          selected_coach_id: string | null
          student_id: string | null
          tokens_earned: number | null
          total_sessions: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_selected_coach_id_fkey"
            columns: ["selected_coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "student_profiles_selected_coach_id_fkey"
            columns: ["selected_coach_id"]
            isOneToOne: false
            referencedRelation: "coach_statistics"
            referencedColumns: ["coach_id"]
          },
          {
            foreignKeyName: "student_profiles_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["prof_id"]
          },
        ]
      }
      topic_progress_view: {
        Row: {
          completed_lessons: number | null
          completion_rate: number | null
          description: string | null
          estimated_duration: number | null
          level: string | null
          students_enrolled: number | null
          title: string | null
          topic_id: string | null
          total_lessons: number | null
        }
        Relationships: []
      }
      upcoming_sessions: {
        Row: {
          coach_name: string | null
          duration: number | null
          id: string | null
          notes: string | null
          price: number | null
          scheduled_time: string | null
          status: Database["public"]["Enums"]["session_status"] | null
          student_name: string | null
        }
        Relationships: []
      }
      user_complete_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          id: string | null
          language: string | null
          linkedin: string | null
          name: string | null
          notifications: Json | null
          profile_complete: boolean | null
          role: string | null
          subscription_status: string | null
          timezone: string | null
          twitter: string | null
          updated_at: string | null
          website: string | null
        }
        Relationships: []
      }
      user_learning_dashboard: {
        Row: {
          completed_lessons: number | null
          current_streak_days: number | null
          last_activity_date: string | null
          name: string | null
          topics_completed: number | null
          topics_started: number | null
          total_time_minutes: number | null
          total_xp: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_read_time: {
        Args: { content: string }
        Returns: number
      }
      generate_slug: {
        Args: { title: string }
        Returns: string
      }
      populate_role_specific_tables: {
        Args: Record<PropertyKey, never>
        Returns: {
          students_added: number
          coaches_added: number
        }[]
      }
    }
    Enums: {
      session_status: "scheduled" | "completed" | "cancelled"
      student_level: "beginner" | "intermediate" | "advanced"
      user_role: "student" | "coach" | "admin"
      verification_status: "pending" | "verified" | "rejected"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      session_status: ["scheduled", "completed", "cancelled"],
      student_level: ["beginner", "intermediate", "advanced"],
      user_role: ["student", "coach", "admin"],
      verification_status: ["pending", "verified", "rejected"],
    },
  },
} as const
