import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key'

// Add a check for valid environment variables
export const isSupabaseConfigured = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && 
         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
         process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'placeholder_key'
}

// Singleton pattern to avoid multiple client instances
let supabaseInstance: SupabaseClient | null = null

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null
  }
  
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: 'pkce'
      }
    })
  }
  
  return supabaseInstance
}

// Note: The main supabase client is now managed by AuthProvider
// Use useAuth() hook to access the configured client instead of importing this
// export const supabase = ...

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