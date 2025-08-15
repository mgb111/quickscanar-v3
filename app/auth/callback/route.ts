import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  
  // CRITICAL: Debug all incoming parameters
  console.log('=== OAuth Callback Debug ===')
  console.log('Full request URL:', request.url)
  console.log('Request hostname:', requestUrl.hostname)
  console.log('Request pathname:', requestUrl.pathname)
  console.log('All search params:', Object.fromEntries(requestUrl.searchParams.entries()))
  
  const code = requestUrl.searchParams.get('code')
  const state = requestUrl.searchParams.get('state')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  console.log('Extracted parameters:')
  console.log('  code:', code ? `${code.substring(0, 20)}...` : 'null')
  console.log('  state:', state ? `${state.substring(0, 20)}...` : 'null')
  console.log('  error:', error)
  console.log('  error_description:', errorDescription)
  console.log('  next:', next)
  console.log('=== End Callback Debug ===')

  // CRITICAL: Handle the case where Supabase redirects to relative path
  // This happens when Supabase's Site URL is not properly configured
  if (requestUrl.pathname === '/auth/callback' && !code && !error) {
    console.log('⚠️  Supabase redirected to relative path - this indicates Site URL misconfiguration')
    console.log('🔧 Attempting to extract code from referrer or other sources...')
    
    // Try to get the code from the referrer header
    const referer = request.headers.get('referer')
    if (referer) {
      console.log('📋 Referer header:', referer)
      try {
        const refererUrl = new URL(referer)
        const refererCode = refererUrl.searchParams.get('code')
        if (refererCode) {
          console.log('✅ Found code in referrer:', refererCode.substring(0, 20) + '...')
          // Continue with the code from referrer
          const refererState = refererUrl.searchParams.get('state')
          if (refererCode && refererState) {
            // Use the code from referrer
            console.log('🔄 Using code from referrer for authentication')
            return await handleAuthentication(refererCode, refererState, next, requestUrl)
          }
        }
      } catch (refererError) {
        console.log('❌ Could not parse referrer URL:', refererError)
      }
    }
    
    // CRITICAL: Try to redirect to the absolute URL to see if that works
    console.log('🔄 Attempting to redirect to absolute callback URL...')
    const absoluteCallbackUrl = `https://quickscanar.com/auth/callback${requestUrl.search ? requestUrl.search : ''}`
    console.log('🎯 Redirecting to:', absoluteCallbackUrl)
    
    // If we still don't have a code, redirect to signin with helpful error
    console.error('❌ No authorization code found in request or referrer')
    return NextResponse.redirect(new URL('/auth/signin?error=no_code&description=No authorization code received - check Google OAuth redirect URIs', requestUrl.origin))
  }

  // Determine the base URL for redirects
  let baseUrl: string
  if (requestUrl.hostname === 'localhost' || requestUrl.hostname === '127.0.0.1') {
    // Development: use current origin
    baseUrl = requestUrl.origin
  } else {
    // Production: use quickscanar.com
    baseUrl = 'https://quickscanar.com'
  }

  console.log('Callback base URL:', baseUrl)
  console.log('Request hostname:', requestUrl.hostname)

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    
    // Handle specific PKCE errors
    if (error === 'invalid_request' && errorDescription?.includes('auth code and code verifier')) {
      console.error('❌ PKCE Error: Code verifier missing or corrupted')
      return NextResponse.redirect(new URL('/auth/signin?error=pkce_error&description=Authentication session expired. Please try signing in again.', baseUrl))
    }
    
    return NextResponse.redirect(new URL(`/auth/signin?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || '')}`, baseUrl))
  }

  // Check for required parameters
  if (!code) {
    console.error('No authorization code received')
    console.error('This usually means the callback URL is wrong or Google is not sending the code')
    return NextResponse.redirect(new URL('/auth/signin?error=no_code&description=No authorization code received', baseUrl))
  }

  // Handle authentication with the provided code
  return await handleAuthentication(code, state, next, requestUrl)
}

// Helper function to handle authentication
async function handleAuthentication(code: string, state: string | null, next: string, requestUrl: URL) {
  // Determine the base URL for redirects
  let baseUrl: string
  if (requestUrl.hostname === 'localhost' || requestUrl.hostname === '127.0.0.1') {
    // Development: use current origin
    baseUrl = requestUrl.origin
  } else {
    // Production: use quickscanar.com
    baseUrl = 'https://quickscanar.com'
  }

  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )
    
    // Exchange the authorization code for a session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError)
      return NextResponse.redirect(new URL(`/auth/signin?error=exchange_failed&description=${encodeURIComponent(exchangeError.message)}`, baseUrl))
    }

    if (data?.user) {
      console.log('Successfully authenticated user:', data.user.email)
      // Redirect to dashboard on successful authentication
      return NextResponse.redirect(new URL(next, baseUrl))
    } else {
      console.error('No user data received after code exchange')
      return NextResponse.redirect(new URL('/auth/signin?error=no_user&description=No user data received', baseUrl))
    }
  } catch (err) {
    console.error('Unexpected error in OAuth callback:', err)
    return NextResponse.redirect(new URL('/auth/signin?error=unexpected&description=An unexpected error occurred', baseUrl))
  }
}
