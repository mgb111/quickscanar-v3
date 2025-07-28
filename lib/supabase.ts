import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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