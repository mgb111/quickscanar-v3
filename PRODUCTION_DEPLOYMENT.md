# Production Deployment Checklist for quickscanar.com

This checklist covers everything needed to deploy QuickScanAR to production on Vercel with the domain quickscanar.com.

## ✅ **Pre-Deployment Checklist**

### 1. Google OAuth Configuration
- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Add `https://quickscanar.com/auth/callback` as authorized redirect URI
- [ ] Verify OAuth 2.0 credentials are active
- [ ] Note down Client ID and Client Secret

### 2. Supabase Configuration
- [ ] Enable Google provider in Supabase dashboard
- [ ] Add Google OAuth credentials (Client ID + Secret)
- [ ] **CRITICAL**: Set Site URL to `https://quickscanar.com` in Supabase Settings → General
- [ ] Verify Supabase project is on production plan
- [ ] Check that all required tables exist
- [ ] Verify RLS policies are configured correctly

### 3. Environment Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Set in Vercel
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Set in Vercel
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Set in Vercel (if needed)
- [ ] `NEXT_PUBLIC_SITE_URL=https://quickscanar.com` - **CRITICAL for OAuth redirects**
- [ ] Verify all variables are set in Vercel dashboard

### 4. Domain Configuration
- [ ] Domain `quickscanar.com` is owned and accessible
- [ ] DNS is configured to point to Vercel
- [ ] SSL certificate will be automatically provisioned by Vercel

## 🚀 **Vercel Deployment Steps**

### 1. Connect Repository
- [ ] Connect GitHub repository to Vercel
- [ ] Set build command: `npm run build`
- [ ] Set output directory: `.next`
- [ ] Set install command: `npm install`

### 2. Environment Variables
- [ ] Add all environment variables in Vercel dashboard
- [ ] Set environment to "Production"
- [ ] Verify variables are accessible during build

### 3. Domain Setup
- [ ] Add custom domain `quickscanar.com` in Vercel
- [ ] Configure DNS records as instructed by Vercel
- [ ] Wait for DNS propagation (can take up to 48 hours)
- [ ] Verify SSL certificate is provisioned

### 4. Deploy
- [ ] Trigger production deployment
- [ ] Monitor build logs for any errors
- [ ] Verify deployment is successful
- [ ] Test the live site

## 🧪 **Post-Deployment Testing**

### 1. Basic Functionality
- [ ] Homepage loads correctly
- [ ] Navigation works properly
- [ ] All pages are accessible
- [ ] No console errors in browser

### 2. Authentication Testing
- [ ] Google OAuth button appears on sign-in page
- [ ] Clicking Google sign-in redirects to Google
- [ ] OAuth consent screen displays correctly
- [ ] After consent, user is redirected back to quickscanar.com
- [ ] User session is created successfully
- [ ] User is redirected to dashboard
- [ ] Session persists across page refreshes

### 3. OAuth Flow Verification
- [ ] Test with production Google OAuth credentials
- [ ] Verify callback URL `https://quickscanar.com/auth/callback` works
- [ ] Check that state parameter validation works
- [ ] Test error handling for failed OAuth attempts

### 4. Performance & Security
- [ ] HTTPS is working correctly
- [ ] No mixed content warnings
- [ ] Page load times are acceptable
- [ ] Mobile responsiveness works
- [ ] No sensitive data exposed in client-side code

## 🔧 **Troubleshooting Common Issues**

### Build Failures
- [ ] Check Vercel build logs
- [ ] Verify all dependencies are in package.json
- [ ] Ensure Node.js version is compatible (22.x)
- [ ] Check for TypeScript compilation errors

### OAuth Issues
- [ ] Verify redirect URI matches exactly in Google Console
- [ ] Check Supabase logs for authentication errors
- [ ] Ensure environment variables are set correctly
- [ ] Test OAuth flow step by step
- [ ] **CRITICAL**: Set `NEXT_PUBLIC_SITE_URL=https://quickscanar.com` in Vercel
- [ ] **CRITICAL**: Verify OAuth redirects to quickscanar.com, not localhost

### Domain Issues
- [ ] Verify DNS records are correct
- [ ] Wait for DNS propagation
- [ ] Check Vercel domain configuration
- [ ] Verify SSL certificate status

## 📊 **Monitoring & Maintenance**

### 1. Performance Monitoring
- [ ] Set up Vercel Analytics (optional)
- [ ] Monitor Core Web Vitals
- [ ] Track page load times
- [ ] Monitor API response times

### 2. Error Tracking
- [ ] Set up error monitoring (e.g., Sentry)
- [ ] Monitor authentication failures
- [ ] Track OAuth callback errors
- [ ] Monitor Supabase connection issues

### 3. Security
- [ ] Regularly rotate OAuth credentials
- [ ] Monitor for suspicious authentication attempts
- [ ] Keep dependencies updated
- [ ] Review access logs periodically

## 🔄 **Update Process**

### 1. Development Workflow
- [ ] Make changes in development branch
- [ ] Test locally with `npm run dev`
- [ ] Test build with `npm run build`
- [ ] Push to GitHub

### 2. Deployment
- [ ] Vercel automatically deploys on push to main branch
- [ ] Monitor deployment status
- [ ] Verify changes are live
- [ ] Test critical functionality

### 3. Rollback (if needed)
- [ ] Use Vercel's rollback feature
- [ ] Revert to previous deployment
- [ ] Investigate and fix issues
- [ ] Redeploy when ready

## 📞 **Support Contacts**

- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **Supabase Support**: [supabase.com/support](https://supabase.com/support)
- **Google Cloud Support**: [cloud.google.com/support](https://cloud.google.com/support)

## 📝 **Deployment Notes**

- **Last Deployed**: [Date]
- **Deployment URL**: [Vercel URL]
- **Domain**: quickscanar.com
- **SSL Status**: ✅ Active (Vercel)
- **Build Status**: ✅ Successful
- **OAuth Status**: ✅ Working

---

**Remember**: Always test thoroughly in development before deploying to production. The OAuth flow is critical for user authentication, so ensure it's working correctly before going live.
