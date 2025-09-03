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

    // Convert image to base64 for browser processing
    const imageBuffer = Buffer.from(await markerImage.arrayBuffer())
    const imageBase64 = `data:${markerImage.type};base64,${imageBuffer.toString('base64')}`

    // Launch Puppeteer browser with serverless-compatible Chrome
    console.log('Launching headless browser...')
    
    const browser = await puppeteer.launch({
      args: isServerless ? chromium.args : [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: isServerless ? await chromium.executablePath() : undefined,
      headless: true
    })

    try {
      const page = await browser.newPage()
      
      // Create HTML page with MindAR compiler
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script src="https://cdn.jsdelivr.net/npm/@maherboughdiri/mind-ar-compiler@1.0.1/index.js"></script>
        </head>
        <body>
          <div id="progress">0%</div>
          <script>
            window.compileImage = async function(imageBase64) {
              try {
                console.log('Starting compilation in browser...')
                
                // Convert base64 to File object
                const response = await fetch(imageBase64)
                const blob = await response.blob()
                const file = new File([blob], 'marker.jpg', { type: 'image/jpeg' })
                
                console.log('File created, size:', file.size)
                
                // Import and use MindAR compiler
                const { default: compiler } = await import('https://cdn.jsdelivr.net/npm/@maherboughdiri/mind-ar-compiler@1.0.1/index.js')
                
                if (!compiler || !compiler.compileFiles) {
                  throw new Error('MindAR compiler not available or missing compileFiles method')
                }
                
                console.log('Compiler loaded, starting compilation...')
                const result = await compiler.compileFiles([file], 'progress')
                console.log('Compilation completed')
                
                // Convert ArrayBuffer to base64 for transfer
                const uint8Array = new Uint8Array(result)
                const base64 = btoa(String.fromCharCode.apply(null, uint8Array))
                return { success: true, data: base64 }
              } catch (error) {
                console.error('Browser compilation error:', error)
                return { success: false, error: error.message }
              }
            }
          </script>
        </body>
        </html>
      `
      
      await page.setContent(html)
      console.log('Page content loaded')
      
      // Wait for script to load
      await page.waitForFunction('window.compileImage', { timeout: 30000 })
      console.log('Compiler function ready')
      
      // Execute compilation
      console.log('Executing compilation in browser...')
      const result = await page.evaluate(async (imageBase64) => {
        return await (window as any).compileImage(imageBase64)
      }, imageBase64)
      
      if (!result.success) {
        throw new Error(`Browser compilation failed: ${result.error}`)
      }
      
      // Convert base64 back to buffer and save
      const compiledBuffer = Buffer.from(result.data, 'base64')
      await writeFile(mindFilePath, compiledBuffer)
      
      console.log('Puppeteer compilation completed successfully')
      
      return NextResponse.json({
        success: true,
        message: 'Image compilation successful',
        filePath: publicPath,
        fileName: mindFileName
      })
      
    } finally {
      await browser.close()
      console.log('Browser closed')
    }

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
