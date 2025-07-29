import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key'

// Only create client if we have valid environment variables
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Add a check for valid environment variables
export const isSupabaseConfigured = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && 
         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
         process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'placeholder_key'
}

export type Database = {
  public: {
    Tables: {
      ar_experiences: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          marker_image_url: string
          mind_file_url: string
          video_url: string
          preview_image_url: string | null
          plane_width: number
          plane_height: number
          video_rotation: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          marker_image_url: string
          mind_file_url: string
          video_url: string
          preview_image_url?: string | null
          plane_width?: number
          plane_height?: number
          video_rotation?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          marker_image_url?: string
          mind_file_url?: string
          video_url?: string
          preview_image_url?: string | null
          plane_width?: number
          plane_height?: number
          video_rotation?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
} 