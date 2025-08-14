# Google OAuth Setup for QuickScanAR

This guide will help you set up Google Sign-In for your QuickScanAR application using Supabase.

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
     - `https://your-project.supabase.co/auth/v1/callback`
     - `http://localhost:54321/auth/v1/callback` (for local development)
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
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Step 4: Test the Integration

1. Start your development server
2. Go to the sign-in or sign-up page
3. Click "Sign in with Google" or "Sign up with Google"
4. You should be redirected to Google's OAuth consent screen
5. After authorization, you'll be redirected back to your app

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI" error**:
   - Make sure the redirect URI in Google Cloud Console matches exactly
   - Check that your Supabase project URL is correct

2. **"Provider not enabled" error**:
   - Ensure Google provider is enabled in Supabase
   - Verify your OAuth credentials are correct

3. **Callback errors**:
   - Check that the auth callback route is properly configured
   - Verify your environment variables

### Security Considerations

- Keep your OAuth client secret secure
- Use HTTPS in production
- Regularly rotate your OAuth credentials
- Monitor OAuth usage in Google Cloud Console

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Next.js Authentication](https://nextjs.org/docs/authentication)

## Support

If you encounter issues:
1. Check the Supabase logs in your dashboard
2. Verify your Google OAuth configuration
3. Ensure all environment variables are set correctly
4. Check the browser console for any JavaScript errors
