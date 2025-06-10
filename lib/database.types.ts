// lib/database.types.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          role: string | null
          subscription_status: string | null
          updated_at: string | null
        }
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
          status: "scheduled" | "completed" | "cancelled" | null
          student_id: string
          updated_at: string
        }
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
      }
    }
  }
}