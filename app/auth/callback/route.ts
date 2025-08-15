import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const state = requestUrl.searchParams.get('state')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    return NextResponse.redirect(new URL(`/auth/signin?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || '')}`, request.url))
  }

  // Check for required parameters
  if (!code) {
    console.error('No authorization code received')
    return NextResponse.redirect(new URL('/auth/signin?error=no_code&description=No authorization code received', request.url))
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
      return NextResponse.redirect(new URL(`/auth/signin?error=exchange_failed&description=${encodeURIComponent(exchangeError.message)}`, request.url))
    }

    if (data?.user) {
      console.log('Successfully authenticated user:', data.user.email)
      // Redirect to dashboard on successful authentication
      return NextResponse.redirect(new URL(next, request.url))
    } else {
      console.error('No user data received after code exchange')
      return NextResponse.redirect(new URL('/auth/signin?error=no_user&description=No user data received', request.url))
    }
  } catch (err) {
    console.error('Unexpected error in OAuth callback:', err)
    return NextResponse.redirect(new URL('/auth/signin?error=unexpected&description=An unexpected error occurred', request.url))
  }
}
