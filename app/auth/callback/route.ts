import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    
    try {
      // CRITICAL: Wait for the result and check if it was successful
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error exchanging code for session:', error)
        return NextResponse.redirect(new URL('/auth/signin?error=auth_error', requestUrl.origin))
      }
      
      if (!data.session) {
        console.error('No session created after code exchange')
        return NextResponse.redirect(new URL('/auth/signin?error=no_session', requestUrl.origin))
      }
      
      console.log('✅ Session created successfully for user:', data.session.user.email)
      
    } catch (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(new URL('/auth/signin?error=auth_error', requestUrl.origin))
    }
  } else {
    console.error('No authorization code received')
    return NextResponse.redirect(new URL('/auth/signin?error=no_code', requestUrl.origin))
  }

  // Only redirect to dashboard if session creation was successful
  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
