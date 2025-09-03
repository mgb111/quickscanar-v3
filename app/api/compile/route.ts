import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    console.log('Starting compilation request...')
    
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

    // In serverless environments, we can't write to the file system
    // Instead, we'll return the compiled data directly or use a temporary storage solution
    const uniqueId = uuidv4()
    const mindFileName = `${uniqueId}.mind`
    
    // Check if we're in a serverless environment (like Vercel)
    const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.cwd().includes('/var/task')
    
    let uploadsDir: string
    let mindFilePath: string
    let publicPath: string
    
    if (isServerless) {
      // In serverless, use /tmp directory which is writable
      uploadsDir = '/tmp'
      mindFilePath = path.join(uploadsDir, mindFileName)
      publicPath = `/api/download/${mindFileName}` // We'll need a download endpoint
    } else {
      // Local development - use public/uploads
      uploadsDir = path.join(process.cwd(), 'public', 'uploads')
      if (!existsSync(uploadsDir)) {
        console.log('Creating uploads directory:', uploadsDir)
        await mkdir(uploadsDir, { recursive: true })
      }
      mindFilePath = path.join(uploadsDir, mindFileName)
      publicPath = `/uploads/${mindFileName}`
    }

    console.log('Generated file path:', mindFilePath)

    // Import the MindAR compiler (dynamic import for ES modules)
    let compiler
    try {
      console.log('Importing MindAR compiler...')
      const mindArCompiler = await import('@maherboughdiri/mind-ar-compiler')
      compiler = mindArCompiler.default || mindArCompiler
      console.log('MindAR compiler imported successfully')
    } catch (importError) {
      console.error('Failed to import MindAR compiler:', importError)
      return NextResponse.json(
        { success: false, message: 'MindAR compiler not available. Please install @maherboughdiri/mind-ar-compiler' },
        { status: 500 }
      )
    }

    // Compile the image using MindAR compiler
    let compiledData
    try {
      console.log('Starting image compilation...')
      
      // According to the documentation, compileFiles expects an array of File objects
      const files = [markerImage]
      compiledData = await compiler.compileFiles(files)
      
      console.log('Image compilation completed successfully')
    } catch (compileError) {
      console.error('MindAR compilation failed:', compileError)
      const errorMessage = compileError instanceof Error ? compileError.message : 'Unknown compilation error'
      return NextResponse.json(
        { success: false, message: `Failed to compile image for AR tracking: ${errorMessage}` },
        { status: 500 }
      )
    }

    // Save the compiled .mind file
    try {
      console.log('Saving compiled data to file...')
      
      // The compiled data should be an ArrayBuffer according to the API
      let dataToWrite: Buffer
      if (compiledData instanceof ArrayBuffer) {
        dataToWrite = Buffer.from(compiledData)
      } else if (typeof compiledData === 'object' && compiledData && 'arrayBuffer' in compiledData) {
        // Handle Blob-like objects
        const blob = compiledData as Blob
        dataToWrite = Buffer.from(await blob.arrayBuffer())
      } else if (Buffer.isBuffer(compiledData)) {
        dataToWrite = compiledData
      } else {
        // Fallback: try to convert to buffer
        dataToWrite = Buffer.from(compiledData as any)
      }
      
      await writeFile(mindFilePath, dataToWrite)
      console.log('File saved successfully')
    } catch (writeError) {
      console.error('Failed to save compiled file:', writeError)
      const errorMessage = writeError instanceof Error ? writeError.message : 'Unknown write error'
      return NextResponse.json(
        { success: false, message: `Failed to save compiled file: ${errorMessage}` },
        { status: 500 }
      )
    }

    // Return success response with file path
    console.log('Compilation process completed successfully')
    return NextResponse.json({
      success: true,
      message: 'Image compilation successful',
      filePath: publicPath,
      fileName: mindFileName
    })

  } catch (error) {
    console.error('Compilation endpoint error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, message: `Internal server error during compilation: ${errorMessage}` },
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
