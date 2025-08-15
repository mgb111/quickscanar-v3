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
    return NextResponse.redirect(new URL(`/auth/signin?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || '')}`, baseUrl))
  }

  // Check for required parameters
  if (!code) {
    console.error('No authorization code received')
    console.error('This usually means the callback URL is wrong or Google is not sending the code')
    return NextResponse.redirect(new URL('/auth/signin?error=no_code&description=No authorization code received', baseUrl))
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
