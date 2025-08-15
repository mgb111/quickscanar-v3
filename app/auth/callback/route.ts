import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    return NextResponse.redirect(new URL(`/auth/signin?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || '')}`, request.url))
  }

  if (!code) {
    console.error('No authorization code received')
    return NextResponse.redirect(new URL('/auth/signin?error=no_code&description=No authorization code received', request.url))
  }

  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Exchange the authorization code for a session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError)
      return NextResponse.redirect(new URL(`/auth/signin?error=exchange_failed&description=${encodeURIComponent(exchangeError.message)}`, request.url))
    }

    if (data?.user) {
      console.log('Successfully authenticated user:', data.user.email)
      // Redirect to dashboard on successful authentication
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else {
      console.error('No user data received after code exchange')
      return NextResponse.redirect(new URL('/auth/signin?error=no_user&description=No user data received', request.url))
    }
  } catch (err) {
    console.error('Unexpected error in OAuth callback:', err)
    return NextResponse.redirect(new URL('/auth/signin?error=unexpected&description=An unexpected error occurred', request.url))
  }
}
