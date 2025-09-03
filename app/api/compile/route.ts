import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

// Ensure this route runs on the Node.js runtime (required for Puppeteer)
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    console.log('Starting Puppeteer-based compilation...')
    
    // Parse the form data
    const formData = await request.formData()
    const markerImage = formData.get('markerImage') as File
    
    if (!markerImage) {
      console.log('No marker image provided')
      return NextResponse.json(
        { success: false, message: 'No marker image provided' },
        { status: 400 }
      )
    }

    console.log('Marker image received:', markerImage.name, markerImage.type, markerImage.size)

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(markerImage.type)) {
      console.log('Invalid file type:', markerImage.type)
      return NextResponse.json(
        { success: false, message: 'Invalid file type. Only JPEG and PNG images are allowed.' },
        { status: 400 }
      )
    }

    // Setup file paths
    const uniqueId = uuidv4()
    const mindFileName = `${uniqueId}.mind`
    const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.cwd().includes('/var/task')
    
    let uploadsDir: string
    let mindFilePath: string
    let publicPath: string
    
    if (isServerless) {
      uploadsDir = '/tmp'
      mindFilePath = path.join(uploadsDir, mindFileName)
      publicPath = `/api/download/${mindFileName}`
    } else {
      uploadsDir = path.join(process.cwd(), 'public', 'uploads')
      if (!existsSync(uploadsDir)) {
        console.log('Creating uploads directory:', uploadsDir)
        await mkdir(uploadsDir, { recursive: true })
      }
      mindFilePath = path.join(uploadsDir, mindFileName)
      publicPath = `/uploads/${mindFileName}`
    }

    console.log('Generated file path:', mindFilePath)

    // Since CDN loading fails in headless browser, trigger fallback immediately
    console.log('CDN loading not reliable in serverless headless browser, using fallback approach')
    
    // Save the image for manual compilation
    const imageBuffer = Buffer.from(await markerImage.arrayBuffer())
    await writeFile(mindFilePath.replace('.mind', '_image.jpg'), imageBuffer)
    
    return NextResponse.json({
      success: false,
      requiresManualCompilation: true,
      message: 'Server-side compilation temporarily unavailable. Please use manual compilation.',
      compilerUrl: '/compiler',
      instructions: [
        'Go to the AR Image Converter page',
        'Upload your marker image',
        'Download the compiled .mind file',
        'Return to create your AR experience with the .mind file'
      ]
    })

  } catch (error) {
    console.error('Puppeteer compilation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, message: `Compilation failed: ${errorMessage}` },
      { status: 500 }
    )
  }
}

// Optional: Add GET method to check endpoint status
export async function GET() {
  return NextResponse.json({
    message: 'MindAR Compilation Endpoint',
    status: 'active',
    supportedFormats: ['image/jpeg', 'image/png']
  })
}
