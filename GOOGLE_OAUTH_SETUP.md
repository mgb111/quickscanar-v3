# Google OAuth Setup for QuickScanAR

This guide will help you set up Google Sign-In for your QuickScanAR application using Supabase.

## Current Implementation Status ✅

The Google OAuth infrastructure is now fully implemented in your codebase:

- ✅ Google OAuth button in sign-in page
- ✅ `signInWithGoogle` function in AuthProvider
- ✅ OAuth callback route with proper state handling
- ✅ Error display and user feedback
- ✅ Proper session management

## Prerequisites

- A Supabase project
- A Google Cloud Console project
- Basic knowledge of OAuth 2.0

## Step 1: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application" as the application type
   - Add authorized redirect URIs:
     - **Production**: `https://quickscanar.com/auth/callback`
     - **Vercel Preview**: `https://your-project.vercel.app/auth/callback`
     - **Development**: `http://localhost:54321/auth/v1/callback`
     - **Local Next.js**: `http://localhost:3002/auth/callback`
5. Note down your Client ID and Client Secret

## Step 2: Supabase Configuration

1. Go to your Supabase project dashboard
2. Navigate to "Authentication" > "Providers"
3. Find "Google" in the list and click "Edit"
4. Enable Google provider
5. Enter your Google OAuth credentials:
   - **Client ID**: Your Google OAuth Client ID
   - **Client Secret**: Your Google OAuth Client Secret
6. Save the configuration

## Step 3: Environment Variables

Make sure your environment variables are properly configured:

```env
# Required for Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional - for server-side operations
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Note**: Google OAuth credentials are configured in Supabase dashboard, not in client-side environment variables.

## Step 4: Test the Integration

1. Start your development server: `npm run dev`
2. Go to `/auth/signin`
3. Click "Sign in with Google"
4. You should be redirected to Google's OAuth consent screen
5. After authorization, you'll be redirected back to your app

## How It Works

1. **User clicks "Sign in with Google"** → `signInWithGoogle()` is called
2. **Supabase redirects to Google** → User sees Google consent screen
3. **Google redirects back** → To `/auth/callback` with authorization code and state
4. **Callback validates state** → Ensures OAuth security
5. **Callback exchanges code** → For user session using Supabase
6. **User is redirected** → To `/dashboard` on success

## Production Deployment

### For quickscanar.com:

1. **Google Cloud Console**: Add `https://quickscanar.com/auth/callback` as a redirect URI
2. **Vercel Deployment**: Your app will automatically use the production domain
3. **Environment Variables**: Ensure production environment variables are set in Vercel
4. **SSL Certificate**: Vercel automatically provides HTTPS for your domain

### Redirect URI Priority:

1. **Primary**: `https://quickscanar.com/auth/callback` (Production)
2. **Secondary**: `https://your-project.vercel.app/auth/callback` (Vercel fallback)
3. **Development**: `http://localhost:3002/auth/callback` (Local testing)

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI" error**:
   - Make sure the redirect URI in Google Cloud Console matches exactly
   - Check that your Supabase project URL is correct
   - For production: use `https://quickscanar.com/auth/callback`
   - For local development: use `http://localhost:3002/auth/callback`

2. **"Provider not enabled" error**:
   - Ensure Google provider is enabled in Supabase
   - Verify your OAuth credentials are correct
   - Check Supabase logs for detailed error messages

3. **"bad_oauth_state" error**:
   - This usually means the redirect URI doesn't match exactly
   - Ensure you're using the correct port for local dev (3002)
   - Check that the callback route is properly configured
   - Verify the state parameter is being passed correctly

4. **Callback errors**:
   - Check that the auth callback route is properly configured
   - Verify your environment variables
   - Check browser console and server logs

5. **Session not persisting**:
   - Ensure cookies are enabled in your browser
   - Check if you're using HTTPS in production
   - Verify Supabase session configuration

### 5. **CRITICAL**: OAuth still redirecting to localhost in production
    - **Root Cause**: Supabase project has incorrect site URL configured
    - **Solution**: 
      1. Go to Supabase Dashboard → Settings → General
      2. Check "Site URL" field - it should be `https://quickscanar.com`
      3. If it shows `http://localhost:3000` or similar, change it to `https://quickscanar.com`
      4. Save and restart your Supabase project
    - **Why This Happens**: Supabase uses the project's site URL as the base for OAuth redirects
    - **Verification**: After changing, test OAuth flow again

### Debug Steps

1. **Check browser console** for JavaScript errors
2. **Check network tab** for failed requests
3. **Check Supabase logs** in your dashboard
4. **Verify OAuth flow** by checking redirect URLs
5. **Test with different browsers** to rule out browser-specific issues
6. **Check the callback URL** - ensure it matches exactly in Google Console

### Security Considerations

- Keep your OAuth client secret secure
- Use HTTPS in production (Vercel provides this automatically)
- Regularly rotate your OAuth credentials
- Monitor OAuth usage in Google Cloud Console
- Implement proper session management
- Consider adding rate limiting for OAuth attempts

## Code Structure

```
app/
├── auth/
│   ├── signin/page.tsx          # Sign-in form with Google button
│   └── callback/route.ts        # OAuth callback handler with state validation
components/
└── AuthProvider.tsx             # Authentication context & functions
```

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Next.js Authentication](https://nextjs.org/docs/authentication)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Vercel Deployment](https://vercel.com/docs)

## Support

If you encounter issues:

1. **Check the Supabase logs** in your dashboard
2. **Verify your Google OAuth configuration**
3. **Ensure all environment variables are set correctly**
4. **Check the browser console** for any JavaScript errors
5. **Test the OAuth flow step by step**
6. **Check network requests** in browser dev tools
7. **Verify redirect URIs** match exactly in Google Console
8. **Check Vercel deployment logs** for production issues

## Testing Checklist

- [ ] Google OAuth button appears on sign-in page
- [ ] Clicking button redirects to Google
- [ ] Google consent screen displays correctly
- [ ] After consent, user is redirected back with code and state
- [ ] Callback route properly validates state parameter
- [ ] User session is created successfully
- [ ] User is redirected to dashboard
- [ ] Session persists across page refreshes
- [ ] Error handling works for failed attempts
- [ ] OAuth state validation works correctly
- [ ] Production deployment works on quickscanar.com
- [ ] HTTPS redirects work properly in production
