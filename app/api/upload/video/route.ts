import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key if available for server-side uploads; fallback to anon for local/demo
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
})

// This route now only returns a signed URL for direct-to-R2 upload (no file handling here)
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, fileType, contentType } = body;

    if (!fileName || !contentType) {
      return NextResponse.json({ error: 'Missing fileName or contentType' }, { status: 400 });
    }

    // Validate file type (optional, but recommended)
    const allowedTypes = [
      'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/quicktime'
    ];
    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json({
        error: `Unsupported video format. Please use MP4, WebM, or MOV files. Current type: ${contentType}`
      }, { status: 400 });
    }

    // Generate a signed URL for R2 (example, replace with your actual signing logic)
    // Here we just return a fake URL for illustration
    // You should use your R2 SDK or backend logic to generate the signed URL
    const signedUrl = `https://pub-d1d447d39fae4aaf9194ec01c5252450.r2.dev/${fileName}?signed=example`;
    const key = fileName;

    return NextResponse.json({ signedUrl, key });
  } catch (error) {
    console.error('Video upload error:', error);
    return NextResponse.json(
      { error: `Video upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}