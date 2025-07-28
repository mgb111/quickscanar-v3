# QuickScanAR - AR Experience Creator

A full-stack SaaS application that lets users create their own AR experiences by uploading marker images and videos. Built with Next.js, Supabase, and MindAR.

## 🚀 Features

- **User Authentication**: Sign up/sign in with Supabase Auth
- **File Upload**: Drag & drop interface for marker images and videos
- **AR Generation**: Automatic conversion of images to MindAR compatible files
- **Storage**: Secure file storage in Supabase Storage buckets
- **Public Sharing**: Generate shareable links for AR experiences
- **QR Codes**: Easy sharing via QR codes
- **Mobile Optimized**: Best AR experience on mobile devices
- **Dashboard**: Manage and view all your AR experiences

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Auth, Database, Storage)
- **AR Framework**: A-Frame + MindAR
- **File Handling**: React Dropzone
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **QR Codes**: qrcode.react

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Vercel account (for deployment)

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd quickscanar-v3
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from Settings > API
3. Create the following storage buckets:
   - `markers` (public)
   - `videos` (public) 
   - `mind-files` (public)

#### Storage Bucket Setup:

**Step 1: Create Buckets**
1. Go to your Supabase dashboard
2. Navigate to Storage section
3. Click "Create a new bucket" for each of the following:

**Markers Bucket:**
- Name: `markers`
- Public bucket: ✅ Yes
- File size limit: 10MB
- Allowed MIME types: `image/*`

**Videos Bucket:**
- Name: `videos`
- Public bucket: ✅ Yes
- File size limit: 50MB
- Allowed MIME types: `video/mp4`

**Mind Files Bucket:**
- Name: `mind-files`
- Public bucket: ✅ Yes
- File size limit: 5MB
- Allowed MIME types: `application/octet-stream`

**Step 2: Set up Storage Policies**
After creating the buckets, run the SQL from `storage-setup.sql` in your Supabase SQL editor to configure the security policies.

### 4. Set up the database

Run this SQL in your Supabase SQL editor:

```sql
-- Create the ar_experiences table
CREATE TABLE ar_experiences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  marker_image_url TEXT NOT NULL,
  mind_file_url TEXT NOT NULL,
  video_url TEXT NOT NULL,
  preview_image_url TEXT,
  plane_width DECIMAL DEFAULT 1,
  plane_height DECIMAL DEFAULT 0.5625,
  video_rotation INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ar_experiences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own experiences" ON ar_experiences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own experiences" ON ar_experiences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own experiences" ON ar_experiences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own experiences" ON ar_experiences
  FOR DELETE USING (auth.uid() = user_id);

-- Allow public read access for viewing experiences
CREATE POLICY "Public can view experiences" ON ar_experiences
  FOR SELECT USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ar_experiences_updated_at 
  BEFORE UPDATE ON ar_experiences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 5. Configure environment variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📱 Usage

### Creating an AR Experience

1. **Sign up/Login**: Create an account or sign in
2. **Upload Files**: 
   - Upload a marker image (JPG/PNG)
   - Upload a video file (MP4)
3. **Configure Settings**: Set plane dimensions and video rotation
4. **Create**: Click "Create Experience" to generate your AR experience

### Viewing AR Experiences

1. **Mobile**: Open the experience link on your mobile device
2. **Point Camera**: Point your camera at the marker image
3. **Enjoy**: Watch your video play over the marker!

### Sharing

- **Direct Link**: Copy the experience URL
- **QR Code**: Scan the QR code with your mobile device
- **Dashboard**: Manage all your experiences from the dashboard

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Make sure to set these in your Vercel dashboard:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 🔧 Advanced Configuration

### MindAR Compiler Integration

To use the actual MindAR compiler instead of placeholder files:

1. Install the compiler:
```bash
npm install @maherboughdiri/mind-ar-compiler
```

2. Update the API route in `app/api/compile-mind/route.ts`:
```typescript
import { compileImage } from '@maherboughdiri/mind-ar-compiler'

// Replace the placeholder compilation with:
const mindFileBuffer = await compileImage(imageBuffer)
```

### Custom Storage Buckets

You can customize the storage bucket names by updating the bucket references in:
- `app/dashboard/create/page.tsx`
- `app/api/compile-mind/route.ts`

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure your Supabase storage buckets are configured for public access
2. **Authentication Issues**: Verify your Supabase environment variables
3. **File Upload Failures**: Check file size limits and bucket permissions
4. **AR Not Working**: Ensure you're on HTTPS and using a mobile device

### Development Tips

- Use the browser's developer tools to debug AR issues
- Test on actual mobile devices for best AR experience
- Monitor Supabase logs for backend issues

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support, email support@quickscanar.com or create an issue in this repository.

---

Built with ❤️ using Next.js, Supabase, and MindAR 