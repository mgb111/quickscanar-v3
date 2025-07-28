# Deployment Guide

This guide will walk you through deploying QuickScanAR to Vercel with Supabase as the backend.

## Prerequisites

- GitHub account
- Vercel account
- Supabase account
- Node.js 18+ installed locally

## Step 1: Set up Supabase

### 1.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `quickscanar-v3`
   - Database Password: Choose a strong password
   - Region: Choose closest to your users
5. Click "Create new project"

### 1.2 Get API Keys

1. Go to Settings > API in your Supabase dashboard
2. Copy the following values:
   - Project URL
   - Anon public key
   - Service role key (keep this secret!)

### 1.3 Set up Database

1. Go to SQL Editor in your Supabase dashboard
2. Copy and paste the contents of `supabase-setup.sql`
3. Click "Run" to execute the SQL

### 1.4 Create Storage Buckets

1. Go to Storage in your Supabase dashboard
2. Create three new buckets:

#### Markers Bucket
- Name: `markers`
- Public bucket: ✅ Yes
- File size limit: 10MB
- Allowed MIME types: `image/*`

#### Videos Bucket
- Name: `videos`
- Public bucket: ✅ Yes
- File size limit: 50MB
- Allowed MIME types: `video/mp4`

#### Mind Files Bucket
- Name: `mind-files`
- Public bucket: ✅ Yes
- File size limit: 5MB
- Allowed MIME types: `application/octet-stream`

### 1.5 Configure Storage Policies

For each bucket, go to Settings > Policies and add these policies:

#### Markers Bucket Policies
```sql
-- Allow authenticated users to upload
CREATE POLICY "Users can upload markers" ON storage.objects
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow public read access
CREATE POLICY "Public can view markers" ON storage.objects
FOR SELECT USING (true);
```

#### Videos Bucket Policies
```sql
-- Allow authenticated users to upload
CREATE POLICY "Users can upload videos" ON storage.objects
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow public read access
CREATE POLICY "Public can view videos" ON storage.objects
FOR SELECT USING (true);
```

#### Mind Files Bucket Policies
```sql
-- Allow authenticated users to upload
CREATE POLICY "Users can upload mind files" ON storage.objects
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow public read access
CREATE POLICY "Public can view mind files" ON storage.objects
FOR SELECT USING (true);
```

## Step 2: Prepare Your Code

### 2.1 Update Environment Variables

1. Create a `.env.local` file in your project root
2. Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2.2 Test Locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to test your application.

## Step 3: Deploy to Vercel

### 3.1 Push to GitHub

1. Create a new repository on GitHub
2. Push your code:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/quickscanar-v3.git
git push -u origin main
```

### 3.2 Deploy with Vercel

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - Framework Preset: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### 3.3 Add Environment Variables

In your Vercel project settings:

1. Go to Settings > Environment Variables
2. Add the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

3. Make sure to add them to all environments (Production, Preview, Development)

### 3.4 Deploy

1. Click "Deploy"
2. Wait for the build to complete
3. Your app will be available at `https://your-project.vercel.app`

## Step 4: Configure Custom Domain (Optional)

1. Go to your Vercel project settings
2. Click "Domains"
3. Add your custom domain
4. Follow the DNS configuration instructions

## Step 5: Test Your Deployment

### 5.1 Test Authentication

1. Visit your deployed app
2. Try signing up with a new account
3. Verify you receive a confirmation email
4. Test signing in

### 5.2 Test File Upload

1. Sign in to your account
2. Go to "Create New Experience"
3. Upload a test image and video
4. Verify the files are stored in Supabase Storage

### 5.3 Test AR Experience

1. Create an AR experience
2. Copy the experience URL
3. Open it on a mobile device
4. Test the AR functionality

## Troubleshooting

### Common Issues

#### Build Failures
- Check that all dependencies are in `package.json`
- Verify TypeScript compilation
- Check Vercel build logs

#### Authentication Issues
- Verify Supabase environment variables
- Check Supabase Auth settings
- Ensure email confirmation is configured

#### File Upload Issues
- Check storage bucket permissions
- Verify file size limits
- Check CORS settings

#### AR Not Working
- Ensure you're on HTTPS
- Test on mobile devices
- Check browser console for errors

### Monitoring

1. **Vercel Analytics**: Monitor performance and errors
2. **Supabase Dashboard**: Check database and storage usage
3. **Browser Console**: Debug client-side issues

## Security Considerations

1. **Environment Variables**: Never commit secrets to Git
2. **CORS**: Configure Supabase CORS settings properly
3. **RLS**: Ensure Row Level Security is enabled
4. **File Validation**: Validate uploaded files on the server
5. **Rate Limiting**: Consider adding rate limiting for uploads

## Performance Optimization

1. **Image Optimization**: Use Next.js Image component
2. **CDN**: Vercel provides global CDN
3. **Caching**: Implement proper caching strategies
4. **Bundle Size**: Monitor and optimize bundle size

## Maintenance

1. **Regular Updates**: Keep dependencies updated
2. **Monitoring**: Set up error monitoring
3. **Backups**: Regular database backups
4. **Security**: Regular security audits

## Support

If you encounter issues:

1. Check the troubleshooting section
2. Review Vercel and Supabase documentation
3. Check GitHub issues
4. Contact support if needed

---

Your QuickScanAR app should now be live and ready to use! 🚀 