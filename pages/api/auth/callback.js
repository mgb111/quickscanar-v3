import { createServerClient } from '@supabase/ssr'

export default async function handler(req, res) {
  const code = req.query.code
  const next = req.query.next || '/dashboard'

  if (code) {
    try {
      // Create Supabase client for pages router
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          cookies: {
            getAll() {
              return Object.entries(req.cookies || {}).map(([name, value]) => ({
                name,
                value,
              }))
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                res.setHeader('Set-Cookie', `${name}=${value}; Path=/; HttpOnly; SameSite=Lax`)
              })
            },
          },
        }
      )
      
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error exchanging code for session:', error)
        return res.redirect('/auth/signin?error=auth_error')
      }
      
      if (!data.session) {
        console.error('No session created after code exchange')
        return res.redirect('/auth/signin?error=no_session')
      }
      
      console.log('✅ Session created successfully for user:', data.session.user.email)
      
    } catch (error) {
      console.error('Error in callback handler:', error)
      return res.redirect('/auth/signin?error=auth_error')
    }
  } else {
    console.error('No authorization code received')
    return res.redirect('/auth/signin?error=no_code')
  }

  // Redirect to dashboard on success
  res.redirect(next)
}
