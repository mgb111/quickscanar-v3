'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'

interface DebugInfo {
  timestamp?: string
  userAgent?: string
  currentUrl?: string
  currentOrigin?: string
  currentHostname?: string
  environment: {
    NODE_ENV?: string
    NEXT_PUBLIC_SUPABASE_URL?: string
    NEXT_PUBLIC_SITE_URL?: string
    NEXT_PUBLIC_VERCEL_URL?: string
  }
  supabase: {
    url?: string
    hasClient: boolean
  }
}

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    environment: {},
    supabase: { hasClient: false }
  })
  const [loading, setLoading] = useState(false)
  const { signInWithGoogle, supabase } = useAuth()

  useEffect(() => {
    // Collect debug information
    const info: DebugInfo = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      currentUrl: window.location.href,
      currentOrigin: window.location.origin,
      currentHostname: window.location.hostname,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
        NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL,
      },
      supabase: {
        url: supabase ? 'Configured' : 'Not configured',
        hasClient: !!supabase,
      }
    }
    setDebugInfo(info)
  }, [supabase])

  const testOAuthRedirect = async () => {
    setLoading(true)
    try {
      console.log('🧪 Testing OAuth redirect...')
      await signInWithGoogle()
    } catch (error: any) {
      console.error('OAuth test failed:', error)
      alert(`OAuth test failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">OAuth Debug Information</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Configuration</h2>
          <div className="space-y-3">
            <div>
              <span className="font-medium">Current URL:</span>
              <span className="ml-2 font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                {debugInfo.currentUrl}
              </span>
            </div>
            <div>
              <span className="font-medium">Current Origin:</span>
              <span className="ml-2 font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                {debugInfo.currentOrigin}
              </span>
            </div>
            <div>
              <span className="font-medium">Current Hostname:</span>
              <span className="ml-2 font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                {debugInfo.currentHostname}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
          <div className="space-y-3">
            {Object.entries(debugInfo.environment || {}).map(([key, value]) => (
              <div key={key}>
                <span className="font-medium">{key}:</span>
                <span className="ml-2 font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                  {value || 'undefined'}
                </span>
                {value && (
                  <button
                    onClick={() => copyToClipboard(value as string)}
                    className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                  >
                    Copy
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Supabase Configuration</h2>
          <div className="space-y-3">
            <div>
              <span className="font-medium">Supabase Client:</span>
              <span className={`ml-2 px-2 py-1 rounded text-sm ${
                debugInfo.supabase?.hasClient ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {debugInfo.supabase?.hasClient ? 'Available' : 'Not Available'}
              </span>
            </div>
            <div>
              <span className="font-medium">Supabase URL:</span>
              <span className="ml-2 font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                {debugInfo.supabase?.url || 'Not configured'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">OAuth Testing</h2>
          <div className="space-y-4">
            <p className="text-gray-600">
              Click the button below to test the Google OAuth flow. This will help identify where the issue occurs.
            </p>
            <button
              onClick={testOAuthRedirect}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test OAuth Redirect'}
            </button>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-800 mb-4">Troubleshooting Steps</h2>
          <div className="space-y-3 text-yellow-700">
            <div className="flex items-start">
              <span className="font-medium mr-2">1.</span>
              <span>Check your Supabase project settings: <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline">Dashboard</a></span>
            </div>
            <div className="flex items-start">
              <span className="font-medium mr-2">2.</span>
              <span>Go to Settings → General and set Site URL to: <code className="bg-yellow-100 px-2 py-1 rounded">https://quickscanar.com</code></span>
            </div>
            <div className="flex items-start">
              <span className="font-medium mr-2">3.</span>
              <span>Wait 2-3 minutes for changes to propagate</span>
            </div>
            <div className="flex items-start">
              <span className="font-medium mr-2">4.</span>
              <span>Test the OAuth flow again</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Expected OAuth Flow</h2>
          <div className="space-y-2 text-blue-700 text-sm">
            <div>1. User clicks "Sign in with Google"</div>
            <div>2. Supabase redirects to Google OAuth</div>
            <div>3. Google redirects back to: <code className="bg-blue-100 px-1 rounded">https://quickscanar.com/auth/callback?code=...&state=...</code></div>
            <div>4. Callback route processes the code and creates session</div>
            <div>5. User is redirected to dashboard</div>
          </div>
        </div>
      </div>
    </div>
  )
} 
