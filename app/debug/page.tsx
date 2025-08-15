'use client'

import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Camera, LogOut, User, Shield, Database, Globe } from 'lucide-react'
import toast from 'react-hot-toast'

export default function DebugPage() {
  const { user, loading, signOut, signInWithGoogle, supabase, supabaseError } = useAuth()
  const router = useRouter()
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
      toast.success('Redirecting to Google...')
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in with Google')
      setGoogleLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully')
      router.push('/')
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign out')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dark-blue mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading authentication status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-dark-blue mb-4">
            <Camera className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-black mb-4">
            QuickScanAR Debug Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Authentication and system status information
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Authentication Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <Shield className="h-6 w-6 text-dark-blue mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Authentication Status</h2>
            </div>
            
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-green-700 font-medium">Authenticated</span>
                </div>
                <div className="text-sm text-gray-600">
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>ID:</strong> {user.id}</p>
                  <p><strong>Provider:</strong> {user.app_metadata?.provider || 'email'}</p>
                  <p><strong>Created:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <LogOut className="h-4 w-4 inline mr-2" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-red-700 font-medium">Not Authenticated</span>
                </div>
                <p className="text-sm text-gray-600">You need to sign in to access the dashboard.</p>
                <div className="space-y-2">
                  <Link
                    href="/auth/signin"
                    className="block w-full bg-dark-blue hover:bg-red-800 text-white px-4 py-2 rounded-md text-sm font-medium text-center transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="block w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium text-center transition-colors"
                  >
                    Create Account
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Google OAuth Testing */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <Globe className="h-6 w-6 text-dark-blue mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Google OAuth Testing</h2>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Test Google sign-in functionality directly from this page.
              </p>
              
              <button
                onClick={handleGoogleSignIn}
                disabled={googleLoading || !!user}
                className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dark-blue disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {googleLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {user ? 'Already Signed In' : 'Test Google Sign-In'}
                  </>
                )}
              </button>
              
              {user && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                  <strong>Success!</strong> You are signed in with {user.app_metadata?.provider === 'google' ? 'Google' : 'email'}.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center mb-4">
            <Database className="h-6 w-6 text-dark-blue mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">System Status</h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Supabase Connection:</span>
              {supabase ? (
                <span className="text-green-600 font-medium">Connected</span>
              ) : (
                <span className="text-red-600 font-medium">Not Configured</span>
              )}
            </div>
            
            {supabaseError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">
                  <strong>Supabase Error:</strong> {supabaseError}
                </p>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Environment:</span>
              <span className="text-gray-600 font-mono text-sm">
                {process.env.NODE_ENV || 'development'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Supabase URL:</span>
              <span className="text-gray-600 font-mono text-sm">
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configured' : 'Not Set'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-dark-blue bg-white hover:bg-gray-50 border-dark-blue transition-colors"
          >
            Back to Home
          </Link>
          
          {user && (
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-dark-blue hover:bg-red-800 ml-3 transition-colors"
            >
              Go to Dashboard
            </Link>
          )}
        </div>
      </div>
    </div>
  )
} 
