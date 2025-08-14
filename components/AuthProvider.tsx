'use client'

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { createClient, User, SupabaseClient } from '@supabase/supabase-js'
import { isSupabaseConfigured } from '@/lib/supabase'

type AuthContextType = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  supabaseError: string | null
  supabase: SupabaseClient | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabaseError, setSupabaseError] = useState<string | null>(null)

  // Create a single Supabase client instance
  const supabase = useMemo(() => {
    if (!isSupabaseConfigured()) {
      return null
    }
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }, [])

  // Test connection with timeout
  const testConnection = useCallback(async () => {
    if (!supabase) return
    
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      )
      
      const connectionPromise = supabase.from('ar_experiences').select('count', { count: 'exact', head: true })
      
      const result = await Promise.race([connectionPromise, timeoutPromise])
      const { error } = result as any
      
      if (error) {
        console.error('Supabase connection test failed:', error)
        setSupabaseError(`Connection failed: ${error.message}`)
      }
    } catch (err: any) {
      console.error('Supabase connection error:', err)
      setSupabaseError(`Connection error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    if (!supabase) {
      console.warn('Supabase not configured, running in demo mode')
      setLoading(false)
      return
    }

    let mounted = true
    let subscription: any = null

    const initializeAuth = async () => {
      try {
        // Test connection first
        await testConnection()
        
        if (!mounted) return

        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        if (!mounted) return
        
        if (error) {
          console.error('Error getting session:', error)
          setSupabaseError(`Session error: ${error.message}`)
        } else if (session) {
          setUser(session.user)
        }

        // Listen for auth changes
        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!mounted) return
            setUser(session?.user ?? null)
            setLoading(false)
          }
        )
        
        subscription = authSubscription
      } catch (err: any) {
        if (mounted) {
          console.error('Auth initialization error:', err)
          setSupabaseError(`Initialization error: ${err.message}`)
          setLoading(false)
        }
      }
    }

    initializeAuth()

    return () => {
      mounted = false
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [supabase, testConnection])

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Supabase not configured')
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
  }

  const signUp = async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Supabase not configured')
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) throw error
  }

  const signInWithGoogle = async () => {
    if (!supabase) {
      throw new Error('Supabase not configured')
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) throw error
  }

  const signOut = async () => {
    if (!supabase) {
      setUser(null)
      return
    }

    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithGoogle, signOut, supabaseError, supabase }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 