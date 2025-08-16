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
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    console.log('🔧 Creating Supabase client with:')
    console.log('  URL:', supabaseUrl)
    console.log('  Key (first 20 chars):', supabaseKey.substring(0, 20) + '...')
    
    const client = createClient(supabaseUrl, supabaseKey)
    
    // Test the client configuration
    console.log('  Client created successfully')
    console.log('  Using environment URL:', supabaseUrl)
    
    return client
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

    // CRITICAL FIX: Force the correct redirect URL to override Supabase bug
    const redirectUrl = 'https://quickscanar.com/auth/callback'
    
    console.log('=== OAuth Redirect Debug ===')
    console.log('🔧 FORCING redirect URL to override Supabase bug:', redirectUrl)
    console.log('Current hostname:', typeof window !== 'undefined' ? window.location.hostname : 'server-side')
    console.log('Current origin:', typeof window !== 'undefined' ? window.location.origin : 'server-side')
    console.log('=== End OAuth Debug ===')

    // CRITICAL: Validate the redirect URL format
    try {
      new URL(redirectUrl) // This will throw if URL is invalid
      console.log('✅ Redirect URL is valid:', redirectUrl)
    } catch (urlError) {
      console.error('❌ Invalid redirect URL:', redirectUrl)
      throw new Error(`Invalid redirect URL: ${redirectUrl}`)
    }

    // CRITICAL: Force the redirect URL to override Supabase's internal bug
    console.log('🔍 Sending to Supabase with FORCED redirect:')
    console.log('  Provider: google')
    console.log('  RedirectTo (FORCED):', redirectUrl)
    console.log('  Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

    // CRITICAL: Set up redirect interceptor BEFORE calling OAuth
    let redirectObserver: any = null
    if (typeof window !== 'undefined') {
      console.log('🔧 Setting up redirect interceptor...')
      
      // Use MutationObserver to watch for navigation changes
      redirectObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            // Check if the current URL is a relative redirect
            const currentUrl = window.location.href
            if (currentUrl.includes('/auth/callback') && !currentUrl.includes('quickscanar.com')) {
              console.log('🚨 CRITICAL: Detected relative redirect, forcing to production URL')
              
              // Force redirect to production URL
              const productionUrl = `https://quickscanar.com${window.location.pathname}${window.location.search}`
              console.log('🔄 Redirecting to:', productionUrl)
              
              // Use a small delay to ensure the redirect happens
              setTimeout(() => {
                window.location.href = productionUrl
              }, 100)
            }
          }
        })
      })
      
      // Start observing
      redirectObserver.observe(document.body, {
        childList: true,
        subtree: true
      })
      
      console.log('✅ Redirect interceptor set up with MutationObserver')
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      })

      if (error) {
        console.error('❌ OAuth error:', error)
        throw error
      }
      
      console.log('✅ OAuth request sent successfully with FORCED redirect:', redirectUrl)
      console.log('🔧 This should override Supabase internal redirect bug')
      
    } catch (error) {
      console.error('❌ OAuth request failed:', error)
      
      // Disconnect the redirect observer
      if (typeof window !== 'undefined' && redirectObserver) {
        redirectObserver.disconnect()
        console.log('🔄 Disconnected redirect observer')
      }
      
      throw error
    }
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