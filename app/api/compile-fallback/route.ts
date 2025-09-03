import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

// Fallback compilation endpoint that returns instructions for manual compilation
export async function POST(request: NextRequest) {
  try {
    console.log('Fallback compilation endpoint called')
    
    // Parse the form data
    const formData = await request.formData()
    const markerImage = formData.get('markerImage') as File
    
    if (!markerImage) {
      return NextResponse.json(
        { success: false, message: 'No marker image provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(markerImage.type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid file type. Only JPEG and PNG images are allowed.' },
        { status: 400 }
      )
    }

    // Setup file paths for saving the uploaded image
    const uniqueId = uuidv4()
    const imageFileName = `${uniqueId}_${markerImage.name}`
    const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.cwd().includes('/var/task')
    
    let uploadsDir: string
    let imageFilePath: string
    let publicImagePath: string
    
    if (isServerless) {
      uploadsDir = '/tmp'
      imageFilePath = path.join(uploadsDir, imageFileName)
      publicImagePath = `/api/download/${imageFileName}`
    } else {
      uploadsDir = path.join(process.cwd(), 'public', 'uploads')
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true })
      }
      imageFilePath = path.join(uploadsDir, imageFileName)
      publicImagePath = `/uploads/${imageFileName}`
    }

    // Save the uploaded image
    const imageBuffer = Buffer.from(await markerImage.arrayBuffer())
    await writeFile(imageFilePath, imageBuffer)

    console.log('Image saved for manual compilation:', imageFilePath)

    // Return response indicating manual compilation is needed
    return NextResponse.json({
      success: false,
      requiresManualCompilation: true,
      message: 'Server-side compilation temporarily unavailable. Please use manual compilation.',
      imageUrl: publicImagePath,
      compilerUrl: '/compiler',
      instructions: [
        'Go to the AR Image Converter page',
        'Upload your marker image',
        'Download the compiled .mind file',
        'Return to create your AR experience with the .mind file'
      ]
    })

  } catch (error) {
    console.error('Fallback compilation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, message: `Compilation failed: ${errorMessage}` },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Fallback MindAR Compilation Endpoint',
    status: 'active',
    note: 'This endpoint provides fallback when server-side compilation is unavailable'
  })
}
