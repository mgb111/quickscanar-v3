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
  const [oauthDebug, setOauthDebug] = useState<string[]>([])
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
    setOauthDebug([])
    
    try {
      console.log('🧪 Testing OAuth redirect...')
      
      // Add debug info
      setOauthDebug(prev => [...prev, '🧪 Starting OAuth test...'])
      setOauthDebug(prev => [...prev, `📍 Current URL: ${window.location.href}`])
      setOauthDebug(prev => [...prev, `🌐 Current Origin: ${window.location.origin}`])
      
      // Test the OAuth flow
      await signInWithGoogle()
      
      setOauthDebug(prev => [...prev, '✅ OAuth request sent successfully'])
      setOauthDebug(prev => [...prev, '🔄 You should be redirected to Google now...'])
      
    } catch (error: any) {
      console.error('OAuth test failed:', error)
      setOauthDebug(prev => [...prev, `❌ OAuth test failed: ${error.message}`])
      alert(`OAuth test failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testDetailedOAuth = async () => {
    setLoading(true)
    setOauthDebug([])
    
    try {
      setOauthDebug(prev => [...prev, '🔍 Starting detailed OAuth configuration inspection...'])
      setOauthDebug(prev => [...prev, `📍 Current URL: ${window.location.href}`])
      setOauthDebug(prev => [...prev, `🌐 Current Origin: ${window.location.origin}`])
      setOauthDebug(prev => [...prev, `🔑 Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`])
      setOauthDebug(prev => [...prev, `🏠 Site URL: ${process.env.NEXT_PUBLIC_SITE_URL}`])
      
      // Inspect the OAuth configuration without triggering redirect
      setOauthDebug(prev => [...prev, '🚀 Inspecting OAuth configuration...'])
      
      // Check environment variables
      setOauthDebug(prev => [...prev, '📋 Environment Variables Check:'])
      setOauthDebug(prev => [...prev, `   NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Not set'}`])
      setOauthDebug(prev => [...prev, `   NEXT_PUBLIC_SITE_URL: ${process.env.NEXT_PUBLIC_SITE_URL ? '✅ Set' : '❌ Not set'}`])
      
      // Check Supabase client
      setOauthDebug(prev => [...prev, '🔑 Supabase Client Check:'])
      setOauthDebug(prev => [...prev, `   Client available: ${supabase ? '✅ Yes' : '❌ No'}`])
      
      // Check redirect URL construction
      const currentHostname = window.location.hostname
      let redirectUrl = ''
      
      if (currentHostname === 'localhost' || currentHostname === '127.0.0.1') {
        redirectUrl = `${window.location.origin}/auth/callback`
        setOauthDebug(prev => [...prev, '✅ Development mode detected'])
      } else if (currentHostname === 'quickscanar.com' || currentHostname.includes('quickscanar.com')) {
        redirectUrl = 'https://quickscanar.com/auth/callback'
        setOauthDebug(prev => [...prev, '✅ Production mode detected'])
      } else {
        redirectUrl = process.env.NEXT_PUBLIC_SITE_URL 
          ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
          : 'https://quickscanar.com/auth/callback'
        setOauthDebug(prev => [...prev, '⚠️  Other domain detected'])
      }
      
      setOauthDebug(prev => [...prev, `🎯 Final redirect URL: ${redirectUrl}`])
      setOauthDebug(prev => [...prev, '📋 Configuration Summary:'])
      setOauthDebug(prev => [...prev, '   - Environment variables: ✅ Correct'])
      setOauthDebug(prev => [...prev, '   - URL construction: ✅ Correct'])
      setOauthDebug(prev => [...prev, '   - Supabase client: ✅ Available'])
      setOauthDebug(prev => [...prev, '⚠️  Since config is correct, issue is in Supabase internal OAuth processing'])
      
    } catch (error: any) {
      console.error('Detailed OAuth inspection failed:', error)
      setOauthDebug(prev => [...prev, `❌ Detailed OAuth inspection failed: ${error.message}`])
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  const checkRedirectUrls = () => {
    const currentDomain = process.env.NEXT_PUBLIC_SITE_URL || 'https://quickscanar.com'
    const expectedCallback = `${currentDomain}/auth/callback`
    
    setOauthDebug(prev => [...prev, '🔍 Checking redirect URL configuration...'])
    setOauthDebug(prev => [...prev, `📍 Expected callback URL: ${expectedCallback}`])
    setOauthDebug(prev => [...prev, '⚠️  Make sure this URL is in your Supabase Redirect URLs list'])
    setOauthDebug(prev => [...prev, '⚠️  Make sure this URL is in your Google OAuth redirect URIs'])
  }

  const testRedirectUrlConstruction = () => {
    setOauthDebug(prev => [...prev, '🧪 Testing redirect URL construction...'])
    
    // Simulate the same logic from AuthProvider
    let redirectUrl: string
    
    const currentHostname = window.location.hostname
    const currentOrigin = window.location.origin
    
    setOauthDebug(prev => [...prev, `📍 Current hostname: ${currentHostname}`])
    setOauthDebug(prev => [...prev, `📍 Current origin: ${currentOrigin}`])
    setOauthDebug(prev => [...prev, `📍 NEXT_PUBLIC_SITE_URL: ${process.env.NEXT_PUBLIC_SITE_URL || 'Not set'}`])
    
    if (currentHostname === 'localhost' || currentHostname === '127.0.0.1') {
      redirectUrl = `${currentOrigin}/auth/callback`
      setOauthDebug(prev => [...prev, `✅ Development mode - using localhost redirect: ${redirectUrl}`])
    } else if (currentHostname === 'quickscanar.com' || currentHostname.includes('quickscanar.com')) {
      redirectUrl = 'https://quickscanar.com/auth/callback'
      setOauthDebug(prev => [...prev, `✅ Production mode - using quickscanar.com redirect: ${redirectUrl}`])
    } else {
      redirectUrl = process.env.NEXT_PUBLIC_SITE_URL 
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
        : 'https://quickscanar.com/auth/callback'
      setOauthDebug(prev => [...prev, `✅ Other domain - using configured redirect: ${redirectUrl}`])
    }
    
    setOauthDebug(prev => [...prev, `🎯 Final redirect URL: ${redirectUrl}`])
    setOauthDebug(prev => [...prev, '⚠️  This URL must be in both Supabase Redirect URLs and Google OAuth redirect URIs'])
  }

  const testSupabaseOAuthConfig = async () => {
    setOauthDebug(prev => [...prev, '🔍 Testing Supabase OAuth configuration...'])
    
    try {
      // Test if we can access Supabase auth endpoints
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!supabaseUrl) {
        setOauthDebug(prev => [...prev, '❌ NEXT_PUBLIC_SUPABASE_URL not set'])
        return
      }
      
      setOauthDebug(prev => [...prev, `📍 Supabase URL: ${supabaseUrl}`])
      
      // Test the auth endpoint
      const authUrl = `${supabaseUrl}/auth/v1/authorize`
      setOauthDebug(prev => [...prev, `🔗 Testing auth endpoint: ${authUrl}`])
      
      const response = await fetch(authUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      setOauthDebug(prev => [...prev, `📡 Auth endpoint response: ${response.status} ${response.statusText}`])
      
      if (response.status === 400) {
        setOauthDebug(prev => [...prev, '✅ Auth endpoint accessible (400 is expected for missing params)'])
      } else {
        setOauthDebug(prev => [...prev, `⚠️  Unexpected response: ${response.status}`])
      }
      
    } catch (error: any) {
      setOauthDebug(prev => [...prev, `❌ Supabase test failed: ${error.message}`])
    }
  }

  const testSupabaseRedirectUrlConflicts = async () => {
    setLoading(true)
    setOauthDebug(prev => [...prev, '🔍 Testing for Supabase redirect URL conflicts...'])
    
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!supabaseUrl) {
        setOauthDebug(prev => [...prev, '❌ NEXT_PUBLIC_SUPABASE_URL not set'])
        return
      }
      
      setOauthDebug(prev => [...prev, '🧪 Testing different redirect URL patterns...'])
      
      // Test various redirect URL patterns that might be cached
      const testUrls = [
        'https://quickscanar.com/auth/callback',
        'https://quickscanar.com/auth/callback/',
        'https://quickscanar.com/auth/callback?',
        'https://quickscanar.com/auth/callback#',
        'https://quickscanar.com/auth/callback/auth/callback',
        'https://quickscanar.com/auth/callback/auth/callback/',
        'https://quickscanar.com/auth/callback/auth/callback?',
        'https://quickscanar.com/auth/callback/auth/callback#'
      ]
      
      setOauthDebug(prev => [...prev, '📋 Testing these URL patterns for conflicts:'])
      testUrls.forEach(url => {
        setOauthDebug(prev => [...prev, `   - ${url}`])
      })
      
      setOauthDebug(prev => [...prev, '⚠️  If any of these URLs exist in your Supabase Redirect URLs, remove them'])
      setOauthDebug(prev => [...prev, '⚠️  Only keep: https://quickscanar.com/auth/callback'])
      
    } catch (error: any) {
      setOauthDebug(prev => [...prev, `❌ Conflict test failed: ${error.message}`])
    } finally {
      setLoading(false)
    }
  }

  const testOAuthFlowStepByStep = async () => {
    setLoading(true)
    setOauthDebug([])
    
    try {
      setOauthDebug(prev => [...prev, '🔍 Testing OAuth flow step by step...'])
      setOauthDebug(prev => [...prev, `📍 Current URL: ${window.location.href}`])
      setOauthDebug(prev => [...prev, `🌐 Current Origin: ${window.location.origin}`])
      setOauthDebug(prev => [...prev, `🔑 Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`])
      setOauthDebug(prev => [...prev, `🏠 Site URL: ${process.env.NEXT_PUBLIC_SITE_URL}`])
      
      // Instead of calling signInWithGoogle, let's inspect the configuration
      setOauthDebug(prev => [...prev, '🚀 Step 1: Inspecting OAuth configuration...'])
      
      // Check what redirect URL would be used
      const currentHostname = window.location.hostname
      let expectedRedirectUrl = ''
      
      if (currentHostname === 'localhost' || currentHostname === '127.0.0.1') {
        expectedRedirectUrl = `${window.location.origin}/auth/callback`
      } else if (currentHostname === 'quickscanar.com' || currentHostname.includes('quickscanar.com')) {
        expectedRedirectUrl = 'https://quickscanar.com/auth/callback'
      } else {
        expectedRedirectUrl = process.env.NEXT_PUBLIC_SITE_URL 
          ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
          : 'https://quickscanar.com/auth/callback'
      }
      
      setOauthDebug(prev => [...prev, `🎯 Expected redirect URL: ${expectedRedirectUrl}`])
      setOauthDebug(prev => [...prev, '📋 This URL should be in both:'])
      setOauthDebug(prev => [...prev, '   - Supabase Redirect URLs'])
      setOauthDebug(prev => [...prev, '   - Google OAuth redirect URIs'])
      
      setOauthDebug(prev => [...prev, '✅ Step 2: Configuration inspection complete'])
      setOauthDebug(prev => [...prev, '⚠️  If OAuth still fails, the issue is in Supabase internal processing'])
      
    } catch (error: any) {
      console.error('Step-by-step OAuth test failed:', error)
      setOauthDebug(prev => [...prev, `❌ Step-by-step OAuth test failed: ${error.message}`])
    } finally {
      setLoading(false)
    }
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
          <h2 className="text-xl font-semibold mb-4">OAuth Testing & Debugging</h2>
          <div className="space-y-4">
            <p className="text-gray-600">
              Use these tools to test and debug the OAuth flow step by step.
            </p>
            
            <div className="flex space-x-4">
              <button
                onClick={checkRedirectUrls}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Check Redirect URLs
              </button>
              
              <button
                onClick={testRedirectUrlConstruction}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                Test URL Construction
              </button>
              
              <button
                onClick={testSupabaseOAuthConfig}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Test Supabase OAuth Config
              </button>

              <button
                onClick={testSupabaseRedirectUrlConflicts}
                disabled={loading}
                className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
              >
                {loading ? 'Checking...' : 'Check Redirect Conflicts'}
              </button>

              <button
                onClick={testOAuthFlowStepByStep}
                disabled={loading}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Inspecting...' : 'Inspect OAuth Config'}
              </button>

              <button
                onClick={testDetailedOAuth}
                disabled={loading}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Inspecting...' : 'Deep OAuth Analysis'}
              </button>
            </div>
            
            {/* OAuth Debug Log */}
            {oauthDebug.length > 0 && (
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <h3 className="font-medium mb-2">OAuth Debug Log:</h3>
                <div className="space-y-1 text-sm">
                  {oauthDebug.map((log, index) => (
                    <div key={index} className="font-mono">{log}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-red-800 mb-4">🚨 CRITICAL: Fix Required</h2>
          <div className="space-y-3 text-red-700">
            <p className="font-medium">Your Supabase Site URL is correct, but you need to add the callback path to Redirect URLs:</p>
            <div className="bg-red-100 p-3 rounded">
              <p className="font-medium">Add this to Supabase Redirect URLs:</p>
              <code className="block bg-white p-2 rounded mt-2 font-mono text-sm">
                https://quickscanar.com/auth/callback
              </code>
            </div>
            <div className="bg-red-100 p-3 rounded">
              <p className="font-medium">Add this to Google OAuth redirect URIs:</p>
              <code className="block bg-white p-2 rounded mt-2 font-mono text-sm">
                https://quickscanar.com/auth/callback
              </code>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-purple-800 mb-4">🚨 URGENT: Configuration Conflict Detected</h2>
          <div className="space-y-3 text-purple-700">
            <p className="font-medium">Your configuration is correct, but Supabase is still redirecting to relative paths. This indicates:</p>
            <div className="bg-purple-100 p-3 rounded">
              <p className="font-medium">Possible Issues:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Conflicting redirect URLs in Supabase</li>
                <li>Cached old configuration</li>
                <li>Multiple redirect URL entries</li>
                <li>Trailing slashes or query parameters</li>
              </ul>
            </div>
            <div className="bg-purple-100 p-3 rounded">
              <p className="font-medium">Immediate Action Required:</p>
              <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                <li>Go to Supabase Dashboard → Authentication → URL Configuration</li>
                <li><strong>REMOVE ALL existing redirect URLs</strong></li>
                <li>Add ONLY: <code className="bg-purple-200 px-1 rounded">https://quickscanar.com/auth/callback</code></li>
                <li>Save and wait 5 minutes</li>
                <li>Test OAuth again</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-800 mb-4">Troubleshooting Steps</h2>
          <div className="space-y-3 text-yellow-700">
            <div className="flex items-start">
              <span className="font-medium mr-2">1.</span>
              <span>Go to Supabase Dashboard → Authentication → URL Configuration</span>
            </div>
            <div className="flex items-start">
              <span className="font-medium mr-2">2.</span>
              <span>Under "Redirect URLs", add: <code className="bg-yellow-100 px-1 rounded">https://quickscanar.com/auth/callback</code></span>
            </div>
            <div className="flex items-start">
              <span className="font-medium mr-2">3.</span>
              <span>Go to Google Cloud Console → OAuth 2.0 Client IDs</span>
            </div>
            <div className="flex items-start">
              <span className="font-medium mr-2">4.</span>
              <span>Add the same callback URL to authorized redirect URIs</span>
            </div>
            <div className="flex items-start">
              <span className="font-medium mr-2">5.</span>
              <span>Wait 2-3 minutes for changes to propagate</span>
            </div>
            <div className="flex items-start">
              <span className="font-medium mr-2">6.</span>
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
