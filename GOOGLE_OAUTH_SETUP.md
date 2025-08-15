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

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. **"No authorization code received" Error** ⚠️ **CURRENT ISSUE**
**Problem**: After Google OAuth, user gets redirected to signin page with "No authorization code received" error.

**Root Cause**: Supabase is redirecting to relative path `/auth/callback` instead of full URL `https://quickscanar.com/auth/callback`.

**Immediate Fix Required**:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `pmbrotwuukafunqpttsm`
3. Go to **Settings → General**
4. Set **Site URL** to: `https://quickscanar.com` (include the protocol!)
5. Click **Save**
6. Wait 2-3 minutes for changes to propagate

**Why This Happens**: When Supabase's Site URL is not properly configured, it redirects to relative paths instead of absolute URLs, causing the authorization code to be lost.

**Verification**: After the fix, the OAuth flow should redirect to `https://quickscanar.com/auth/callback?code=...&state=...` instead of `/auth/callback`.

#### 2. **"requested path is invalid" Error** ✅ **FIXED**
**Problem**: Google OAuth redirects to `https://pmbrotwuukafunqpttsm.supabase.co/quickscanar.com` (404 error).

**Root Cause**: Supabase project's "Site URL" was set to `quickscanar.com` (missing `https://` protocol).

**Solution**: Update Supabase Site URL to `https://quickscanar.com` (include the protocol).

#### 3. **"invalid request: both auth code and code verifier should be non-empty" Error** ✅ **FIXED**
**Problem**: OAuth flow fails with PKCE (Proof Key for Code Exchange) error.

**Root Cause**: Custom query parameters were interfering with Supabase's PKCE flow.

**Solution**: Removed custom `queryParams` from `signInWithOAuth` call, allowing Supabase to handle PKCE correctly.

#### 4. **"bad_oauth_state" Error** ✅ **FIXED**
**Problem**: OAuth callback fails with invalid state parameter.

**Root Cause**: OAuth state parameter mismatch or redirect URI configuration issue.

**Solution**: Updated callback route to handle state parameters correctly and added proper error handling.

#### 5. **Still Redirecting to Localhost After Sign-In** ✅ **FIXED**
**Problem**: User gets redirected to `localhost:3003` instead of `quickscanar.com` after Google sign-in.

**Root Cause**: Multiple configuration issues:
- Supabase project "Site URL" not set correctly
- Environment variables not configured properly
- Redirect URL construction logic issues

**Solution**: 
1. ✅ Updated Supabase Site URL to `https://quickscanar.com`
2. ✅ Added `NEXT_PUBLIC_SITE_URL=https://quickscanar.com` to environment
3. ✅ Fixed redirect URL construction logic in `AuthProvider.tsx`
4. ✅ Updated callback route to handle relative vs absolute redirects

### Debugging Steps

1. **Check Browser Console**: Look for OAuth redirect debug information
2. **Check Server Console**: Look for callback route debug information  
3. **Use Debug Page**: Visit `/debug` to see current OAuth configuration
4. **Verify Network Requests**: Check browser Network tab for redirect chain
5. **Test OAuth Flow**: Use the debug page's "Test OAuth Redirect" button

### Current Status

- ✅ **Google OAuth Setup**: Complete
- ✅ **Supabase Integration**: Complete  
- ✅ **Redirect URL Logic**: Fixed
- ✅ **PKCE Flow**: Fixed
- ✅ **State Handling**: Fixed
- ⚠️ **Supabase Site URL**: **NEEDS UPDATE** (see Immediate Fix above)
- ✅ **Production Deployment**: Ready (after Site URL fix)

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
