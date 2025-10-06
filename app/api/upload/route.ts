import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key if available for server-side uploads; fallback to anon for local/demo
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey,
  { auth: { persistSession: false } }
)

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    console.log('☁️  Upload request received')
    
    // Accept both form-data and JSON (base64) for flexibility
    let file: File | null = null;
    let fileType: string | null = null;
    let fileName: string | null = null;
    let contentType: string | null = null;
    let buffer: Buffer | null = null;
    let isBase64 = false;
    let base64Data: string | null = null;

    // Try formData first
    try {
      const formData = await request.formData();
      file = formData.get('file') as File;
      fileType = formData.get('fileType') as string || null;
      fileName = file?.name || null;
      contentType = file?.type || null;
      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      }
    } catch {}

    // If no file, try JSON (base64)
    if (!file) {
      try {
        const body = await request.json();
        fileName = body.fileName;
        fileType = body.fileType;
        contentType = body.contentType;
        base64Data = body.base64Data;
        if (base64Data) {
          buffer = Buffer.from(base64Data, 'base64');
          isBase64 = true;
        }
      } catch {}
    }

    if (!buffer || !fileName || !fileType) {
      return NextResponse.json({ error: 'No file uploaded or missing fields' }, { status: 400 });
    }

    console.log('📁 File details:', {
      name: fileName,
      type: contentType,
      fileType,
      size: buffer.length,
      sizeMB: (buffer.length / 1024 / 1024).toFixed(2),
      isBase64
    })

    // .mind file logic
    if (fileType === 'mind' || fileName.endsWith('.mind')) {
      if (!fileName.endsWith('.mind')) {
        return NextResponse.json({ error: 'Invalid file type. Must be a .mind file.' }, { status: 400 });
      }
      if (buffer.length < 1000) {
        return NextResponse.json({ error: 'Invalid .mind file. File is too small.' }, { status: 400 });
      }
      
      const path = `mind-${Date.now()}-${fileName}`;
      console.log('📤 Uploading .mind file to Supabase storage...')
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('mind-files')
        .upload(path, buffer, {
          contentType: 'application/octet-stream',
          upsert: false
        });
      
      if (uploadError) {
        console.error('❌ .mind upload error:', uploadError);
        throw new Error(`Failed to upload .mind file: ${uploadError.message}`);
      }
      
      const { data: urlData } = supabase.storage
        .from('mind-files')
        .getPublicUrl(path);
      
      console.log('✅ .mind file uploaded successfully:', urlData.publicUrl)
      return NextResponse.json({ 
        success: true, 
        url: urlData.publicUrl, 
        fileName: path 
      });
    }

    // Video file logic (also allow GIF as animated image treated like video)
    if (fileType === 'video' || (contentType && (contentType.startsWith('video/') || contentType === 'image/gif'))) {
      const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/quicktime', 'image/gif'];
      if (!allowedTypes.includes(contentType || '')) {
        return NextResponse.json({ 
          error: `Unsupported video format. Please use MP4, WebM, MOV, or GIF files. Current type: ${contentType}` 
        }, { status: 400 });
      }
      
      const maxSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB || '100');
      const maxSizeInBytes = maxSizeMB * 1024 * 1024;
      if (buffer.length > maxSizeInBytes) {
        return NextResponse.json({ 
          error: `Video file too large. Maximum size is ${maxSizeMB}MB, your file is ${(buffer.length / 1024 / 1024).toFixed(1)}MB` 
        }, { status: 413 });
      }
      
      const fileNameFinal = `video-${Date.now()}-${fileName}`;
      console.log('📤 Uploading video file to Supabase storage...')
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileNameFinal, buffer, {
          contentType: contentType || undefined,
          upsert: false
        });
      
      if (uploadError) {
        console.error('❌ Video upload error:', uploadError);
        throw new Error(`Failed to upload video: ${uploadError.message}`);
      }
      
      const { data: urlData } = supabase.storage
        .from('videos')
        .getPublicUrl(fileNameFinal);
      
      console.log('✅ Video file uploaded successfully:', urlData.publicUrl)
      return NextResponse.json({ 
        success: true, 
        url: urlData.publicUrl,
        fileName: fileNameFinal
      });
    }

    return NextResponse.json({ 
      error: 'Only .mind and video files are supported in this endpoint.' 
    }, { status: 400 });
    
  } catch (error: any) {
    console.error('❌ Upload error:', error);
    return NextResponse.json(
      { error: `Upload failed: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

